"""Integration test for chat summarizer with actual API calls.

Tests the main functionality including summary generation.
"""

import sys
import pathlib

# Add parent directory to path to import chat_summarizer
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))

from chat_summarizer import summarize_unread_messages


def test_summary_generation():
    """Test that summary is generated correctly when thresholds are met."""
    print("\n" + "=" * 60)
    print("Testing Summary Generation with Hugging Face API")
    print("=" * 60)
    
    # Create realistic travel-related messages that meet thresholds
    # 15 messages, each with ~25+ words = 375+ words total
    messages = [
        "Just got back from an amazing trip to Tokyo and I have to say the food scene there is absolutely incredible. The ramen shops in Shibuya are world-class and the sushi at Tsukiji is fresh beyond belief.",
        "Has anyone been to Kyoto during cherry blossom season? I'm planning a trip for next spring and would love recommendations on the best viewing spots and timing for peak bloom.",
        "The best way to get around Japan is definitely the JR Pass. It's expensive upfront but completely worth it for the convenience and savings if you're doing multiple cities.",
        "I stayed at a traditional ryokan in Hakone and it was one of the most authentic experiences of my life. The tatami rooms, hot springs, and kaiseki dinner were unforgettable.",
        "The bullet trains in Japan are so efficient and comfortable. We traveled from Tokyo to Osaka in just 2.5 hours and the ride was smooth and quiet the entire way.",
        "If you're visiting Tokyo, make sure to check out the Tsukiji Outer Market for fresh sushi and local snacks. The atmosphere is amazing and the food quality is top-notch.",
        "Kyoto's Fushimi Inari Shrine is beautiful but definitely go early in the morning to avoid the massive crowds. The hike up through thousands of torii gates is absolutely worth it.",
        "We found that most restaurants in Japan don't accept credit cards, especially smaller local places, so make sure to carry plenty of cash with you at all times.",
        "The weather in Japan during spring is perfect for sightseeing. Not too hot, not too cold, just right with beautiful cherry blossoms everywhere you look.",
        "I highly recommend getting a pocket WiFi device for your trip. It made navigating so much easier with Google Maps and we never got lost once.",
        "The temples in Kyoto are stunning, especially Kinkaku-ji also known as the Golden Pavilion. The reflection in the pond is absolutely breathtaking and worth the visit.",
        "We tried a traditional kaiseki dinner in Kyoto and it was an incredible culinary experience. Each course was beautifully presented and the flavors were delicate and refined.",
        "The Japanese people are so polite and helpful everywhere we went. Even with the language barrier, we never felt lost or confused because someone always helped us.",
        "If you're into anime or electronics, Akihabara in Tokyo is a must-visit destination. The electronics and anime shops are endless and you can spend hours exploring.",
        "One important tip: learn a few basic Japanese phrases before you go. Simple words like Arigatou gozaimasu for thank you go a long way with locals and show respect."
    ]
    
    print(f"\nInput: {len(messages)} messages")
    print(f"Testing summarization...\n")
    
    try:
        result = summarize_unread_messages(messages)
        
        # Verify result structure
        print("=" * 60)
        print("RESULT VERIFICATION")
        print("=" * 60)
        
        # Check all required keys
        required_keys = ['summarized', 'summary', 'reason', 'stats']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"
            print(f"✓ Key '{key}' present")
        
        # Check types
        assert isinstance(result['summarized'], bool), "summarized should be bool"
        assert isinstance(result['summary'], list), "summary should be list"
        assert isinstance(result['reason'], str), "reason should be string"
        assert isinstance(result['stats'], dict), "stats should be dict"
        print("✓ All types are correct")
        
        # Check stats structure
        assert 'message_count' in result['stats'], "stats missing message_count"
        assert 'word_count' in result['stats'], "stats missing word_count"
        assert isinstance(result['stats']['message_count'], int), "message_count should be int"
        assert isinstance(result['stats']['word_count'], int), "word_count should be int"
        print("✓ Stats structure is correct")
        
        # Verify thresholds were met
        assert result['stats']['message_count'] >= 15, "Should have 15+ messages"
        assert result['stats']['word_count'] >= 300, "Should have 300+ words"
        print(f"✓ Thresholds met: {result['stats']['message_count']} messages, {result['stats']['word_count']} words")
        
        # Check if summarization occurred
        if result['summarized']:
            print("\n" + "=" * 60)
            print("SUMMARY GENERATION: SUCCESS")
            print("=" * 60)
            
            # Verify summary is not empty
            assert len(result['summary']) > 0, "Summary should not be empty"
            print(f"✓ Summary generated with {len(result['summary'])} bullet points")
            
            # Verify max bullet points
            assert len(result['summary']) <= 5, f"Summary should have max 5 bullets, got {len(result['summary'])}"
            print(f"✓ Bullet count within limit (max 5)")
            
            # Verify each bullet point format
            print("\nGenerated Summary:")
            print("-" * 60)
            for i, bullet in enumerate(result['summary'], 1):
                # Check bullet is non-empty string
                assert isinstance(bullet, str), f"Bullet {i} should be string"
                assert len(bullet.strip()) > 0, f"Bullet {i} should not be empty"
                
                # Check formatting (starts with capital, no trailing period)
                assert bullet[0].isupper(), f"Bullet {i} should start with capital letter"
                
                print(f"  {i}. {bullet}")
            
            print("-" * 60)
            print(f"\n✓ All {len(result['summary'])} bullet points are properly formatted")
            print(f"✓ Reason: {result['reason']}")
            
            # Check summary quality (basic checks)
            summary_text = " ".join(result['summary']).lower()
            travel_keywords = ['japan', 'tokyo', 'kyoto', 'travel', 'trip', 'visit']
            has_travel_content = any(keyword in summary_text for keyword in travel_keywords)
            
            if has_travel_content:
                print("✓ Summary contains relevant travel-related content")
            else:
                print("⚠ Summary may not contain expected travel keywords (this is okay if API summarized differently)")
            
        else:
            print("\n" + "=" * 60)
            print("SUMMARY GENERATION: FAILED")
            print("=" * 60)
            print(f"✗ Not summarized: {result['reason']}")
            print(f"  This indicates an error occurred")
            return False
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED ✓")
        print("=" * 60)
        return True
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_summary_quality():
    """Test summary quality and format."""
    print("\n" + "=" * 60)
    print("Testing Summary Quality")
    print("=" * 60)
    
    # Create messages with diverse topics to test summarization
    messages = [
        "Planning a trip to Paris next month. Looking for hotel recommendations near the Eiffel Tower.",
        "The Louvre Museum requires advance booking. We waited in line for 3 hours without a reservation.",
        "French cuisine is amazing. Try the croissants at local bakeries, they're much better than tourist spots.",
        "The Metro system in Paris is very convenient. Get a weekly pass if you're staying for a few days.",
        "Montmartre has the best views of the city. Go early to avoid crowds and see the sunrise.",
        "We found that most restaurants close between 2-7 PM. Plan your meals accordingly.",
        "The Seine River cruise is touristy but worth it. Great way to see the city from a different angle.",
        "Learning basic French phrases helped a lot. Merci and Bonjour go a long way.",
        "The Palace of Versailles is a day trip from Paris. Book tickets online to skip the long lines.",
        "Parisian cafes are perfect for people watching. Spend an afternoon at a sidewalk cafe.",
        "The catacombs tour was fascinating but not for claustrophobic people. Very narrow passages.",
        "We used Airbnb in the Marais district. Great location, walkable to many attractions.",
        "The food markets like Marché Bastille are great for fresh produce and local specialties.",
        "Public transportation is very affordable. Much cheaper than taxis or ride-sharing.",
        "Overall, Paris exceeded our expectations. The art, food, and culture are incredible."
    ]
    
    result = summarize_unread_messages(messages)
    
    if result['summarized']:
        print(f"\n✓ Summary generated successfully")
        print(f"  Bullet points: {len(result['summary'])}")
        print(f"  Total words in summary: {sum(len(bullet.split()) for bullet in result['summary'])}")
        
        print("\nSummary Content:")
        for i, bullet in enumerate(result['summary'], 1):
            word_count = len(bullet.split())
            print(f"  {i}. [{word_count} words] {bullet}")
        
        # Check for uniqueness
        unique_bullets = set(result['summary'])
        if len(unique_bullets) == len(result['summary']):
            print("\n✓ All bullet points are unique (no duplicates)")
        else:
            print(f"\n⚠ Warning: Found {len(result['summary']) - len(unique_bullets)} duplicate bullet points")
        
    else:
        print(f"\n✗ Summary not generated: {result['reason']}")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Chat Summarizer - API Integration Test")
    print("=" * 60)
    
    success = test_summary_generation()
    
    if success:
        test_summary_quality()
    
    print("\n" + "=" * 60)
    print("Testing Complete")
    print("=" * 60)
