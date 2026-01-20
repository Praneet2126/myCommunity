import os
import json
import requests
import asyncio
import aiohttp
from typing import List, Dict, Any

HOTEL_CODES = [
    "1000000063", "1000000073", "1000000121", "1000000151", "1000000188", "1000000194",
    "1000000209", "1000000210", "1000000220", "1000000236", "1000000295", "1000000319",
    "1000000351", "1000000422", "1000000453", "1000000454", "1000000455", "1000000456",
    "1000000468", "1000000544", "1000000576", "1000000675", "1000000684", "1000000820",
    "1000000831", "1000000835", "1000000838", "1000000842", "1000000844", "1000000856",
    "1000000866", "1000000873", "1000000894", "1000000902", "1000000924", "1000000936",
    "1000000947", "1000000963", "1000000975", "1000000980", "1000000982", "1000000989",
    "1000001000", "1000001006", "1000001101", "1000001170", "1000001304", "1000001308",
    "1000001313", "1000001314", "1000001317", "1000001319", "1000001320", "1000001324",
    "1000001325", "1000001326", "1000001328", "1000001329", "1000001331", "1000001332",
    "1000001338", "1000001342", "1000001344", "1000001347", "1000001349", "1000001357",
    "1000001375", "1000001378", "1000001411", "1000001441", "1000001472", "1000001518",
    "1000001535", "1000001563", "1000001570", "1000001580", "1000001598", "1000001605",
    "1000001610", "1000001617", "1000001625", "1000001627", "1000001630", "1000001634",
    "1000001635", "1000001639", "1000001645", "1000001647", "1000001649", "1000001653",
    "1000001654", "1000001661", "1000001665", "1000001669", "1000001672", "1000001673",
    "1000001676", "1000001684", "1000001689", "1000001694"
]

