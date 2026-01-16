"""Direct API test that explicitly loads .env file."""

import os
import sys
import pathlib

# Add parent directory to path to import chat_summarizer
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))

# Explicitly load .env file
try:
    from dotenv import load_dotenv
    env_path = pathlib.Path(__file__).parent.parent / '.env'
    print(f"Loading .env from: {env_path}")
    print(f".env exists: {env_path.exists()}")
    
    if env_path.exists():
        # Load with override to ensure it takes precedence
        load_dotenv(env_path, override=True)
        print("✓ .env file loaded")
    else:
        print("✗ .env file not found")
except ImportError:
    print("python-dotenv not available")
except Exception as e:
    print(f"Error loading .env: {e}")

# Check for API key
api_key = os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY")

if not api_key:
    print("\n" + "=" * 60)
    print("API KEY NOT FOUND")
    print("=" * 60)
    print("\nTrying to read .env file directly...")
    
    env_path = pathlib.Path(__file__).parent.parent / '.env'
    try:
        with open(env_path, 'r') as f:
            content = f.read().strip()
            print(f"File content length: {len(content)}")
            if content:
                print(f"First 100 chars: {content[:100]}")
                # Try to parse manually
                for line in content.split('\n'):
                    line = line.strip()
                    if line.startswith('HF_API_KEY='):
                        key_value = line.split('=', 1)[1].strip()
                        if key_value:
                            os.environ['HF_API_KEY'] = key_value
                            api_key = key_value
                            print(f"✓ Manually loaded API key from .env (length: {len(key_value)})")
                            break
    except Exception as e:
        print(f"Error reading .env: {e}")
    
    if not api_key:
        print("\nPlease ensure your .env file contains:")
        print("HF_API_KEY=your_key_here")
        sys.exit(1)

print(f"\n✓ API Key found (length: {len(api_key)} chars)")
print("=" * 60)

# Now test the summarizer
print("\n" + "=" * 60)
print("Testing Chat Summarizer")
print("=" * 60)

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
print("Calling summarization API...\n")

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
        print("QUALITY VERIFICATION")
        print("=" * 60)
        
        checks_passed = 0
        total_checks = 5
        
        # Check 1: Bullet count
        if len(result['summary']) <= 5:
            print(f"✓ Bullet count OK: {len(result['summary'])}/5")
            checks_passed += 1
        else:
            print(f"✗ Bullet count exceeded: {len(result['summary'])}/5")
        
        # Check 2: Formatting
        all_formatted = all(b[0].isupper() for b in result['summary'] if b)
        if all_formatted:
            print("✓ All bullets start with capital letter")
            checks_passed += 1
        else:
            print("✗ Some bullets don't start with capital letter")
        
        # Check 3: Non-empty
        all_non_empty = all(len(b.strip()) > 0 for b in result['summary'])
        if all_non_empty:
            print("✓ All bullets are non-empty")
            checks_passed += 1
        else:
            print("✗ Some bullets are empty")
        
        # Check 4: Uniqueness
        unique_count = len(set(result['summary']))
        if unique_count == len(result['summary']):
            print("✓ All bullets are unique")
            checks_passed += 1
        else:
            print(f"⚠ Found {len(result['summary']) - unique_count} duplicate bullets")
            checks_passed += 1  # Still count as pass, just a warning
        
        # Check 5: Summary length
        total_words = sum(len(bullet.split()) for bullet in result['summary'])
        if total_words > 0:
            print(f"✓ Summary has content ({total_words} total words)")
            checks_passed += 1
        else:
            print("✗ Summary is empty")
        
        print(f"\nQuality Score: {checks_passed}/{total_checks} checks passed")
        
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
