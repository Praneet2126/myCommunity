#!/usr/bin/env python3
"""Simple test script for sentiment analyzer.

Run this to verify the sentiment analyzer is working correctly.
"""

# Import from local module
# Run this script from the sentiment_analyzer directory or add parent to PYTHONPATH
try:
    from analyzer import analyze_sentiment
except ImportError:
    # If running from parent directory
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from sentiment_analysis.sentiment_analyzer import analyze_sentiment

def test_sentiment_analyzer():
    """Test the sentiment analyzer with sample messages."""
    
    test_cases = [
        ("I love this place! It's absolutely amazing!", "positive"),
        ("This is okay, nothing special.", "neutral"),
        ("Terrible experience, would not recommend.", "negative"),
        ("The hotel was fantastic and the staff were very helpful.", "positive"),
        ("Meh, it was fine I guess.", "neutral"),
        ("Worst service ever. Completely disappointed.", "negative"),
    ]
    
    print("=" * 60)
    print("Sentiment Analyzer Test")
    print("=" * 60)
    print()
    
    for i, (text, expected) in enumerate(test_cases, 1):
        print(f"Test {i}:")
        print(f"  Text: {text}")
        print(f"  Expected: {expected}")
        
        try:
            result = analyze_sentiment(text)
            print(f"  Result: {result['sentiment']} (confidence: {result['confidence']:.3f})")
            
            if result['sentiment'] == expected:
                print("  ✅ PASS")
            else:
                print(f"  ⚠️  UNEXPECTED (expected {expected})")
                
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
        
        print()
    
    print("=" * 60)
    print("Test completed!")
    print("=" * 60)


if __name__ == "__main__":
    test_sentiment_analyzer()
