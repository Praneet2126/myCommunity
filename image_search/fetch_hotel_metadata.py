import os
import json
import asyncio
import aiohttp
from pathlib import Path

# Goibibo GraphQL endpoint
GQL_ENDPOINT = "https://enigma.goibibo.com/graphql"

# Headers from your batch_hotel_sync.py
HEADERS = {
    'accept': 'application/graphql+json, application/json',
    'authorization': 'Token b3d8cd44b40597a555cdffe7cf6c63209d2f5944',
    'content-type': 'application/json',
    'country': 'in',
    'ingo-version': 'release-1322',
    'ingo-web': 'true',
    'language': 'en',
    'meta-data': '{"source":"extranet"}',
    'meta-data-brand': 'INGO',
    'meta-data-platform': 'web',
    'meta-data-source': 'ingo_web',
    'origin': 'https://in.goibibo.com',
    'platform': 'Desktop',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Cookie': '__gi_vid=f2e8a678-9093-4fc1-b729-9775b7d8a613; OAUTH-GOIBIBO=MGT22339836f26edf4de51f63029d621f51e3eeb4447c55553549aab91f22bd82a2250701562b4c0da492c315efc4c2629b8P; gitokenid=g0d4jxe29v0erx9ow;'
}

def get_payload(hotel_code):
    # This query tries to fetch basic info including star rating and SEO URL
    # Using a known Goibibo GQL structure for hotel details
    return {
        "query": """
        query FetchHotelDetails($endpointRequestData: EndpointRequestData) {
          rpcFetchHotelDetails(endpointRequestData: $endpointRequestData) {
            data {
              hotelId
              name
              starRating
              seoUrl
            }
          }
        }
        """,
        "variables": {
            "endpointRequestData": {
                "rpcPicasso": {
                    "rpcHotelDetails": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code}
                    }
                }
            }
        }
    }

async def fetch_hotel_metadata(session, hotel_code):
    payload = get_payload(hotel_code)
    try:
        async with session.post(GQL_ENDPOINT, json=payload, timeout=10) as response:
            if response.status == 200:
                result = await response.json()
                print(f"DEBUG {hotel_code}: {result}")
                data = result.get('data', {}).get('rpcFetchHotelDetails', {}).get('data', {})
                if not data:
                    # Try another way to get data if first GQL failed
                    return await fetch_hotel_metadata_v2(session, hotel_code)
                
                stars = data.get('starRating', 0)
                seo_url = data.get('seoUrl', '')
                if seo_url and not seo_url.startswith('http'):
                    seo_url = f"https://www.goibibo.com{seo_url}"
                
                return {
                    "stars": int(stars) if stars else 4,
                    "external_link": seo_url
                }
            else:
                return await fetch_hotel_metadata_v2(session, hotel_code)
    except:
        return await fetch_hotel_metadata_v2(session, hotel_code)

async def fetch_hotel_metadata_v2(session, hotel_code):
    # Fallback to a simpler public API if GQL fails
    url = f"https://www.goibibo.com/hotels/get-hotel-info-v2/?hotel_id={hotel_code}"
    try:
        async with session.get(url, timeout=10) as response:
            if response.status == 200:
                data = await response.json()
                h_data = data.get('data', {}).get(hotel_code, {})
                if not h_data: return None
                stars = h_data.get('star_rating', 0)
                seo_url = h_data.get('seo_url', '')
                if seo_url and not seo_url.startswith('http'):
                    seo_url = f"https://www.goibibo.com{seo_url}"
                return {"stars": int(stars) if stars else 4, "external_link": seo_url}
    except:
        return None

async def main():
    # Path to hotels folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    hotels_dir = os.path.join(os.path.dirname(project_root), "hotels")
    
    if not os.path.exists(hotels_dir):
        print(f"Error: Hotels directory not found at {hotels_dir}")
        return

    print(f"Scanning hotels in: {hotels_dir}")
    hotel_folders = [f for f in os.listdir(hotels_dir) if os.path.isdir(os.path.join(hotels_dir, f))]
    
    async with aiohttp.ClientSession(headers=HEADERS, connector=aiohttp.TCPConnector(ssl=False)) as session:
        tasks = []
        folder_map = {}
        
        for folder in hotel_folders:
            info_path = os.path.join(hotels_dir, folder, "info.json")
            if os.path.exists(info_path):
                with open(info_path, 'r') as f:
                    try:
                        info_data = json.load(f)
                        hotel_code = info_data.get('hotel_code')
                        if hotel_code:
                            folder_map[hotel_code] = info_path
                            tasks.append(fetch_hotel_metadata(session, hotel_code))
                    except:
                        pass
        
        print(f"Found {len(tasks)} hotels with codes. Fetching metadata...")
        results = await asyncio.gather(*tasks)
        
        updated_count = 0
        for hotel_code, metadata in zip(folder_map.keys(), results):
            if metadata:
                info_path = folder_map[hotel_code]
                with open(info_path, 'r') as f:
                    info_data = json.load(f)
                
                # Update info.json
                info_data['stars'] = metadata['stars']
                info_data['external_link'] = metadata['external_link']
                
                with open(info_path, 'w') as f:
                    json.dump(info_data, f, indent=4)
                
                updated_count += 1
                print(f"Updated {info_data.get('name', hotel_code)}: {metadata['stars']} stars, Link: {metadata['external_link']}")
        
        print(f"\nSuccessfully updated {updated_count} hotels.")

if __name__ == "__main__":
    asyncio.run(main())
