#!/usr/bin/env python3
"""Comprehensive test script for sentiment aggregation.

Tests all edge cases and scenarios before API integration.
This is a temporary test file - can be removed after testing is complete.
"""

import sys
from pathlib import Path
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sentiment_analysis.sentiment_aggregator import aggregate_sentiment_by_tags
from sentiment_analysis.sentiment_aggregator.aggregator import get_aggregation_summary


def print_test_header(test_num, description):
    """Print formatted test header."""
    print("\n" + "=" * 70)
    print(f"Test {test_num}: {description}")
    print("=" * 70)


def print_entity_result(entity, show_details=True):
    """Print entity aggregation result."""
    print(f"\nEntity: {entity['entity_name']} ({entity['entity_type']})")
    print(f"  Total Messages: {entity['total_messages']}")
    dist = entity['sentiment_distribution']
    print(f"  Distribution: +{dist['positive']} / ~{dist['neutral']} / -{dist['negative']}")
    print(f"  Score: {entity['sentiment_score']:.4f}")
    print(f"  Label: {entity['sentiment_label']}")


def test_comprehensive():
    """Run comprehensive test suite."""
    
    print("=" * 70)
    print("COMPREHENSIVE SENTIMENT AGGREGATION TEST SUITE")
    print("=" * 70)
    print("\nThis test covers all edge cases and scenarios.")
    print("Run this before integrating with API endpoints.\n")
    
    passed = 0
    failed = 0
    
    # Test 1: Single entity with mixed sentiment
    print_test_header(1, "Single Entity with Mixed Sentiment")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(6)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(4)
        ] + [
            {'sentiment': 'neutral', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(2)
        ]
        
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 place entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 12, "Total should be 12"
        assert entity['sentiment_distribution']['positive'] == 6, "Should have 6 positive"
        assert entity['sentiment_distribution']['negative'] == 4, "Should have 4 negative"
        assert entity['sentiment_distribution']['neutral'] == 2, "Should have 2 neutral"
        assert abs(entity['sentiment_score'] - 0.1667) < 0.0001, "Score should be 0.1667"
        assert entity['sentiment_label'] == 'Mixed', "Label should be Mixed"
        print_entity_result(entity)
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 2: Entity just below threshold
    print_test_header(2, "Entity Just Below Threshold (Should be Excluded)")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['mumbai'], 'hotels': [], 'themes': []}} for _ in range(9)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 0, "Should be empty (below threshold of 10)"
        print(f"Messages: 9 (below threshold of 10)")
        print(f"Results: {len(result['places'])} entities")
        print("✅ PASS: Correctly filtered out")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 3: Entity just above threshold
    print_test_header(3, "Entity Just Above Threshold (Should be Included)")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['delhi'], 'hotels': [], 'themes': []}} for _ in range(8)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['delhi'], 'hotels': [], 'themes': []}} for _ in range(2)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 10, "Total should be exactly 10"
        assert abs(entity['sentiment_score'] - 0.6) < 0.0001, "Score should be 0.6"
        assert entity['sentiment_label'] == 'Mostly Positive', "Label should be Mostly Positive"
        print_entity_result(entity)
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 4: Messages with multiple tags
    print_test_header(4, "Messages with Multiple Tags")
    try:
        messages = [
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
        result = aggregate_sentiment_by_tags(messages)
        
        # Check goa (should have 15 messages: 12 positive + 3 negative)
        goa = next((e for e in result['places'] if e['entity_name'] == 'goa'), None)
        assert goa is not None, "Goa should exist"
        assert goa['total_messages'] == 15, "Goa should have 15 messages"
        assert abs(goa['sentiment_score'] - 0.6) < 0.0001, "Goa score should be 0.6"
        
        # Check mumbai (should have 12 messages: all positive)
        mumbai = next((e for e in result['places'] if e['entity_name'] == 'mumbai'), None)
        assert mumbai is not None, "Mumbai should exist"
        assert mumbai['total_messages'] == 12, "Mumbai should have 12 messages"
        assert abs(mumbai['sentiment_score'] - 1.0) < 0.0001, "Mumbai score should be 1.0"
        
        # Check marriott (should have 15 messages)
        marriott = next((e for e in result['hotels'] if e['entity_name'] == 'marriott'), None)
        assert marriott is not None, "Marriott should exist"
        assert marriott['total_messages'] == 15, "Marriott should have 15 messages"
        
        # Check crowded (should be filtered out - only 3 messages)
        crowded = next((e for e in result['themes'] if e['entity_name'] == 'crowded'), None)
        assert crowded is None, "Crowded should be filtered out (below threshold)"
        
        print(f"Places: {len(result['places'])} entities")
        print(f"Hotels: {len(result['hotels'])} entities")
        print(f"Themes: {len(result['themes'])} entities")
        print("\nGoa:")
        print_entity_result(goa, show_details=False)
        print("\nMumbai:")
        print_entity_result(mumbai, show_details=False)
        print("\nMarriott:")
        print_entity_result(marriott, show_details=False)
        print("\n✅ PASS: Multiple tags handled correctly")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 5: All-positive case
    print_test_header(5, "All-Positive Case")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(15)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 15, "Total should be 15"
        assert entity['sentiment_distribution']['positive'] == 15, "All should be positive"
        assert entity['sentiment_distribution']['negative'] == 0, "No negatives"
        assert entity['sentiment_distribution']['neutral'] == 0, "No neutrals"
        assert abs(entity['sentiment_score'] - 1.0) < 0.0001, "Score should be 1.0"
        assert entity['sentiment_label'] == 'Mostly Positive', "Label should be Mostly Positive"
        print_entity_result(entity)
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 6: All-negative case
    print_test_header(6, "All-Negative Case")
    try:
        messages = [
            {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(15)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 15, "Total should be 15"
        assert entity['sentiment_distribution']['negative'] == 15, "All should be negative"
        assert entity['sentiment_distribution']['positive'] == 0, "No positives"
        assert abs(entity['sentiment_score'] - (-1.0)) < 0.0001, "Score should be -1.0"
        assert entity['sentiment_label'] == 'Mostly Negative', "Label should be Mostly Negative"
        print_entity_result(entity)
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 7: All-neutral case
    print_test_header(7, "All-Neutral Case")
    try:
        messages = [
            {'sentiment': 'neutral', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(12)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 12, "Total should be 12"
        assert entity['sentiment_distribution']['neutral'] == 12, "All should be neutral"
        assert entity['sentiment_distribution']['positive'] == 0, "No positives"
        assert entity['sentiment_distribution']['negative'] == 0, "No negatives"
        assert abs(entity['sentiment_score'] - 0.0) < 0.0001, "Score should be 0.0"
        assert entity['sentiment_label'] == 'Neutral', "Label should be Neutral (not Mixed)"
        print_entity_result(entity)
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 8: No-tag messages (should be ignored)
    print_test_header(8, "No-Tag Messages (Should be Ignored)")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(10)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': [], 'hotels': [], 'themes': []}},  # No tags
            {'sentiment': 'positive', 'tags': {}},  # Empty tags
            {'sentiment': 'neutral'},  # Missing tags key
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 10, "Should only count messages with tags"
        assert entity['sentiment_distribution']['positive'] == 10, "Should have 10 positive"
        print_entity_result(entity)
        print("✅ PASS: No-tag messages correctly ignored")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 9: Boundary score cases
    print_test_header(9, "Boundary Score Cases")
    try:
        # 9a: Score exactly at positive threshold (0.4 > 0.3)
        messages_9a = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(7)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(3)
        ]
        result_9a = aggregate_sentiment_by_tags(messages_9a)
        entity_9a = result_9a['places'][0]
        assert abs(entity_9a['sentiment_score'] - 0.4) < 0.0001, "Score should be 0.4"
        assert entity_9a['sentiment_label'] == 'Mostly Positive', "Should be Mostly Positive"
        
        # 9b: Score just below positive threshold (0.2)
        messages_9b = [
            {'sentiment': 'positive', 'tags': {'places': ['mumbai'], 'hotels': [], 'themes': []}} for _ in range(6)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['mumbai'], 'hotels': [], 'themes': []}} for _ in range(4)
        ]
        result_9b = aggregate_sentiment_by_tags(messages_9b)
        entity_9b = result_9b['places'][0]
        assert abs(entity_9b['sentiment_score'] - 0.2) < 0.0001, "Score should be 0.2"
        assert entity_9b['sentiment_label'] == 'Mixed', "Should be Mixed"
        
        # 9c: Score exactly at negative threshold (-0.4 < -0.3)
        messages_9c = [
            {'sentiment': 'positive', 'tags': {'places': ['delhi'], 'hotels': [], 'themes': []}} for _ in range(3)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['delhi'], 'hotels': [], 'themes': []}} for _ in range(7)
        ]
        result_9c = aggregate_sentiment_by_tags(messages_9c)
        entity_9c = result_9c['places'][0]
        assert abs(entity_9c['sentiment_score'] - (-0.4)) < 0.0001, "Score should be -0.4"
        assert entity_9c['sentiment_label'] == 'Mostly Negative', "Should be Mostly Negative"
        
        print("9a: Score 0.4 → Mostly Positive ✅")
        print("9b: Score 0.2 → Mixed ✅")
        print("9c: Score -0.4 → Mostly Negative ✅")
        print("✅ PASS: Boundary cases handled correctly")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 10: Invalid sentiment values
    print_test_header(10, "Invalid Sentiment Values (Should be Filtered)")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(8)
        ] + [
            {'sentiment': 'invalid', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(5)
        ] + [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(2)
        ]
        result = aggregate_sentiment_by_tags(messages)
        assert len(result['places']) == 1, "Should have 1 entity"
        entity = result['places'][0]
        assert entity['total_messages'] == 10, "Should only count valid sentiments"
        assert entity['sentiment_distribution']['positive'] == 10, "Should have 10 positive (invalid filtered)"
        print_entity_result(entity)
        print("✅ PASS: Invalid sentiments correctly filtered")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 11: Empty input
    print_test_header(11, "Empty Input")
    try:
        result = aggregate_sentiment_by_tags([])
        assert result['places'] == [], "Should return empty lists"
        assert result['hotels'] == [], "Should return empty lists"
        assert result['themes'] == [], "Should return empty lists"
        print("✅ PASS: Empty input handled correctly")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Test 12: Summary statistics
    print_test_header(12, "Summary Statistics")
    try:
        messages = [
            {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}} for _ in range(12)
        ] + [
            {'sentiment': 'negative', 'tags': {'places': ['mumbai'], 'hotels': [], 'themes': []}} for _ in range(12)
        ] + [
            {'sentiment': 'neutral', 'tags': {'places': ['delhi'], 'hotels': [], 'themes': []}} for _ in range(12)
        ]
        result = aggregate_sentiment_by_tags(messages)
        summary = get_aggregation_summary(result)
        
        assert summary['total_tags'] == 3, "Should have 3 tags"
        assert summary['places_count'] == 3, "Should have 3 places"
        assert summary['mostly_positive'] == 1, "Goa should be Mostly Positive"
        assert summary['mostly_negative'] == 1, "Mumbai should be Mostly Negative"
        assert summary['neutral'] == 1, "Delhi should be Neutral"
        
        print(f"Total Tags: {summary['total_tags']}")
        print(f"Places: {summary['places_count']}")
        print(f"Mostly Positive: {summary['mostly_positive']}")
        print(f"Mostly Negative: {summary['mostly_negative']}")
        print(f"Neutral: {summary['neutral']}")
        print("✅ PASS")
        passed += 1
    except AssertionError as e:
        print(f"❌ FAIL: {e}")
        failed += 1
    
    # Final Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {passed + failed}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print("=" * 70)
    
    if failed == 0:
        print("\n🎉 All tests passed! Feature is ready for API integration.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review before integration.")
    
    return failed == 0


if __name__ == "__main__":
    success = test_comprehensive()
    sys.exit(0 if success else 1)
