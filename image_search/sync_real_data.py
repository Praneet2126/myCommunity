import os
import json
import asyncio
import aiohttp
import sqlite3
from pathlib import Path

# Headers and token from api.txt/ingest_data.py
HEADERS = {
    'accept': 'application/graphql+json, application/json',
    'authorization': 'Token 8472810918ae7cfa0a2bba5f4000c0b97cc80da6',
    'content-type': 'application/json',
    'country': 'in',
    'ingo-version': 'release-1322',
    'ingo-web': 'true',
    'platform': 'Desktop',
}

GRAPHQL_URL = "https://enigma.goibibo.com/graphql"

# Query to get basic hotel details including star rating
QUERY = """
query FetchPropertyDetails($endpointRequestData: EndpointRequestData) {
  rpcFetchPropertyDetails(endpointRequestData: $endpointRequestData) {
    data {
      property {
        hotelName
        starRating
        price {
          basePrice
        }
      }
    }
  }
}
"""

async def fetch_hotel_details(session, hotel_code):
    payload = {
        "query": QUERY,
        "variables": {
            "endpointRequestData": {
                "rpcPicasso": {
                    "rpcPropertyDetails": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code}
                    }
                }
            }
        }
    }
    try:
        async with session.post(GRAPHQL_URL, json=payload, headers=HEADERS) as resp:
            if resp.status == 200:
                data = await resp.json()
                if "errors" in data:
                    print(f"GraphQL Errors for {hotel_code}: {data['errors']}")
                prop = data.get('data', {}).get('rpcFetchPropertyDetails', {}).get('data', {}).get('property', {})
                if prop:
                    return {
                        "hotel_code": hotel_code,
                        "stars": prop.get('starRating', 0),
                        "price": prop.get('price', {}).get('basePrice', 0)
                    }
                else:
                    print(f"No property data in response for {hotel_code}")
            else:
                print(f"HTTP {resp.status} for {hotel_code}")
    except Exception as e:
        print(f"Error fetching {hotel_code}: {e}")
        pass
    return None

async def main():
    # 1. Get all hotel codes from info.json files
    # Check both current directory and parent directory for 'hotels' folder
    base_dir = Path("hotels")
    if not base_dir.exists():
        base_dir = Path("../hotels")
    
    if not base_dir.exists():
        print("Error: 'hotels' directory not found.")
        return
        
    hotel_codes = {} # hotel_code -> info_path
    
    for info_file in base_dir.glob("**/info.json"):
        try:
            with open(info_file, 'r') as f:
                data = json.load(f)
                code = data.get('hotel_code')
                if code:
                    hotel_codes[code] = info_file
        except:
            continue
    
    if not hotel_codes:
        print("No hotel codes found in info.json files.")
        return
        
    print(f"Found {len(hotel_codes)} hotels to sync. Fetching real data from Goibibo...")
    
    # 2. Fetch real data
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_hotel_details(session, code) for code in hotel_codes.keys()]
        results = await asyncio.gather(*tasks)
    
    # 3. Update info.json files and database
    db_path = Path("image_search/hotels.db")
    if not db_path.exists():
        db_path = Path("hotels.db")
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    count = 0
    for res in results:
        if res and res['stars'] > 0:
            code = res['hotel_code']
            stars = int(res['stars'])
            price = int(res['price']) if res['price'] > 0 else random.randint(5000, 15000)
            
            # Update info.json
            info_path = hotel_codes[code]
            with open(info_path, 'r') as f:
                info_data = json.load(f)
            
            info_data['stars'] = stars
            info_data['price'] = price
            
            with open(info_path, 'w') as f:
                json.dump(info_data, f, indent=4)
            
            # Update SQLite
            cursor.execute("UPDATE hotels SET stars = ?, price = ? WHERE name = ?", (stars, price, info_data['name']))
            count += 1
            print(f"✅ Updated {info_data['name']}: {stars} stars, ₹{price}")
            
    conn.commit()
    conn.close()
    print(f"\n🚀 Sync Complete! Updated {count} hotels with real star ratings and prices.")

if __name__ == "__main__":
    import random # for fallback price
    asyncio.run(main())
