import requests
import time
import random

BACKEND_URL = "http://localhost:8000"
CHAT_ID = "automated_test_session"

# Test data sets
NATURE_MSGS = [
    "I really want to see some wildlife.",
    "Is there a crocodile safari in Goa?",
    "I love nature walks and birds.",
    "Let's explore the mangroves.",
    "Are there any backwater tours?",
    "Maybe we can visit a spice farm too.",
    "I heard Bondla Wildlife Sanctuary is nice.",
    "Are there any boat trips for dolphin spotting?",
    "I want to see the Bhagwan Mahaveer Sanctuary.",
    "Let's go trekking in Netravali.",
    "Is the bird sanctuary open in the morning?",
    "I love the greenery of the Western Ghats.",
    "Are there any hidden waterfalls we can hike to?",
    "I want to see the crocodiles in the canal.",
    "Let's find a quiet nature trail."
]

PARTY_MSGS = [
    "When do we hit the clubs?",
    "I want to go to Baga for parties.",
    "Is Tito's Lane still the best spot?",
    "Let's find a place with great music and dancing.",
    "Maybe a floating casino tonight?",
    "I heard Deltin Royale is the best casino.",
    "Let's go to a trance party in Anjuna.",
    "Is there a beach club with a pool?",
    "I want to see the fire dancers at Thalassa.",
    "Let's find a high-energy crowd.",
    "Are there any rooftop bars in Panjim?",
    "I want to go to a club by the river.",
    "Let's dance all night!",
    "Is the night market in Arpora happening?",
    "I love the boho vibes of the beach shacks."
]

USERS = ["Arjun", "Sanya", "Rohan", "Priya"]

def run_auto_test():
    print(f"🚀 Starting Automated Multi-User Test (Session: {CHAT_ID})")
    
    # Phase 1: Nature (15 messages)
    print("\n--- Phase 1: Nature Talk (15 msgs) ---")
    for msg in NATURE_MSGS:
        user = random.choice(USERS)
        try:
            resp = requests.post(f"{BACKEND_URL}/chat/message?chat_id={CHAT_ID}&user={user}&message={msg}")
            data = resp.json()
            print(f"[{user}]: {msg}")
            if data.get("trigger_rec"):
                print(f"💡 RECOMMENDATIONS TRIGGERED! (Count: {data['message_count']})")
                recs = data.get("recommendations", [])
                if recs:
                    top_pick = recs[0]['name']
                    print(f"🛒 Adding {top_pick} to cart...")
                    requests.post(f"{BACKEND_URL}/cart/add?chat_id={CHAT_ID}&user={user}&place_name={top_pick}")
        except Exception as e:
            print(f"❌ Error: {e}. Is the backend running on port 8000?")
            return
        time.sleep(0.2)

    # Phase 2: Party (15 messages)
    print("\n--- Phase 2: Party Talk (15 msgs) ---")
    for msg in PARTY_MSGS:
        user = random.choice(USERS)
        try:
            resp = requests.post(f"{BACKEND_URL}/chat/message?chat_id={CHAT_ID}&user={user}&message={msg}")
            data = resp.json()
            print(f"[{user}]: {msg}")
            if data.get("trigger_rec"):
                print(f"💡 RECOMMENDATIONS TRIGGERED! (Count: {data['message_count']})")
                recs = data.get("recommendations", [])
                if recs:
                    top_pick = recs[0]['name']
                    print(f"🛒 Adding {top_pick} to cart...")
                    requests.post(f"{BACKEND_URL}/cart/add?chat_id={CHAT_ID}&user={user}&place_name={top_pick}")
        except Exception as e:
            print(f"❌ Error: {e}")
            return
        time.sleep(0.2)

    # Phase 3: Relaxation (15 messages)
    RELAX_MSGS = [
        "I need some peace and quiet now.",
        "Let's find a secluded beach in the north.",
        "Is Mandrem good for yoga?",
        "I just want to watch the sunset and relax.",
        "Maybe a long walk on a clean beach.",
        "Is there a quiet spot for reading?",
        "I want to see the sunset at Chapora.",
        "Let's find a hidden gem in South Goa.",
        "Is there a library or quiet cafe?",
        "I want to stay away from the crowds.",
        "Let's go to a spa or wellness center.",
        "Is there a scenic viewpoint nearby?",
        "I want a slow day tomorrow.",
        "Let's find a peaceful riverside retreat.",
        "I love the sound of the ocean."
    ]
    
    print("\n--- Phase 3: Relax Talk (15 msgs) ---")
    for msg in RELAX_MSGS:
        user = random.choice(USERS)
        try:
            resp = requests.post(f"{BACKEND_URL}/chat/message?chat_id={CHAT_ID}&user={user}&message={msg}")
            data = resp.json()
            print(f"[{user}]: {msg}")
            if data.get("trigger_rec"):
                print(f"💡 RECOMMENDATIONS TRIGGERED! (Count: {data['message_count']})")
                recs = data.get("recommendations", [])
                if recs:
                    top_pick = recs[0]['name']
                    print(f"🛒 Adding {top_pick} to cart...")
                    requests.post(f"{BACKEND_URL}/cart/add?chat_id={CHAT_ID}&user={user}&place_name={top_pick}")
        except Exception as e:
            print(f"❌ Error: {e}")
            return
        time.sleep(0.2)

    print("\n--- Finalizing Settings ---")
    requests.post(f"{BACKEND_URL}/cart/update?chat_id={CHAT_ID}&num_days=3&num_people=4")
    
    print("\n--- Generating Itinerary ---")
    try:
        resp = requests.post(f"{BACKEND_URL}/itinerary/generate?chat_id={CHAT_ID}", timeout=120)
        if resp.status_code == 200:
            itin = resp.json()
            print("✅ Itinerary Generated Successfully!")
            for day in itin['days']:
                names = [a['name'] for a in day['activities']]
                print(f"Day {day['day']}: {', '.join(names) if names else 'Free Day'}")
        else:
            print(f"❌ Error generating itinerary: {resp.text}")
    except requests.exceptions.Timeout:
        print("❌ Error: Itinerary generation timed out. Try a smaller request or check backend CPU.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_auto_test()