GRAPHQL_URL = "https://enigma.goibibo.com/graphql"
HEADERS = {
    'accept': 'application/graphql+json, application/json',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'authorization': 'Token 8472810918ae7cfa0a2bba5f4000c0b97cc80da6',
    'cache-control': 'no-cache',
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
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://in.goibibo.com/',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Cookie': '__gi_vid=f2e8a678-9093-4fc1-b729-9775b7d8a613; goTribeUpgradePopup=true; goTribeUpgradePopupTier=undefined; web-dvid=09d3f596-a51a-43ac-9cdd-7eecd0c71136; _ga=GA1.1.945081356.1744002582; _uetvid=eaa473f0981211ee9f9d0b87725c7e9b; _gcl_au=1.1.1187517642.1763093128; OAUTH-GOIBIBO=MGT22339836f26edf4de51f63029d621f51e3eeb4447c55553549aab91f22bd82a2250701562b4c0da492c315efc4c2629b8P; gapauthtoken=ZzBkNGp4ZTI5djBlcng5b3c=; gitokenid=g0d4jxe29v0erx9ow; dvid=65a04e38-9dd7-41c3-92f5-47f21e96ee36; _fbp=fb.1.1763094191487.195777979811061481; userSessionWeb=active; AMCVS_289D7D6662CD510D0A495FC9%40AdobeOrg=1; s_cc=true; AMCVS_1E0D22CE527845790A490D4D%40AdobeOrg=1; AMCV_1E0D22CE527845790A490D4D%40AdobeOrg=179643557%7CMCIDTS%7C20443%7CMCMID%7C04414527030039026123142885772088797738%7CMCAAMLH-1766877024%7C12%7CMCAAMB-1766877024%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1766279424s%7CNONE%7CvVersion%7C5.5.0; kndctr_1E0D22CE527845790A490D4D_AdobeOrg_identity=CiYwNDQxNDUyNzAzMDAzOTAyNjEyMzE0Mjg4NTc3MjA4ODc5NzczOFIRCISbnfCzMxgBKgRJTkQxMAPwAdf9jv60Mw%3D%3D; ccde=IN; _ga_6M7BM6XZ7L=GS2.1.s1766580204$o2$g1$t1766580204$j60$l0$h0; _abck=B8FB1928D9977D69DD0D710D7C7E8953~0~YAAQXHxBF9XYaDCbAQAAfaNrvA+2hpaaOBgBi7bjOWP+OdNKznIn26fVbRytikDYk9LP8pfI8/Sz2jGMpU1j9jKijeBJP2v7+X6wtRWlVXJgbUu9GS5hE1vU72Ras25ZyPzjRj9jmnVoRHjTUXI7zPM0x+Va9WmOVpesimFFnJR5XAlYv4ZeGM/aaMuIPcn9wUrbtCb85roGSTel0VJehYZ9neCtk4S6mDaB3NG6wuNCLdqJ8gfL0Ij/yxRnRnRkEIfcGgNgLyoxZPfLiNjcd8T9CCtg6tQvCe6u7nGcVo4VV52KqcpMh7UWahtInwOuhkyeIyP3X/YQa8kSA8TXKafTIp2zRQtTa5u3CKkpG9qvHQnSW0k2vhXvS5rWQze3BMy6eR5RsgH6JQGLY8uXh0CMXI1zYaboxY6AJYJL3rxUDUxv1ErPYLVu4ijfZ8+Xhw8Tp9v/gOOyROv3s9agvg6Um0aRJ/oWlj2wrOSAy13+Ztg7TlfwmIO+lD76S73ebA2VIHka6VLrQ3LZrDgQwRG36R+T2hcqVa9m/E6Vkx0tLH6whHK/2Pg3oQi4Cz9l9pKvw1A9BX2Dhy3fRLh1vrzGv+P5WO+FDDuMoJOvFesLwcTlQFNoAB3kzUc8+J/RSwVsStA5OGD484fUUuu4YfeywtInvom81LjcbFW++5Fpd6TRMK7YEpZ0hCoxomU5lXlocwgzXj/1tmaJYmUr/WIwZz5z0QuEJYlL0OMswhIzigxIQdj925ExT2CCzjLpWxjG1DYm+1JOBhB+uZ8ldaukYVN0K5DUTuxAj/Fb3LJmgy4BZr5mXbGGaAgMKz5sMXcbLD7lK8Z3fKY4iDkI2x1uLLSATHcEwn1HPvQejSjDNeIHj4DtSQGb0qnWPQ==~-1~-1~1766948777~AAQAAAAF%2f%2f%2f%2f%2f30zWRX+mRwOfEfUHQ4cnytO+I7uO%2f8eMtiX4dYvzOyzNnhCFN5joTRFEOBFrYIG7h41LvDBN9xHYHIPVVkoakjo1DQixjuTEQx%2fQKWDYiz3wdiTExdXHrC8lwdw79Ahw2C9+Xk%3d~-1; tvc_sess=%7B%22sm%22:%22Retention%20/%20Mailer%20/%20internal_241225$proactive%22,%22t%22:1768392729881%7D; tvc_sm_lpc=not_set%20/%20not_set%20/%20(not%20set); ls_sm_lpc24=not_set%20/%20not_set%20/%20(not%20set); ls_sm_lpc7=not_set%20/%20not_set%20/%20(not%20set); bm_s=YAAQZHxBF+WWXy2bAQAAT6drvARnjgToA16uKf7khFGOlbhE1Z8TLvBSE/uYSw5XTe6a0AaJdHcZvufDlOf1PBXwWiVL6U1+ofMyRkSAdav0F4QWDJLivUZcaytqLzpHJ9/r0jEnXecZLCdGTaiNlQk6jy057r24jP0GwmFt1uLY/fLoREcf514j4QXoVXmshil7IEl9HNTPVdjj8nFksCAry22rq/bCoQ5fp6KAqjf5UQiY100jRrh80rKNFq6lP/28JYd4w1YnnkPJpyyJm1S2oCq4n7putmShNnFRaPdbfrE90hZDqCYCrIEGA5vtYj7UAYThaivWJ9h6vSMUViV+q6rRzTWcKO9pa2DlLKA+SG09ynDhYRSHQq7lfI88Hgu9e0fA0W5A+D0DFkrHnJXoR0KmvbtPTxjYolGM8QZXTQWSIGo4Y3WQYfpbBL5/pjag+D2Vlq8Utp0bD8ItIt2AGuP/h4imtDW4G0lhBcEgRRvScWY0orDJjNDdWPpYeTiIbVnGjTAiyqt0HW4d2agX+KU4pIrCJJYFdRlHmSGuS3RLNmMTUCLOzPUcYeAoYYiBqA==; s_plt=1.01; s_pltp=funnel%3Aintl%20hotels%3Adetails; s_nr30=1768393224026-Repeat; _ga_W4B122MQXT=GS2.1.s1768392731$o11$g0$t1768393224$j60$l0$h0; ak_bmsc=E47A8BCC2AD27733A54390428EBBECB7~000000000000000000000000000000~YAAQNtcLF5snqSebAQAASZsfvR5TbIpalblKYXFmkV5Iya0ozAsjne+dVICJKakmQpyM58TFsI9bkXkqRLaNCQP1lThwb/2D4NxTeXUtasf6c96beY/khq1MYxg8lmuVmeQ0gf9l0NYDbkbqXT+SeozNoAutWtBQR1QBLu6TelwKzQWRpC02v6tw6PeY/h5K7Jhj5AbgcqrcT9mhoCpdsHWJtF1c0jKtlI+utB20jxhlpzfYIEBC5jDW75BKjfnPsnJFwjp8I58qi3fcGCuffrOULevMIofAGOh6ciJWDb3B/UZFWtvnl0ZoJBTlY3aW6qoOrY9S8NycJ+ZDUiyZB2rFVAQlJ3v0o56TBRdKkuzjGcyNXSamFfRqFp2cYP8xHyzOKK2o; AMCV_289D7D6662CD510D0A495FC9%40AdobeOrg=179643557%7CMCIDTS%7C20468%7CMCMID%7C04345439627823127783150919396927095284%7CMCAAMLH-1769013818%7C12%7CMCAAMB-1769013818%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1768416218s%7CNONE%7CvVersion%7C5.5.0; s_sq=%5B%5BB%5D%5D; s_nr=1768409229486-Repeat; s_ips=196; s_tp=196; s_ppv=dweb%253Aingo_legacy%253Aphotos_n_videos%2C100%2C100%2C196%2C1%2C1; s._ppvPreviousPage=dweb%3Aingo_legacy%3Aphotos_n_videos; _abck=AE599708157F5DF5DF7C951EB6A12873~-1~YAAQh1stF8OJ+0eWAQAA5icZVw2a8obJD1MGm0grwBhhMkxoKZhc2JroY5MdWcRV7IQSdMrNpCgEcReNz7Uy6YEj8DzoGOcuWGBWz1R/+QrfaRH7lPzWt39ZQIQULE3t42DvEile36WpyKhyzTtgtsDFYJHakZgnto+6R2l2YDSddOWsR0UbOhW/If+8uwoPZZWVrhycT0o1lijuD42n3oesCs/mMU/DeIilHBvRiHlbcWxB1KBnugkVwrG9iaQJqM9Mx10mT2wBP9uaY5tsXgB+4HHi5u8mxbwk1jA+4YM5WUspBrfyK07NJMwP39nOCMpy0xkTl/Qedy8oalI0RWM7v5vFJha2UtJpSHZb3DR7IIX3hZiWyIoh661KYNmYNKNO8A1LVFSpWmdwuWzzuNEbuvpIM0wDCjBo9Wb41VFkIPlxoF9eAE2xwleMI9OAcO7V3H9SiyKRQzqQrd124oDEH3wrAdKc7E47PVu6Zqhh8LWlrwSSSiOIFAmtrPZjyXBmGL0ZyYmCqLflQ/iAk7V0XrGNX3NUYEFTgLRTmWRoqtYmu8hchdzZo19t/R1CkiNDpTvuzaWeXRAar3q2OHZUGC7Vx4/2HQh/WJF2kDAAi0hdzaSRVsATvNBjqh1VGlCzhlcdyyglAcoPpDv85kM5lahURHZDiEjw/yn/JnwKY2cZ~-1~-1~-1'
}

