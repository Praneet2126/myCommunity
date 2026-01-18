#!/usr/bin/env python3
"""Test script for sentiment pipeline.

Run this to verify the pipeline is working correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sentiment_analysis.sentiment_pipeline import process_message, process_message_simple


def test_pipeline():
    """Test the sentiment pipeline with example messages."""
    
    test_cases = [
        {
            "text": "Baga is crowded but great for families",
            "description": "Place + Theme tags"
        },
        {
            "text": "Stayed at Marriott in Goa, amazing experience",
            "description": "Hotel + Place tags"
        },
        {
            "text": "Terrible hotel, would not recommend",
            "description": "No tags, negative sentiment"
        },
        {
            "text": "Hello world",
            "description": "No tags, neutral sentiment"
        },
        {
            "text": "The Taj Mahal in Agra is beautiful and perfect for photography",
            "description": "Multiple places + theme"
        },
    ]
    
    print("=" * 70)
    print("Sentiment Pipeline Test")
    print("=" * 70)
    print()
    
    for i, test in enumerate(test_cases, 1):
        text = test["text"]
        description = test["description"]
        
        print(f"Test {i}: {description}")
        print(f"Text: \"{text}\"")
        print()
        
        try:
            result = process_message(text)
            
            print(f"  Message Sentiment: {result['message_sentiment']['sentiment']} "
                  f"(confidence: {result['message_sentiment']['confidence']:.3f})")
            print(f"  Places: {result['tags']['places']}")
            print(f"  Hotels: {result['tags']['hotels']}")
            print(f"  Themes: {result['tags']['themes']}")
            print(f"  Has Tags: {result['has_tags']}")
            print(f"  Tag-Sentiment Pairs: {len(result['tag_sentiments'])}")
            
            if result['tag_sentiments']:
                print("  Tag Sentiments:")
                for ts in result['tag_sentiments']:
                    print(f"    - {ts['tag']} ({ts['tag_type']}): {ts['sentiment']} "
                          f"({ts['confidence']:.3f})")
            
            print("  ✅ SUCCESS")
            
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
        
        print()
    
    # Test simple version
    print("=" * 70)
    print("Testing process_message_simple()")
    print("=" * 70)
    print()
    
    simple_result = process_message_simple("Baga is crowded")
    print(f"Text: \"Baga is crowded\"")
    print(f"Simple Result: {simple_result}")
    print()


if __name__ == "__main__":
    test_pipeline()
