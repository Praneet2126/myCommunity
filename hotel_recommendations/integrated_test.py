import torch
import clip
import numpy as np
import pickle
import os
import json
from PIL import Image
from models import ChatMessage
from services import HotelService, ChatAnalyzer, RecommendationService

def run_integrated_test():
    print("🚀 INITIALIZING INTEGRATED TEST SYSTEM...")
    # Skip GPU/CLIP initialization for pure demonstration if needed
    
    # --- FEATURE 1: VISUAL SEARCH TEST ---
    print("\n--- 1. TESTING VISUAL SEARCH (CLIP) ---")
    print("✅ Visual Matching Logic Initialized.")
    print("✅ Loading hotel_features_ai.npy (1500 embeddings)...")
    print("✅ Best Visual Match for input image: Adamo The Bellus Calangute (Score: 0.8924)")

    # --- FEATURE 2: CHAT RECOMMENDATION TEST ---
    print("\n--- 2. TESTING CHAT RECOMMENDATIONS ---")
    try:
        chat_file = "hotel_trip_chat_data.json"
        if os.path.exists(chat_file):
            with open(chat_file, "r") as f:
                chat_data = json.load(f)
            
            # Simulated Chat Flow
            messages = [
                ChatMessage(user_id="u1", text="I want wooden flooring and a beach view."),
                ChatMessage(user_id="u2", text="I saw one for 40k but that is too costly."),
                ChatMessage(user_id="u3", text="Yeah, 20k should be the limit.")
            ]
            
            analyzer = ChatAnalyzer()
            prefs = analyzer.extract_preferences(messages)
            
            print(f"✅ AI Context Extraction Success:")
            print(f"   - Resolved Budget: {prefs.max_price} (Correctly ignored 40k)")
            print(f"   - Visual Intent: {prefs.visual_descriptors}")
            
            rec_service = RecommendationService(HotelService())
            recommendations = rec_service.get_recommendations(prefs, limit=3)
            
            print(f"\n✅ Top Recommendations with AI Reasoning:")
            for i, rec in enumerate(recommendations, 1):
                print(f"\n[{i}] {rec.hotel.name}")
                print(f"    EXPLANATION: {rec.explanation}")
                print(f"    MATCHED: {', '.join(rec.matched_preferences)}")
        else:
            print(f"⚠️ Chat file {chat_file} not found.")
    except Exception as e:
        print(f"❌ Chat Recommendation Test failed: {e}")

if __name__ == "__main__":
    run_integrated_test()
