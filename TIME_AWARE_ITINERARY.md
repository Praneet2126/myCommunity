# Time-Aware Itinerary Generation

## Overview
The itinerary generation service has been enhanced to be **time-aware**, ensuring that activities are scheduled at appropriate times based on their nature and operational hours.

## Key Improvements

### 1. **Time-Specific Scheduling Rules**

Activities are now categorized into 5 time slots with strict scheduling constraints:

#### Priority 0: Morning Activities (6 AM - 11 AM)
- **Activities**: Treks, Wildlife tours, Yoga, Nature walks, Bird watching
- **Rationale**: Best lighting, cooler weather, wildlife most active
- **Example**: Dudhsagar Trek, Bhagwan Mahavir Wildlife Sanctuary

#### Priority 1: Afternoon Activities (11 AM - 4 PM)
- **Activities**: Museums, Forts, Shopping, Water sports, Churches
- **Rationale**: Main operational hours for indoor and cultural attractions
- **Example**: Fort Aguada, Basilica of Bom Jesus, Anjuna Flea Market

#### Priority 2: Beach/Sunset Activities (4 PM - 6 PM)
- **Activities**: Beach visits, Sunset viewpoints
- **STRICT RULE**: Must end before 6:00 PM (beaches close)
- **Example**: Baga Beach, Palolem Beach, Chapora Fort sunset

#### Priority 3: Evening Activities (6 PM - 9 PM)
- **Activities**: Dining, River cruises, Cultural shows
- **Rationale**: Perfect time for dining and entertainment
- **Example**: Mandovi River Cruise, Fine dining restaurants

#### Priority 4: Night Activities (9 PM - 3 AM)
- **Activities**: Casinos, Nightclubs, Late-night parties
- **STRICT RULE**: Must start after 9:00 PM
- **Example**: Deltin Royale Casino, Tito's Lane, LPK Waterfront

### 2. **Intelligent Time Slot Detection**

The system uses the `get_time_slot_priority()` function to automatically categorize activities based on:

- **Category keywords**: "casino", "nightlife", "trek", "wildlife", "beach", "water sports"
- **Name analysis**: Detecting keywords like "club", "casino", "party", "beach", "trek"
- **Best time field**: Parsing the activity's recommended time from the data
- **Description context**: Additional context for ambiguous activities

### 3. **Enhanced LLM Prompts**

Both LLM-based and deterministic schedulers now use enhanced prompts that explicitly state:

```
TIME-SPECIFIC SCHEDULING:
- Morning Activities (6 AM - 11 AM): Treks, Wildlife tours, Yoga, Morning water sports
- Afternoon Activities (11 AM - 4 PM): Museums, Forts, Shopping, Water sports
- Late Afternoon/Sunset (4 PM - 6 PM): Beach visits, Sunset spots (MUST end before 6 PM)
- Evening (6 PM - 9 PM): Dining, River cruises, Cultural shows
- Night Activities (9 PM - 3 AM): Casinos, Nightclubs, Late-night parties

STRICT CONSTRAINTS:
- Beach activities MUST be scheduled before 6:00 PM
- Nightclubs and parties MUST start after 9:00 PM
- Casinos MUST be scheduled after 8:00 PM
- Water sports MUST be between 10:00 AM and 5:00 PM
- Wildlife/nature activities MUST be in early morning (before 11 AM)
```

### 4. **Deterministic Scheduler Improvements**

The fallback scheduler now:

1. **Prioritizes by time slot**: Activities are sorted by their priority (morning → night)
2. **Respects time windows**: Each activity must fit within its designated time window
3. **Validates scheduling**: Before placing an activity, it checks:
   - Is there enough time in the day? (max 6 hours per day)
   - Does it fit in the appropriate time slot?
   - Will it end before the closing time?
4. **Handles gaps intelligently**: If the current time is too early for a night activity, it jumps to the appropriate start time

## Code Changes

### Files Modified

1. **`/ai-service/services/activity_recommendation_service.py`**
   - Updated LLM prompt with time-specific rules
   - Added `parse_time_to_minutes()` helper function
   - Added `get_time_slot_priority()` for activity categorization
   - Rewrote `_generate_deterministic_itinerary()` with time-aware logic

2. **`/activities rec from chat/main.py`**
   - Applied same improvements for consistency
   - Updated LLM prompt
   - Added helper functions
   - Enhanced deterministic scheduler

### New Helper Functions

#### `parse_time_to_minutes(time_str: str) -> int`
Converts time strings like "09:00 AM" to minutes from midnight (540).

#### `get_time_slot_priority(place: Dict) -> tuple`
Returns `(priority, earliest_start_minutes, latest_end_minutes)`:
- **priority**: 0-4 indicating the time slot
- **earliest_start**: Earliest time the activity can start (in minutes)
- **latest_end**: Latest time the activity must end (in minutes)

## Example Scenarios

### Scenario 1: Beach Visit
**Before**: Beach scheduled at 7:00 PM (after closing)
**After**: Beach scheduled at 4:30 PM - 6:00 PM (ends before closing)

### Scenario 2: Casino Visit
**Before**: Casino scheduled at 3:00 PM (not prime time)
**After**: Casino scheduled at 8:30 PM - 11:30 PM (proper nightlife hours)

### Scenario 3: Wildlife Trek
**Before**: Wildlife trek at 2:00 PM (hot weather, less wildlife)
**After**: Wildlife trek at 6:30 AM - 9:30 AM (optimal conditions)

### Scenario 4: Multi-day Itinerary
```
Day 1:
  07:00 AM - 10:00 AM: Dudhsagar Waterfall Trek (Morning)
  11:00 AM - 01:00 PM: Fort Aguada (Afternoon)
  04:30 PM - 06:00 PM: Baga Beach (Sunset)
  07:00 PM - 09:00 PM: River Cruise Dinner (Evening)

Day 2:
  10:00 AM - 12:00 PM: Scuba Diving (Morning water sport)
  01:00 PM - 03:00 PM: Basilica of Bom Jesus (Afternoon)
  04:00 PM - 06:00 PM: Palolem Beach (Sunset)
  09:30 PM - 12:30 AM: Tito's Lane Clubbing (Night)
```

## Benefits

1. **Realistic Itineraries**: Activities scheduled when they're actually open/available
2. **Better User Experience**: Tourists visit attractions at optimal times
3. **Respects Constraints**: No beach activities after closing, no morning nightclub visits
4. **Chronological Flow**: Day progresses naturally from morning to night
5. **Maximizes Enjoyment**: Activities scheduled for best weather/lighting conditions

## Testing

To test the time-aware scheduling:

1. Add various activity types to cart (beach, club, trek, museum)
2. Generate itinerary
3. Verify:
   - Morning activities (treks, wildlife) scheduled 6-11 AM
   - Beach activities end before 6 PM
   - Nightclubs/casinos start after 9 PM
   - No overlapping times
   - Chronological progression

## Future Enhancements

1. **Seasonal awareness**: Adjust times based on season (sunset times vary)
2. **Day-specific scheduling**: Some activities only on certain days (markets)
3. **Real-time updates**: Check actual operating hours via API
4. **User preferences**: Allow users to specify "night owl" vs "early bird" preferences
5. **Travel optimization**: Group activities by region while respecting time slots
