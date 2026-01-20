import json
import os
from models import ChatMessage
from services import HotelService, ChatAnalyzer, RecommendationService

def test_recommendation_with_file():
    # 1. Load the chat data
    chat_file_path = "hotel_trip_chat_data.json"
    if not os.path.exists(chat_file_path):
        print(f"Error: {chat_file_path} not found.")
        return

    with open(chat_file_path, "r") as f:
        chat_data = json.load(f)
    
    # 2. Extract messages from the JSON
    raw_messages = chat_data.get("messages", [])
    # Convert all messages from the JSON to ChatMessage models
    messages = [ChatMessage(user_id=msg.get("sender_id"), text=msg.get("content")) for msg in raw_messages if msg.get("content")]
    
    print(f"Loaded {len(messages)} messages from {chat_file_path}")

    # 3. Initialize Services
    hotel_service = HotelService()
    analyzer = ChatAnalyzer()
    rec_service = RecommendationService(hotel_service)

    # 4. Analyze preferences
    print("\n--- Extracting Preferences from Full Chat History ---")
    preferences = analyzer.extract_preferences(messages)
    print(f"Final Extracted Area: {preferences.area or 'Any'}")
    print(f"Final Extracted Price Limit: {preferences.max_price or 'None'}")
    print(f"Extracted Amenities: {', '.join(preferences.amenities)}")

    # 5. Get recommendations
    print("\n--- Top 5 Recommended Hotels based on Chat Context ---")
    recommendations = rec_service.get_recommendations(preferences, limit=5)
    
    if not recommendations:
        print("No hotels matched the extracted preferences.")
    else:
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec.hotel.name}")
            print(f"   AI REASONING: {rec.explanation}")
            print(f"   MATCHED PREFERENCES: {', '.join(rec.matched_preferences)}")
            print("-" * 50)

if __name__ == "__main__":
    # To run this script directly, we need to handle relative imports or run as a module
    # For simplicity in this demo environment, we will run it as a module test
    try:
        test_recommendation_with_file()
    except Exception as e:
        print(f"Test failed: {e}")
