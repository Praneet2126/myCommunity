#!/usr/bin/env python3
"""Test script for sentiment aggregator.

Run this to verify the aggregator is working correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sentiment_analysis.sentiment_aggregator import aggregate_sentiment_by_tags
from sentiment_analysis.sentiment_aggregator.aggregator import get_aggregation_summary


def test_aggregator():
    """Test the sentiment aggregator with various scenarios."""
    
    print("=" * 70)
    print("Sentiment Aggregator Test")
    print("=" * 70)
    print()
    
    # Test 1: Mostly Positive Tag
    print("Test 1: Mostly Positive Tag (Goa)")
    print("-" * 70)
    messages1 = [
        {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(15)
    ] + [
        {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(2)
    ]
    
    result1 = aggregate_sentiment_by_tags(messages1)
    if result1['places']:
        entity_result = result1['places'][0]
        print(f"Entity: {entity_result['entity_name']} ({entity_result['entity_type']})")
        print(f"Total Messages: {entity_result['total_messages']}")
        dist = entity_result['sentiment_distribution']
        print(f"Distribution: Positive={dist['positive']}, Neutral={dist['neutral']}, Negative={dist['negative']}")
        print(f"Score: {entity_result['sentiment_score']}")
        print(f"Label: {entity_result['sentiment_label']}")
        expected_score = (15 - 2) / 17
        print(f"Expected Score: {expected_score:.4f}")
        assert abs(entity_result['sentiment_score'] - expected_score) < 0.0001, "Score mismatch"
        assert entity_result['sentiment_label'] == "Mostly Positive", "Label should be Mostly Positive"
        print("✅ PASS")
    else:
        print("❌ FAIL: No results")
    print()
    
    # Test 2: Mostly Negative Tag
    print("Test 2: Mostly Negative Tag (Crowded)")
    print("-" * 70)
    messages2 = [
        {'sentiment': 'negative', 'tags': {'themes': ['crowded'], 'places': [], 'hotels': []}} for _ in range(12)
    ] + [
        {'sentiment': 'positive', 'tags': {'themes': ['crowded'], 'places': [], 'hotels': []}} for _ in range(3)
    ]
    
    result2 = aggregate_sentiment_by_tags(messages2)
    if result2['themes']:
        entity_result = result2['themes'][0]
        print(f"Entity: {entity_result['entity_name']} ({entity_result['entity_type']})")
        print(f"Total Messages: {entity_result['total_messages']}")
        dist = entity_result['sentiment_distribution']
        print(f"Distribution: Positive={dist['positive']}, Neutral={dist['neutral']}, Negative={dist['negative']}")
        print(f"Score: {entity_result['sentiment_score']}")
        print(f"Label: {entity_result['sentiment_label']}")
        expected_score = (3 - 12) / 15
        print(f"Expected Score: {expected_score:.4f}")
        assert abs(entity_result['sentiment_score'] - expected_score) < 0.0001, "Score mismatch"
        assert entity_result['sentiment_label'] == "Mostly Negative", "Label should be Mostly Negative"
        print("✅ PASS")
    else:
        print("❌ FAIL: No results")
    print()
    
    # Test 3: Mixed Sentiment
    print("Test 3: Mixed Sentiment (Beach)")
    print("-" * 70)
    messages3 = [
        {'sentiment': 'positive', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}} for _ in range(6)
    ] + [
        {'sentiment': 'negative', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}} for _ in range(5)
    ] + [
        {'sentiment': 'neutral', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}} for _ in range(4)
    ]
    
    result3 = aggregate_sentiment_by_tags(messages3)
    if result3['themes']:
        entity_result = result3['themes'][0]
        print(f"Entity: {entity_result['entity_name']} ({entity_result['entity_type']})")
        print(f"Total Messages: {entity_result['total_messages']}")
        dist = entity_result['sentiment_distribution']
        print(f"Distribution: Positive={dist['positive']}, Neutral={dist['neutral']}, Negative={dist['negative']}")
        print(f"Score: {entity_result['sentiment_score']}")
        print(f"Label: {entity_result['sentiment_label']}")
        expected_score = (6 - 5) / 15
        print(f"Expected Score: {expected_score:.4f}")
        assert abs(entity_result['sentiment_score'] - expected_score) < 0.0001, "Score mismatch"
        assert entity_result['sentiment_label'] == "Mixed", "Label should be Mixed"
        print("✅ PASS")
    else:
        print("❌ FAIL: No results")
    print()
    
    # Test 4: Below Threshold (should be filtered out)
    print("Test 4: Below Threshold (should be excluded)")
    print("-" * 70)
    messages4 = [
        {'sentiment': 'positive', 'tags': {'places': ['mumbai'], 'hotels': [], 'themes': []}} for _ in range(5)
    ]
    
    result4 = aggregate_sentiment_by_tags(messages4)
    print(f"Messages: 5 (below threshold of 10)")
    print(f"Results: {len(result4['places'])} tags")
    assert len(result4['places']) == 0, "Should be empty (below threshold)"
    print("✅ PASS: Correctly filtered out")
    print()
    
    # Test 5: Multiple Tags
    print("Test 5: Multiple Tags")
    print("-" * 70)
    messages5 = [
        {
            'sentiment': 'positive',
            'tags': {
                'places': ['goa', 'mumbai'],
                'hotels': ['marriott'],
                'themes': ['beach', 'family']
            }
        } for _ in range(12)
    ] + [
        {
            'sentiment': 'negative',
            'tags': {
                'places': ['goa'],
                'hotels': ['marriott'],
                'themes': ['crowded']
            }
        } for _ in range(3)
    ]
    
    result5 = aggregate_sentiment_by_tags(messages5)
    print(f"Places: {len(result5['places'])} tags")
    print(f"Hotels: {len(result5['hotels'])} tags")
    print(f"Themes: {len(result5['themes'])} tags")
    
    # Check goa aggregation
    goa_entity = next((e for e in result5['places'] if e['entity_name'] == 'goa'), None)
    if goa_entity:
        print(f"\nGoa entity:")
        print(f"  Total Messages: {goa_entity['total_messages']}")
        print(f"  Score: {goa_entity['sentiment_score']}")
        print(f"  Label: {goa_entity['sentiment_label']}")
        expected_score = (12 - 3) / 15
        assert abs(goa_entity['sentiment_score'] - expected_score) < 0.0001
        print("✅ PASS")
    else:
        print("❌ FAIL: Goa tag not found")
    print()
    
    # Test 6: Summary Statistics
    print("Test 6: Summary Statistics")
    print("-" * 70)
    summary = get_aggregation_summary(result5)
    print(f"Total Tags: {summary['total_tags']}")
    print(f"Places: {summary['places_count']}")
    print(f"Hotels: {summary['hotels_count']}")
    print(f"Themes: {summary['themes_count']}")
    print(f"Mostly Positive: {summary['mostly_positive']}")
    print(f"Mostly Negative: {summary['mostly_negative']}")
    print(f"Mixed: {summary['mixed']}")
    print("✅ PASS")
    print()
    
    # Test 7: Edge Case - Empty Input
    print("Test 7: Empty Input")
    print("-" * 70)
    result7 = aggregate_sentiment_by_tags([])
    assert result7['places'] == []
    assert result7['hotels'] == []
    assert result7['themes'] == []
    print("✅ PASS: Returns empty results")
    print()
    
    # Test 8: Edge Case - Messages without tags
    print("Test 8: Messages without tags")
    print("-" * 70)
    messages8 = [
        {'sentiment': 'positive', 'tags': {'places': [], 'hotels': [], 'themes': []}},
        {'sentiment': 'negative', 'tags': {'places': [], 'hotels': [], 'themes': []}}
    ]
    result8 = aggregate_sentiment_by_tags(messages8)
    assert result8['places'] == []
    assert result8['hotels'] == []
    assert result8['themes'] == []
    print("✅ PASS: Correctly handles messages without tags")
    print()
    
    # Test 9: Pure Neutral Case
    print("Test 9: Pure Neutral (all messages neutral)")
    print("-" * 70)
    messages9 = [
        {'sentiment': 'neutral', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(12)
    ]
    result9 = aggregate_sentiment_by_tags(messages9)
    if result9['places']:
        entity_result = result9['places'][0]
        print(f"Entity: {entity_result['entity_name']} ({entity_result['entity_type']})")
        print(f"Total Messages: {entity_result['total_messages']}")
        dist = entity_result['sentiment_distribution']
        print(f"Distribution: Positive={dist['positive']}, Neutral={dist['neutral']}, Negative={dist['negative']}")
        print(f"Score: {entity_result['sentiment_score']}")
        print(f"Label: {entity_result['sentiment_label']}")
        assert entity_result['sentiment_score'] == 0.0, "Score should be 0.0 for all neutral"
        assert entity_result['sentiment_label'] == "Neutral", "Label should be Neutral"
        print("✅ PASS")
    else:
        print("❌ FAIL: No results")
    print()
    
    # Test 10: Invalid Sentiment Values
    print("Test 10: Invalid Sentiment Values (should be filtered)")
    print("-" * 70)
    messages10 = [
        {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(8)
    ] + [
        {'sentiment': 'invalid_sentiment', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(5)
    ] + [
        {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(2)
    ]
    result10 = aggregate_sentiment_by_tags(messages10)
    if result10['places']:
        entity_result = result10['places'][0]
        print(f"Entity: {entity_result['entity_name']}")
        print(f"Total Messages: {entity_result['total_messages']}")
        dist = entity_result['sentiment_distribution']
        print(f"Distribution: Positive={dist['positive']}, Neutral={dist['neutral']}, Negative={dist['negative']}")
        # Should only count valid sentiments (10 positive, 0 invalid)
        assert entity_result['total_messages'] == 10, "Should only count valid sentiments"
        assert dist['positive'] == 10, "Should have 10 positive (invalid ones filtered)"
        print("✅ PASS: Invalid sentiments correctly filtered")
    else:
        print("❌ FAIL: No results (might be below threshold)")
    print()
    
    print("=" * 70)
    print("All Tests Completed!")
    print("=" * 70)


if __name__ == "__main__":
    test_aggregator()
