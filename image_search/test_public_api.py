import asyncio
import aiohttp
import json

GRAPHQL_URL = "https://www.goibibo.com/graphql"
QUERY = """
query FetchPropertyDetails($endpointRequestData: EndpointRequestData) {
  rpcFetchPropertyDetails(endpointRequestData: $endpointRequestData) {
    data {
      property {
        hotelName
        starRating
      }
    }
  }
}
"""

async def test():
    payload = {
        "query": QUERY,
        "variables": {
            "endpointRequestData": {
                "rpcPicasso": {
                    "rpcPropertyDetails": {
                        "modelType": "modelType1",
                        "body": {"hotelCode": "1000000073"}
                    }
                }
            }
        }
    }
    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False)) as session:
        async with session.post(GRAPHQL_URL, json=payload) as resp:
            print(f"Status: {resp.status}")
            data = await resp.json()
            print(json.dumps(data, indent=2))

if __name__ == "__main__":
    asyncio.run(test())
