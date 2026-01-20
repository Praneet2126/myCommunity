"""
Test script for time-aware itinerary generation
"""
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from services.activity_recommendation_service import (
    get_time_slot_priority,
    parse_time_to_minutes,
    ActivityRecommendationService
)


def test_time_slot_priority():
    """Test that activities are correctly categorized by time slot"""
    
    print("Testing Time Slot Priority Categorization...\n")
    
    # Test 1: Casino (should be night - priority 4)
    casino = {
        "name": "Deltin Royale Casino",
        "category": "Casino",
        "best_time": "08:00 PM - 02:00 AM"
    }
    priority, start, end = get_time_slot_priority(casino)
    assert priority == 4, f"Casino should be priority 4 (night), got {priority}"
    assert start == 21 * 60, f"Casino should start at 9 PM (1260 mins), got {start}"
    print("✓ Casino correctly categorized as night activity (Priority 4)")
    
    # Test 2: Beach (should be late afternoon - priority 2)
    beach = {
        "name": "Baga Beach",
        "category": "Beach",
        "best_time": "04:00 PM - 07:00 PM (Sunset)"
    }
    priority, start, end = get_time_slot_priority(beach)
    assert priority == 2, f"Beach should be priority 2 (late afternoon), got {priority}"
    assert end == 18 * 60, f"Beach should end by 6 PM (1080 mins), got {end}"
    print("✓ Beach correctly categorized as sunset activity (Priority 2, ends before 6 PM)")
    
    # Test 3: Trek (should be morning - priority 0)
    trek = {
        "name": "Dudhsagar Waterfall Trek",
        "category": "Trek",
        "best_time": "06:00 AM - 10:00 AM"
    }
    priority, start, end = get_time_slot_priority(trek)
    assert priority == 0, f"Trek should be priority 0 (morning), got {priority}"
    assert start == 6 * 60, f"Trek should start at 6 AM (360 mins), got {start}"
    print("✓ Trek correctly categorized as morning activity (Priority 0)")
    
    # Test 4: Water Sport (should be afternoon - priority 1)
    water_sport = {
        "name": "Scuba Diving at Grande Island",
        "category": "Water Sports",
        "best_time": "10:00 AM - 04:00 PM"
    }
    priority, start, end = get_time_slot_priority(water_sport)
    assert priority == 1, f"Water sport should be priority 1 (afternoon), got {priority}"
    assert end == 17 * 60, f"Water sport should end by 5 PM (1020 mins), got {end}"
    print("✓ Water sport correctly categorized as afternoon activity (Priority 1)")
    
    # Test 5: Nightclub (should be night - priority 4)
    nightclub = {
        "name": "Tito's Lane",
        "category": "Nightlife",
        "best_time": "09:00 PM - 03:00 AM"
    }
    priority, start, end = get_time_slot_priority(nightclub)
    assert priority == 4, f"Nightclub should be priority 4 (night), got {priority}"
    assert start == 21 * 60, f"Nightclub should start at 9 PM (1260 mins), got {start}"
    print("✓ Nightclub correctly categorized as night activity (Priority 4)")
    
    # Test 6: Museum (should be afternoon - priority 1)
    museum = {
        "name": "Museum of Christian Art",
        "category": "Museum",
        "best_time": "10:00 AM - 05:00 PM"
    }
    priority, start, end = get_time_slot_priority(museum)
    assert priority == 1, f"Museum should be priority 1 (afternoon), got {priority}"
    print("✓ Museum correctly categorized as afternoon activity (Priority 1)")
    
    print("\n✅ All time slot priority tests passed!\n")


def test_time_parsing():
    """Test time string parsing to minutes"""
    
    print("Testing Time Parsing...\n")
    
    assert parse_time_to_minutes("09:00 AM") == 9 * 60, "9:00 AM should be 540 minutes"
    assert parse_time_to_minutes("12:00 PM") == 12 * 60, "12:00 PM should be 720 minutes"
    assert parse_time_to_minutes("06:00 PM") == 18 * 60, "6:00 PM should be 1080 minutes"
    assert parse_time_to_minutes("09:00 PM") == 21 * 60, "9:00 PM should be 1260 minutes"
    assert parse_time_to_minutes("12:00 AM") == 0, "12:00 AM should be 0 minutes"
    
    print("✓ All time parsing tests passed!")
    print("\n✅ All tests completed successfully!\n")


def test_itinerary_generation():
    """Test full itinerary generation with time awareness"""
    
    print("Testing Full Itinerary Generation...\n")
    
    # Sample activities of different types
    sample_places = [
        {
            "name": "Dudhsagar Waterfall Trek",
            "category": "Trek",
            "best_time": "06:00 AM - 10:00 AM",
            "duration": "3-4 hours",
            "region": "Central",
            "description": "Beautiful waterfall trek"
        },
        {
            "name": "Baga Beach",
            "category": "Beach",
            "best_time": "04:00 PM - 07:00 PM (Sunset)",
            "duration": "2-3 hours",
            "region": "North",
            "description": "Popular beach"
        },
        {
            "name": "Deltin Royale Casino",
            "category": "Casino",
            "best_time": "08:00 PM - 02:00 AM",
            "duration": "4-6 hours",
            "region": "Central",
            "description": "Luxury casino"
        }
    ]
    
    # Initialize service
    service = ActivityRecommendationService()
    
    # Generate itinerary
    itinerary = service._generate_deterministic_itinerary(
        chat_id="test_chat_123",
        all_places=sample_places,
        num_days=1,
        num_people=2
    )
    
    print(f"Generated itinerary for chat: {itinerary['chat_id']}")
    print(f"Number of days: {len(itinerary['days'])}")
    
    if itinerary['days']:
        day = itinerary['days'][0]
        print(f"\nDay {day['day']} - Total duration: {day['total_duration_mins']} mins")
        print("Activities:")
        
        for i, activity in enumerate(day['activities'], 1):
            print(f"  {i}. {activity['name']}")
            print(f"     Time: {activity['start_time']} - {activity['end_time']}")
            print(f"     Category: {activity['category']}")
            print(f"     Travel time: {activity['travel_time_from_prev']}")
            print()
            
            # Verify time constraints
            start_time = activity['start_time']
            
            # Check if trek is in the morning
            if "Trek" in activity['category']:
                assert "AM" in start_time, "Trek should be scheduled in AM"
                print("     ✓ Trek correctly scheduled in morning")
            
            # Check if beach ends before 6 PM
            if "Beach" in activity['category']:
                end_time = activity['end_time']
                end_hour = int(end_time.split(':')[0])
                if "PM" in end_time and end_hour != 12:
                    assert end_hour <= 6, "Beach should end before 6 PM"
                print("     ✓ Beach correctly scheduled before 6 PM")
            
            # Check if casino is at night
            if "Casino" in activity['category']:
                start_hour = int(start_time.split(':')[0])
                if "PM" in start_time:
                    assert start_hour >= 8, "Casino should start after 8 PM"
                print("     ✓ Casino correctly scheduled at night")
    
    print("\n✅ Itinerary generation test completed!\n")


if __name__ == "__main__":
    print("=" * 60)
    print("TIME-AWARE ITINERARY GENERATION TEST SUITE")
    print("=" * 60)
    print()
    
    try:
        test_time_slot_priority()
        test_time_parsing()
        test_itinerary_generation()
        
        print("=" * 60)
        print("ALL TESTS PASSED! ✅")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
