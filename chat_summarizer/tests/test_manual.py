"""Manual test script for quick verification of the chat summarizer module.

Run this to quickly test basic functionality without needing an API key.
"""

import sys
import pathlib

# Add parent directory to path to import chat_summarizer
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent))

from chat_summarizer import summarize_unread_messages


def test_below_thresholds():
    """Test that messages below thresholds are not summarized."""
    print("\n=== Test 1: Below Thresholds ===")
    messages = ["Short message"] * 10  # 10 messages, < 15
    result = summarize_unread_messages(messages)
    
    assert result['summarized'] == False, "Should not summarize"
    assert result['summary'] == [], "Summary should be empty"
    assert 'message count' in result['reason'].lower(), "Reason should mention message count"
    print(f"✓ Passed: {result['reason']}")
    print(f"  Stats: {result['stats']}")


def test_at_threshold():
    """Test that messages at exact threshold are summarized."""
    print("\n=== Test 2: At Threshold (will fail without API key) ===")
    # Create 15 messages with enough words (13+ words each = 200+ total)
    # Each message needs at least 13-14 words to reach 200 total
    messages = [
        "This is a comprehensive test message with enough words to meet the threshold requirement for summarization testing purposes and verification."
    ] * 15
    
    result = summarize_unread_messages(messages)
    
    if result['summarized']:
        print(f"✓ Summarized successfully!")
        print(f"  Summary has {len(result['summary'])} bullet points")
        for i, bullet in enumerate(result['summary'], 1):
            print(f"    {i}. {bullet}")
    else:
        print(f"✗ Not summarized: {result['reason']}")
        print(f"  (This is expected if API key is not set)")
    print(f"  Stats: {result['stats']}")


def test_invalid_input():
    """Test that invalid inputs raise ValueError."""
    print("\n=== Test 3: Invalid Input ===")
    
    # Test None
    try:
        summarize_unread_messages(None)
        print("✗ Failed: Should have raised ValueError for None")
    except ValueError as e:
        print(f"✓ Passed: Correctly raised ValueError for None: {e}")
    
    # Test empty list
    try:
        summarize_unread_messages([])
        print("✗ Failed: Should have raised ValueError for empty list")
    except ValueError as e:
        print(f"✓ Passed: Correctly raised ValueError for empty list: {e}")
    
    # Test non-list
    try:
        summarize_unread_messages("not a list")
        print("✗ Failed: Should have raised ValueError for non-list")
    except ValueError as e:
        print(f"✓ Passed: Correctly raised ValueError for non-list: {e}")


def test_word_counting():
    """Test word counting accuracy."""
    print("\n=== Test 4: Word Counting ===")
    messages = [
        "This message has exactly ten words in it for testing purposes.",
        "Another message with five words here.",
        "Short one."
    ]
    # Actual count: "This message has exactly ten words in it for testing purposes." = 10 words
    # "Another message with five words here." = 7 words
    # "Short one." = 2 words
    # Total: 10 + 7 + 2 = 19 words
    
    result = summarize_unread_messages(messages)
    
    expected_words = 19
    actual_words = result['stats']['word_count']
    
    if actual_words == expected_words:
        print(f"✓ Passed: Word count correct ({actual_words})")
    else:
        print(f"✗ Failed: Expected {expected_words}, got {actual_words}")
    
    print(f"  Message count: {result['stats']['message_count']}")
    print(f"  Word count: {result['stats']['word_count']}")


def test_both_thresholds_fail():
    """Test when both thresholds fail."""
    print("\n=== Test 5: Both Thresholds Fail ===")
    messages = ["Short"] * 10  # 10 messages, 10 words
    result = summarize_unread_messages(messages)
    
    assert result['summarized'] == False
    assert 'message count' in result['reason'].lower() or 'word count' in result['reason'].lower()
    print(f"✓ Passed: {result['reason']}")
    print(f"  Stats: {result['stats']}")


if __name__ == "__main__":
    print("=" * 60)
    print("Manual Test Suite for Chat Summarizer")
    print("=" * 60)
    
    try:
        test_invalid_input()
        test_word_counting()
        test_below_thresholds()
        test_both_thresholds_fail()
        test_at_threshold()
        
        print("\n" + "=" * 60)
        print("Manual tests completed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