QUERY = """
query FetchMediaAndDetails($endpointRequestData: EndpointRequestData) {
  rpcFetchMediaAndDetails(endpointRequestData: $endpointRequestData) {
    message
    data {
      allImageTags
      allVideoTags
      allImages
      allVideos
      unTagged
      tagged
      moderationStatus
      spaces
      rooms
      __typename
    }
    errorDetail {
      errorCode
      errorMessage
      errorType
      displayMessage
      httpStatusCode
      __typename
    }
    __typename
  }
}
"""

def get_payload(hotel_code: str):
    return {
        "query": QUERY,
        "variables": {
            "endpointRequestData": {
                "rpcPicasso": {
                    "rpcFilteredImages": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code, "filters": [{"filterName": "includeInactiveRoom"}]}
                    },
                    "rpcFilteredVideos": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code, "filters": [{"filterName": "includeInactiveRoom"}]}
                    },
                    "rpcImageVideoTags": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code, "filters": []}
                    },
                    "rpcSpaceRoomDetails": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": hotel_code, "filters": [{"filterName": "includeInactiveRoom"}]}
                    }
                }
            }
        }
    }

async def fetch_hotel(session: aiohttp.ClientSession, hotel_code: str) -> Dict[str, Any]:
    try:
        async with session.post(GRAPHQL_URL, json=get_payload(hotel_code), headers=HEADERS) as response:
            if response.status == 200:
                return await response.json()
            else:
                print(f"Failed to fetch {hotel_code}: {response.status}")
                return None
    except Exception as e:
        print(f"Error fetching {hotel_code}: {e}")
        return None

