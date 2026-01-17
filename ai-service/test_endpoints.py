"""
Simple test script to verify endpoints are working
Run this after starting the server to test basic functionality
"""
import requests
import json

BASE_URL = "http://localhost:8001"


def test_health():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")


def test_similar_hotels():
    """Test similar hotels endpoint"""
    print("Testing similar hotels endpoint...")
    payload = {
        "image_url": "https://example.com/hotel.jpg"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/hotels/similar",
        json=payload
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")


def test_chat_summarize():
    """Test chat summarization endpoint"""
    print("Testing chat summarization endpoint...")
    payload = {
        "chat_id": "507f1f77bcf86cd799439020",
        "chat_type": "private"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/chat/summarize",
        json=payload
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")


def test_content_moderation():
    """Test content moderation endpoint"""
    print("Testing content moderation endpoint...")
    payload = {
        "content": "This is a test message",
        "message_id": "test_123",
        "user_id": "user_456"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/moderation/check",
        json=payload
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")


if __name__ == "__main__":
    print("=" * 50)
    print("AI Microservice Endpoint Tests")
    print("=" * 50)
    print()
    
    try:
        test_health()
        test_similar_hotels()
        test_chat_summarize()
        test_content_moderation()
        print("=" * 50)
        print("All tests completed!")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server.")
        print("Make sure the server is running on http://localhost:8001")
    except Exception as e:
        print(f"Error: {e}")
