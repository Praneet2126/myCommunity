"""Test script that allows setting API key directly for testing."""

import os
import sys
import pathlib

# Add parent directory to path to import chat_summarizer
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))

# Try to load from .env first
try:
    from dotenv import load_dotenv
    env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# Check if API key is set
api_key = os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY")

if not api_key:
    print("=" * 60)
    print("API KEY NOT FOUND")
    print("=" * 60)
    print("\nPlease set your Hugging Face API key using one of these methods:")
    print("\n1. Set environment variable:")
    print("   export HF_API_KEY='your_key_here'")
    print("\n2. Add to .env file (backend/.env):")
    print("   HF_API_KEY=your_key_here")
    print("\n3. Or pass as command line argument:")
    print("   python3 test_with_key.py your_api_key_here")
    print("\n" + "=" * 60)
    
    # Check if key was passed as argument
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
        os.environ["HF_API_KEY"] = api_key
        print(f"\nUsing API key from command line argument...")
    else:
        sys.exit(1)

print("\n" + "=" * 60)
print("Testing Chat Summarizer with API Key")
print("=" * 60)
print(f"API Key: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '****'}")
print("=" * 60)

# Now run the actual test
from chat_summarizer import summarize_unread_messages

# Create realistic travel-related messages that meet thresholds
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
print("Testing summarization...\n")

try:
    result = summarize_unread_messages(messages)
    
    print("=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    print(f"\nSummarized: {result['summarized']}")
    print(f"Message Count: {result['stats']['message_count']}")
    print(f"Word Count: {result['stats']['word_count']}")
    print(f"Reason: {result['reason']}")
    
    if result['summarized']:
        print(f"\n✓ SUCCESS! Summary generated with {len(result['summary'])} bullet points:")
        print("-" * 60)
        for i, bullet in enumerate(result['summary'], 1):
            print(f"\n{i}. {bullet}")
        print("-" * 60)
        
        # Quality checks
        print("\n" + "=" * 60)
        print("QUALITY CHECKS")
        print("=" * 60)
        
        # Check bullet count
        if len(result['summary']) <= 5:
            print(f"✓ Bullet count OK: {len(result['summary'])}/5")
        else:
            print(f"✗ Bullet count exceeded: {len(result['summary'])}/5")
        
        # Check formatting
        all_formatted = all(b[0].isupper() for b in result['summary'] if b)
        if all_formatted:
            print("✓ All bullets start with capital letter")
        else:
            print("✗ Some bullets don't start with capital letter")
        
        # Check for empty bullets
        all_non_empty = all(len(b.strip()) > 0 for b in result['summary'])
        if all_non_empty:
            print("✓ All bullets are non-empty")
        else:
            print("✗ Some bullets are empty")
        
        # Check uniqueness
        unique_count = len(set(result['summary']))
        if unique_count == len(result['summary']):
            print("✓ All bullets are unique")
        else:
            print(f"⚠ Found {len(result['summary']) - unique_count} duplicate bullets")
        
        # Check summary length
        total_words = sum(len(bullet.split()) for bullet in result['summary'])
        print(f"✓ Total words in summary: {total_words}")
        
        print("\n" + "=" * 60)
        print("SUMMARY GENERATION: SUCCESS ✓")
        print("=" * 60)
        
    else:
        print(f"\n✗ FAILED: {result['reason']}")
        print("\n" + "=" * 60)
        print("SUMMARY GENERATION: FAILED ✗")
        print("=" * 60)
        
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