def extract_info(hotel_code: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
    if not raw_data or "data" not in raw_data or not raw_data["data"] or not raw_data["data"].get("rpcFetchMediaAndDetails"):
        return None
    
    data = raw_data["data"]["rpcFetchMediaAndDetails"].get("data")
    if not data:
        return None
    
    # Extract hotel name
    hotel_name = "Unknown Hotel"
    all_images_data = data.get("allImages", {})
    all_images_list = []
    if isinstance(all_images_data, dict):
        all_images_list = all_images_data.get("data", [])
    elif isinstance(all_images_data, list):
        all_images_list = all_images_data

    if all_images_list and len(all_images_list) > 0:
        hotel_name = all_images_list[0].get("hotelName", hotel_name)
    else:
        tagged = data.get("tagged", {})
        for tag_list in tagged.values():
            if tag_list and isinstance(tag_list, list) and len(tag_list) > 0:
                hotel_name = tag_list[0].get("hotelName", hotel_name)
                break
                
    amenities = list(data.get("tagged", {}).keys())
    
    room_types = []
    all_tags = data.get("allImageTags", {})
    if isinstance(all_tags, dict) and "hotel" in all_tags:
        hotel_tags = all_tags["hotel"]
        if "property" in hotel_tags and "Room" in hotel_tags["property"]:
            rooms = hotel_tags["property"]["Room"]
            if rooms:
                room_types.extend([r["roomName"] for r in rooms if r.get("roomName")])
        if "room" in hotel_tags and "Bed" in hotel_tags["room"]:
            beds = hotel_tags["room"]["Bed"]
            if beds:
                room_types.extend([r["roomName"] for r in beds if r.get("roomName")])
                
    room_types = list(set(room_types))

    return {
        "name": hotel_name,
        "hotel_code": hotel_code,
        "amenities": amenities,
        "room_types": room_types,
        "description": f"Detailed information for {hotel_name} with {len(amenities)} amenities and {len(room_types)} room types."
    }

async def main():
    base_path = "/Users/int1935/Desktop/image search/logic test/hotels"
    mapping = {}
    for root, dirs, files in os.walk(base_path):
        if "info.json" in files:
            with open(os.path.join(root, "info.json"), "r") as f:
                try:
                    data = json.load(f)
                    code = data.get("hotel_code")
                    if code:
                        mapping[code] = root
                except:
                    pass

    all_hotel_data = []
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_hotel(session, code) for code in HOTEL_CODES]
        responses = await asyncio.gather(*tasks)
        
        for code, resp in zip(HOTEL_CODES, responses):
            info = extract_info(code, resp)
            if info:
                all_hotel_data.append(info)
                # Update info.json if path exists
                if code in mapping:
                    info_path = os.path.join(mapping[code], "info.json")
                    with open(info_path, "w") as f:
                        json.dump(info, f, indent=4)
                    print(f"Updated info.json for {info['name']} ({code})")
                else:
                    print(f"Warning: No folder found for hotel code {code}")

    # Save consolidated data
    with open("hotel_data.json", "w") as f:
        json.dump(all_hotel_data, f, indent=4)
    print(f"Saved {len(all_hotel_data)} hotels to hotel_data.json")

if __name__ == "__main__":
    asyncio.run(main())
