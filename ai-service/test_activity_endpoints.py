"""
Quick test script for Activity Recommendation endpoints
Run this after starting the ai-service to verify everything works
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001/api/v1"

def test_health():
    """Test health endpoint"""
    print("\n1. Testing Health Check...")
    response = requests.get("http://localhost:8001/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_process_messages():
    """Test processing chat messages"""
    print("\n2. Testing Chat Message Processing...")
    
    chat_id = "test_goa_123"
    messages = [
        "I want to visit some beaches",
        "And maybe some forts",
        "Water sports would be fun",
        "Looking for adventure activities",
        "Beach hopping sounds great",
        "Historical places too",
        "I love nature and wildlife"
    ]
    
    recommendations = []
    for i, message in enumerate(messages, 1):
        print(f"  Sending message {i}/7: {message}")
        response = requests.post(
            f"{BASE_URL}/activities/message",
            json={
                "chat_id": chat_id,
                "user": "test_user",
                "message": message
            }
        )
        
        if response.status_code != 200:
            print(f"  ❌ Error: {response.status_code}")
            print(f"  {response.text}")
            return False, []
        
        result = response.json()
        print(f"  Message count: {result['message_count']}, Trigger: {result['trigger_rec']}")
        
        if result['trigger_rec']:
            recommendations = result['recommendations']
            print(f"  ✅ Got {len(recommendations)} recommendations!")
            for rec in recommendations[:3]:
                print(f"     - {rec['name']} ({rec['category']}, score: {rec['score']:.2f})")
    
    return len(recommendations) > 0, recommendations

def test_add_to_cart(recommendations):
    """Test adding activities to cart"""
    print("\n3. Testing Add to Cart...")
    
    if not recommendations:
        print("  ⚠️  No recommendations to add")
        return False
    
    chat_id = "test_goa_123"
    
    # Add first 3 recommendations to cart
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"  Adding {i}: {rec['name']}")
        response = requests.post(
            f"{BASE_URL}/activities/cart/add",
            json={
                "chat_id": chat_id,
                "user": "test_user",
                "place_name": rec['name']
            }
        )
        
        if response.status_code != 200:
            print(f"  ❌ Error: {response.status_code}")
            print(f"  {response.text}")
            return False
        
        result = response.json()
        if result['status'] == 'success':
            print(f"  ✅ Added successfully. Cart has {len(result['cart']['items'])} items")
        else:
            print(f"  ❌ Failed: {result}")
            return False
    
    return True

def test_get_cart():
    """Test getting cart"""
    print("\n4. Testing Get Cart...")
    
    chat_id = "test_goa_123"
    response = requests.get(f"{BASE_URL}/activities/cart/{chat_id}")
    
    if response.status_code != 200:
        print(f"  ❌ Error: {response.status_code}")
        print(f"  {response.text}")
        return False
    
    cart = response.json()
    print(f"  ✅ Cart retrieved successfully")
    print(f"  Items: {len(cart['items'])}")
    print(f"  Settings: {cart['num_days']} days, {cart['num_people']} people")
    
    for item in cart['items']:
        print(f"    - {item['place_name']} (added by {item['added_by']}, count: {item['count']})")
    
    return len(cart['items']) > 0

def test_update_cart_settings():
    """Test updating cart settings"""
    print("\n5. Testing Update Cart Settings...")
    
    response = requests.post(
        f"{BASE_URL}/activities/cart/update",
        json={
            "chat_id": "test_goa_123",
            "num_days": 3,
            "num_people": 2
        }
    )
    
    if response.status_code != 200:
        print(f"  ❌ Error: {response.status_code}")
        print(f"  {response.text}")
        return False
    
    result = response.json()
    print(f"  ✅ Settings updated: {result}")
    return True

def test_generate_itinerary():
    """Test itinerary generation"""
    print("\n6. Testing Itinerary Generation...")
    print("  ⏳ This may take 10-30 seconds on first run (loading models)...")
    
    start_time = time.time()
    response = requests.post(
        f"{BASE_URL}/activities/itinerary/generate",
        params={"chat_id": "test_goa_123"}
    )
    duration = time.time() - start_time
    
    if response.status_code != 200:
        print(f"  ❌ Error: {response.status_code}")
        print(f"  {response.text}")
        return False
    
    itinerary = response.json()
    print(f"  ✅ Itinerary generated in {duration:.1f}s")
    print(f"  Chat ID: {itinerary['chat_id']}")
    print(f"  People: {itinerary['num_people']}")
    print(f"  Days: {len(itinerary['days'])}")
    
    for day in itinerary['days']:
        print(f"\n  Day {day['day']} ({day['total_duration_mins']} mins):")
        for activity in day['activities']:
            print(f"    {activity['start_time']}-{activity['end_time']}: {activity['name']}")
            print(f"      Region: {activity['region']}, Category: {activity['category']}")
    
    return True

def main():
    print("=" * 60)
    print("Activity Recommendation API Test Suite")
    print("=" * 60)
    print("\nMake sure the ai-service is running on port 8001!")
    print("Start it with: cd ai-service && python main.py")
    
    try:
        # Test health
        if not test_health():
            print("\n❌ Health check failed. Is the service running?")
            return
        
        # Test message processing and recommendations
        success, recommendations = test_process_messages()
        if not success:
            print("\n❌ Message processing failed")
            return
        
        # Test cart operations
        if not test_add_to_cart(recommendations):
            print("\n❌ Add to cart failed")
            return
        
        if not test_get_cart():
            print("\n❌ Get cart failed")
            return
        
        if not test_update_cart_settings():
            print("\n❌ Update settings failed")
            return
        
        # Test itinerary generation
        if not test_generate_itinerary():
            print("\n❌ Itinerary generation failed")
            return
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nYou can now test these endpoints in Postman or integrate with frontend.")
        print("See ACTIVITY_RECOMMENDATION_API.md for detailed documentation.")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to service. Is it running on port 8001?")
        print("Start it with: cd ai-service && python main.py")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
