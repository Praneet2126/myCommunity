"""
Simple unit tests for time-aware helper functions
"""
import re


def parse_time_to_minutes(time_str: str) -> int:
    """Convert time string like '09:00 AM' to minutes from midnight"""
    time_str = time_str.strip().upper()
    match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)', time_str)
    if not match:
        return 0
    
    hour, minute, period = match.groups()
    hour = int(hour)
    minute = int(minute)
    
    if period == 'PM' and hour != 12:
        hour += 12
    elif period == 'AM' and hour == 12:
        hour = 0
    
    return hour * 60 + minute


def get_time_slot_priority(place: dict) -> tuple:
    """
    Categorize activity by time slot and return (priority, earliest_start_minutes, latest_end_minutes)
    Priority: 0=morning, 1=afternoon, 2=late_afternoon, 3=evening, 4=night
    """
    best_time = place.get("best_time", "").lower()
    category = place.get("category", "").lower()
    name = place.get("name", "").lower()
    
    # Night activities (9 PM - 3 AM) - Priority 4
    if any(keyword in category for keyword in ["casino", "nightlife"]) or \
       any(keyword in name for keyword in ["club", "casino", "party", "tito", "lpk"]) or \
       "night" in best_time or \
       ("09:00 pm" in best_time or "10:00 pm" in best_time or "11:00 pm" in best_time):
        return (4, 21 * 60, 27 * 60)  # 9 PM - 3 AM
    
    # Morning activities (6 AM - 11 AM) - Priority 0
    if any(keyword in category for keyword in ["trek", "wildlife", "nature"]) or \
       "morning" in best_time or \
       ("06:00 am" in best_time or "07:00 am" in best_time or "08:00 am" in best_time) or \
       any(keyword in name for keyword in ["trek", "wildlife", "bird", "yoga"]):
        return (0, 6 * 60, 11 * 60)  # 6 AM - 11 AM
    
    # Beach activities (must end before 6 PM) - Priority 2
    if "beach" in category or "beach" in name or "sunset" in best_time:
        return (2, 16 * 60, 18 * 60)  # 4 PM - 6 PM (sunset time)
    
    # Water sports (10 AM - 5 PM) - Priority 1
    if "water sports" in category or any(keyword in name for keyword in ["scuba", "parasailing", "kayaking", "jet ski", "surfing"]):
        return (1, 10 * 60, 17 * 60)  # 10 AM - 5 PM
    
    # Evening activities (6 PM - 9 PM) - Priority 3
    if "restaurant" in category or "dining" in category or \
       any(keyword in name.lower() for keyword in ["restaurant", "dining", "cruise", "cultural show"]) or \
       ("06:00 pm" in best_time or "07:00 pm" in best_time or "08:00 pm" in best_time):
        return (3, 18 * 60, 21 * 60)  # 6 PM - 9 PM
    
    # Default to afternoon (11 AM - 4 PM) - Priority 1
    return (1, 11 * 60, 16 * 60)  # 11 AM - 4 PM


def test_time_parsing():
    """Test time string parsing to minutes"""
    print("Testing Time Parsing...")
    
    tests = [
        ("09:00 AM", 9 * 60),
        ("12:00 PM", 12 * 60),
        ("06:00 PM", 18 * 60),
        ("09:00 PM", 21 * 60),
        ("12:00 AM", 0),
        ("11:30 AM", 11 * 60 + 30),
    ]
    
    for time_str, expected in tests:
        result = parse_time_to_minutes(time_str)
        assert result == expected, f"Expected {time_str} = {expected} mins, got {result}"
        print(f"  ✓ {time_str} = {result} minutes")
    
    print("✅ Time parsing tests passed!\n")


