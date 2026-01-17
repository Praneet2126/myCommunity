#!/usr/bin/env python3
"""Test script for message tagger.

Run this to verify the tagger is working correctly with example cases.
"""

# Import from local module
try:
    from tagger import extract_tags, explain_tags, get_all_tags
except ImportError:
    # If running from parent directory
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from sentiment_analysis.message_tagger import extract_tags
    from sentiment_analysis.message_tagger.tagger import explain_tags, get_all_tags


def test_tagger():
    """Test the message tagger with example cases."""
    
    test_cases = [
        {
            "text": "Baga is crowded",
            "expected_places": ["baga beach"],
            "expected_themes": ["crowded"],
            "description": "Place + Theme"
        },
        {
            "text": "Stayed at Marriott",
            "expected_hotels": ["marriott"],
            "description": "Hotel"
        },
        {
            "text": "Good for families",
            "expected_themes": ["family"],
            "description": "Theme"
        },
        {
            "text": "Marriott in Goa is great for beach lovers",
            "expected_places": ["goa"],
            "expected_hotels": ["marriott"],
            "expected_themes": ["beach"],
            "description": "Multiple categories"
        },
        {
            "text": "I love the Taj Mahal and Red Fort",
            "expected_places": ["red fort", "taj mahal"],
            "description": "Multiple places"
        },
        {
            "text": "The hotel resort was amazing",
            "expected_hotels": ["hotel", "resort"],
            "description": "Hotel terms"
        },
        {
            "text": "Great for adventure and hiking",
            "expected_themes": ["adventure", "hiking"],
            "description": "Multiple themes"
        },
        {
            "text": "Hello world",
            "expected_places": [],
            "expected_hotels": [],
            "expected_themes": [],
            "description": "No matches"
        },
        {
            "text": "BAGA BEACH is amazing",  # Test case-insensitive
            "expected_places": ["baga beach"],
            "description": "Case-insensitive matching"
        },
        {
            "text": "Stayed at the Marriott hotel in Mumbai",
            "expected_places": ["mumbai"],
            "expected_hotels": ["hotel", "marriott"],
            "description": "Partial matches"
        },
    ]
    
    print("=" * 70)
    print("Message Tagger Test")
    print("=" * 70)
    print()
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        text = test["text"]
        description = test.get("description", f"Test {i}")
        
        print(f"Test {i}: {description}")
        print(f"  Text: \"{text}\"")
        
        try:
            result = extract_tags(text)
            
            # Check expected results
            places_ok = test.get("expected_places") is None or result['places'] == test["expected_places"]
            hotels_ok = test.get("expected_hotels") is None or result['hotels'] == test["expected_hotels"]
            themes_ok = test.get("expected_themes") is None or result['themes'] == test["expected_themes"]
            
            if places_ok and hotels_ok and themes_ok:
                print("  ✅ PASS")
                passed += 1
            else:
                print("  ❌ FAIL")
                if not places_ok:
                    print(f"    Places: got {result['places']}, expected {test.get('expected_places')}")
                if not hotels_ok:
                    print(f"    Hotels: got {result['hotels']}, expected {test.get('expected_hotels')}")
                if not themes_ok:
                    print(f"    Themes: got {result['themes']}, expected {test.get('expected_themes')}")
                failed += 1
            
            print(f"  Places: {result['places']}")
            print(f"  Hotels: {result['hotels']}")
            print(f"  Themes: {result['themes']}")
            
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            failed += 1
        
        print()
    
    print("=" * 70)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 70)
    
    # Test explain_tags
    print("\n" + "=" * 70)
    print("Testing explain_tags()")
    print("=" * 70)
    print()
    
    explanation = explain_tags("Baga is crowded and great for families")
    print(f"Text: \"Baga is crowded and great for families\"")
    print(f"Explanation: {explanation}")
    print()
    
    # Test get_all_tags
    print("=" * 70)
    print("Testing get_all_tags()")
    print("=" * 70)
    print()
    
    all_tags = get_all_tags("Marriott in Goa is great for beach lovers")
    print(f"Text: \"Marriott in Goa is great for beach lovers\"")
    print(f"All tags: {all_tags}")
    print()


if __name__ == "__main__":
    test_tagger()
