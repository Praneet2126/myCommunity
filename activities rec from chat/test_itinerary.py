import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_test():
    chat_id = "trip_123"
    
    phases = [
        {
            "name": "Phase 1: Wildlife & Nature",
            "messages": [
                "I really want to see some wildlife.",
                "Is there a crocodile safari in Goa?",
                "I love nature walks and birds.",
                "Let's explore the mangroves.",
                "Are there any backwater tours?"
            ] * 4 # 20 messages to trigger rec
        },
        {
            "name": "Phase 2: Party & Nightlife",
            "messages": [
                "When do we hit the clubs?",
                "I want to go to Baga for parties.",
                "Is Tito's Lane still the best spot?",
                "Let's find a place with great music and dancing.",
                "Maybe a floating casino tonight?"
            ] * 4 # 20 messages to trigger rec
        },
        {
            "name": "Phase 3: Relaxation & Beaches",
            "messages": [
                "I need some peace and quiet now.",
                "Let's find a secluded beach in the north.",
                "Is Mandrem good for yoga?",
                "I just want to watch the sunset and relax.",
                "Maybe a long walk on a clean beach."
            ] * 4 # 20 messages to trigger rec
        }
    ]

    print(f"=== Starting Test for Chat ID: {chat_id} ===\n")

    for phase in phases:
        print(f"--- {phase['name']} ---")
        last_recs = []
        for i, msg in enumerate(phase['messages']):
            user = "User_A" if i % 2 == 0 else "User_B"
            response = client.post(f"/chat/message?chat_id={chat_id}&user={user}&message={msg}")
            data = response.json()
            if data.get("trigger_rec"):
                print(f"Triggered Recommendation after {data['message_count']} messages!")
                last_recs = data['recommendations']
                for r in last_recs:
                    print(f" - Suggested: {r['name']} (Score: {r['score']:.2f})")
        
        # Simulate user adding the top recommendation to cart
        if last_recs:
            top_pick = last_recs[0]['name']
            print(f"Action: User_A adds '{top_pick}' to cart.")
            client.post(f"/cart/add?chat_id={chat_id}&user=User_A&place_name={top_pick}")
        print("\n")

    # Update settings
    print("--- Updating Itinerary Settings ---")
    print("Setting: 3 Days, 4 People")
    client.post(f"/cart/update?chat_id={chat_id}&num_days=3&num_people=4")

    # Generate Itinerary
    print("\n--- Generating Final Itinerary ---")
    response = client.post(f"/itinerary/generate?chat_id={chat_id}")
    itinerary = response.json()
    
    print(f"Chat ID: {itinerary['chat_id']}")
    print(f"Total Participants: {itinerary['num_people']}")
    
    for day in itinerary['days']:
        print(f"\nDay {day['day']} (Total: {day['total_duration_mins']} mins):")
        if not day['activities']:
            print(" - Free Day")
        for act in day['activities']:
            print(f" - [{act['region']}] {act['name']} ({act['duration']})")

if __name__ == "__main__":
    run_test()