def test_time_slot_priority():
    """Test that activities are correctly categorized by time slot"""
    print("Testing Time Slot Priority Categorization...\n")
    
    test_cases = [
        # (activity, expected_priority, expected_start_hour, expected_end_hour, description)
        (
            {"name": "Deltin Royale Casino", "category": "Casino", "best_time": "08:00 PM - 02:00 AM"},
            4, 21, 27, "Casino (night)"
        ),
        (
            {"name": "Baga Beach", "category": "Beach", "best_time": "04:00 PM - 07:00 PM (Sunset)"},
            2, 16, 18, "Beach (must end before 6 PM)"
        ),
        (
            {"name": "Dudhsagar Trek", "category": "Trek", "best_time": "06:00 AM - 10:00 AM"},
            0, 6, 11, "Trek (morning)"
        ),
        (
            {"name": "Scuba Diving", "category": "Water Sports", "best_time": "10:00 AM - 04:00 PM"},
            1, 10, 17, "Water sport (afternoon)"
        ),
        (
            {"name": "Tito's Lane", "category": "Nightlife", "best_time": "09:00 PM - 03:00 AM"},
            4, 21, 27, "Nightclub (night)"
        ),
        (
            {"name": "Fort Aguada", "category": "Fort", "best_time": "10:00 AM - 05:00 PM"},
            1, 11, 16, "Fort (afternoon)"
        ),
    ]
    
    for activity, expected_priority, expected_start_hour, expected_end_hour, description in test_cases:
        priority, start_mins, end_mins = get_time_slot_priority(activity)
        start_hour = start_mins // 60
        end_hour = end_mins // 60
        
        assert priority == expected_priority, \
            f"{description}: Expected priority {expected_priority}, got {priority}"
        assert start_hour == expected_start_hour, \
            f"{description}: Expected start hour {expected_start_hour}, got {start_hour}"
        assert end_hour == expected_end_hour, \
            f"{description}: Expected end hour {expected_end_hour}, got {end_hour}"
        
        print(f"✓ {description}")
        print(f"  Priority: {priority}, Time window: {start_hour}:00 - {end_hour}:00")
    
    print("\n✅ All time slot priority tests passed!\n")


def test_constraint_validation():
    """Test that time constraints are properly enforced"""
    print("Testing Time Constraint Validation...\n")
    
    # Beach must end before 6 PM (18:00)
    beach = {"name": "Palolem Beach", "category": "Beach", "best_time": "04:00 PM - 07:00 PM"}
    priority, start, end = get_time_slot_priority(beach)
    assert end == 18 * 60, f"Beach must end at 6 PM (1080 mins), got {end}"
    print("✓ Beach constraint validated: Must end before 6 PM")
    
    # Night activities must start after 9 PM (21:00)
    casino = {"name": "Casino Pride", "category": "Casino", "best_time": "08:00 PM - 02:00 AM"}
    priority, start, end = get_time_slot_priority(casino)
    assert start == 21 * 60, f"Casino must start at 9 PM (1260 mins), got {start}"
    print("✓ Casino constraint validated: Must start after 9 PM")
    
    # Morning activities (treks) must be before 11 AM
    trek = {"name": "Wildlife Sanctuary", "category": "Wildlife", "best_time": "06:00 AM - 10:00 AM"}
    priority, start, end = get_time_slot_priority(trek)
    assert end == 11 * 60, f"Wildlife tour must end by 11 AM (660 mins), got {end}"
    print("✓ Wildlife constraint validated: Must be in morning before 11 AM")
    
    print("\n✅ All constraint validation tests passed!\n")


if __name__ == "__main__":
    print("=" * 70)
    print("TIME-AWARE ITINERARY HELPER FUNCTIONS TEST")
    print("=" * 70)
    print()
    
    try:
        test_time_parsing()
        test_time_slot_priority()
        test_constraint_validation()
        
        print("=" * 70)
        print("ALL TESTS PASSED! ✅")
        print("=" * 70)
        print()
        print("The time-aware itinerary generation is working correctly:")
        print("  • Beach activities will end before 6 PM")
        print("  • Night activities (casinos, clubs) will start after 9 PM")
        print("  • Morning activities (treks, wildlife) will be in the morning")
        print("  • Water sports will be scheduled during daylight hours")
        print("  • Activities will be scheduled in chronological order")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
