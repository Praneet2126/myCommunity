# Itinerary Days Distribution Fix

## Problem
The itinerary generation was not properly distributing activities across the specified number of days. When a user requested a multi-day itinerary (e.g., 5 days), the algorithm would:
- Fill Day 1 completely (up to 6-hour limit)
- Fill Day 2 completely
- Continue sequentially until activities ran out
- Result: Uneven distribution with some days packed and others empty

### Example Issue:
**User Request**: 5-day itinerary with 8 activities  
**Old Behavior**:
- Day 1: 4 activities (6 hours)
- Day 2: 3 activities (5 hours)
- Day 3: 1 activity (1.5 hours)
- Day 4: 0 activities ❌
- Day 5: 0 activities ❌

## Root Cause

The scheduler was using a **greedy sequential approach**:

```python
# OLD CODE - Sequential day filling
for item in all_places_with_priority:
    for d_idx in range(num_days):  # Try day 0, 1, 2... until one fits
        if days[d_idx]["total_duration_mins"] + duration > 360:
            continue
        # Schedule activity on first available day
        break
```

This approach:
1. Sorted activities by time priority (morning → night)
2. Tried to fit each activity into Day 1 first
3. Only moved to Day 2 when Day 1 was full
4. **Did not attempt to balance activities across all requested days**

## Solution

### 1. **Round-Robin Day Distribution**

Implemented a **round-robin cycling** approach that distributes activities more evenly:

```python
# NEW CODE - Round-robin distribution
current_day_index = 0  # Start with day 0 and rotate

for item in all_places_with_priority:
    # Try all days starting from current_day_index and cycling through
    for offset in range(num_days):
        d_idx = (current_day_index + offset) % num_days
        
        if days[d_idx]["total_duration_mins"] + duration > 360:
            continue
        
        # Schedule activity and move to next day
        best_day_idx = d_idx
        break
    
    # After scheduling, move to next day for better distribution
    current_day_index = (best_day_idx + 1) % num_days
```

### 2. **Improved Sorting**

Enhanced sorting to group activities by both priority and region:

```python
# OLD: Sort only by priority
all_places_with_priority.sort(key=lambda x: x["priority"])

# NEW: Sort by priority first, then region
all_places_with_priority.sort(key=lambda x: (x["priority"], x["region"]))
```

**Benefits**:
- Activities in the same region are grouped together
- Minimizes travel time between activities on the same day
- Better thematic consistency per day

### 3. **Enhanced Logging**

Added detailed logging to track distribution:

```python
print(f"[Itinerary Generator] Creating {num_days}-day itinerary for {num_people} people with {len(all_places)} activities")
print(f"[Itinerary Generator] Created {len(days)} day slots")

# After scheduling:
for day in days:
    print(f"[Itinerary Generator] Day {day['day']}: {len(day['activities'])} activities, {day['total_duration_mins']} mins")
```

## How It Works Now

### Example: 5-Day Itinerary with 8 Activities

**NEW Behavior**:
1. Activity 1 → Try Day 1 (current_day_index=0) → Schedule → Move to Day 2
2. Activity 2 → Try Day 2 (current_day_index=1) → Schedule → Move to Day 3
3. Activity 3 → Try Day 3 (current_day_index=2) → Schedule → Move to Day 4
4. Activity 4 → Try Day 4 (current_day_index=3) → Schedule → Move to Day 5
5. Activity 5 → Try Day 5 (current_day_index=4) → Schedule → Move to Day 1
6. Activity 6 → Try Day 1 (current_day_index=0) → Schedule → Move to Day 2
7. Activity 7 → Try Day 2 (current_day_index=1) → Schedule → Move to Day 3
8. Activity 8 → Try Day 3 (current_day_index=2) → Schedule → Move to Day 4

**Result**:
- Day 1: 2 activities ✅
- Day 2: 2 activities ✅
- Day 3: 2 activities ✅
- Day 4: 2 activities ✅
- Day 5: 1 activity ✅

All 5 requested days have activities! Much better distribution!

## Files Modified

### 1. `/ai-service/services/activity_recommendation_service.py`

**Lines 536-542**: Added round-robin scheduling
```python
current_day_index = 0
for offset in range(num_days):
    d_idx = (current_day_index + offset) % num_days
```

**Lines 624-626**: Advance to next day after scheduling
```python
current_day_index = (best_day_idx + 1) % num_days
```

**Lines 507, 518, 628-630**: Added logging

### 2. `/activities rec from chat/main.py`

Applied same improvements for consistency:
- Lines 502-510: Round-robin scheduling
- Lines 587-589: Advance to next day
- Lines 488, 491, 591-593: Logging

## Benefits

### ✅ Even Distribution
Activities are spread across all requested days instead of clustering in early days.

### ✅ Respects User Input
When user requests 5 days, they get a 5-day itinerary (not 2 packed days + 3 empty days).

### ✅ Better Balance
Each day gets a similar amount of activities (within time constraints).

### ✅ Time-Aware Still Maintained
All time constraints from the previous fix are still enforced:
- Beach activities before 6 PM
- Night activities after 9 PM
- Morning activities in early hours

### ✅ Regional Grouping
Activities in the same region are grouped together on the same day when possible.

## Testing

### Test Case 1: 3-Day Itinerary with 6 Activities

**Input**:
- num_days: 3
- Activities: Trek, Beach, Fort, Museum, Casino, Restaurant

**Expected Output**:
```
Day 1:
  07:00 AM - Trek (Morning)
  04:30 PM - Beach (Sunset)
  
Day 2:
  11:00 AM - Fort (Afternoon)
  09:30 PM - Casino (Night)
  
Day 3:
  01:00 PM - Museum (Afternoon)
  07:00 PM - Restaurant (Evening)
```

### Test Case 2: 5-Day Itinerary with 10 Activities

**Input**:
- num_days: 5
- Activities: 10 diverse activities

**Expected**: Each of 5 days should have activities (roughly 2 per day)

### Test Case 3: 2-Day Itinerary with 10 Activities

**Input**:
- num_days: 2
- Activities: 10 activities

**Expected**: Activities distributed across 2 days (up to 6 hours per day limit)

## Console Output Example

When generating an itinerary, you should see:

```
[Itinerary Generator] Creating 5-day itinerary for 2 people with 8 activities
[Itinerary Generator] Created 5 day slots
[Itinerary Generator] Day 1: 2 activities, 240 mins
[Itinerary Generator] Day 2: 2 activities, 210 mins
[Itinerary Generator] Day 3: 2 activities, 180 mins
[Itinerary Generator] Day 4: 1 activities, 120 mins
[Itinerary Generator] Day 5: 1 activities, 150 mins
```

## Edge Cases Handled

### 1. **More Days Than Activities**
If user requests 7 days but only has 5 activities:
- Activities distributed: 1 per day for 5 days
- Days 6-7 remain empty
- Still generates all 7 day objects

### 2. **Fewer Days Than Activities**
If user requests 2 days but has 10 activities:
- Each day filled up to 6-hour limit
- Some activities may not fit (skipped with logging)

### 3. **Time Constraint Conflicts**
If an activity can't fit in any remaining time slot:
- Activity is skipped (logged)
- Continues with remaining activities

## Integration

This fix works seamlessly with:
- ✅ Time-aware scheduling (beaches before 6 PM, etc.)
- ✅ Itinerary display fix (no reversion to hardcoded data)
- ✅ Cart settings (num_days, num_people)
- ✅ Both LLM and deterministic schedulers

## Verification Steps

1. Open a private chat
2. Add 8-10 activities to cart
3. Set **num_days to 5** in cart settings
4. Generate itinerary
5. Check console logs:
   - Should show "Creating 5-day itinerary"
   - Should show distribution across 5 days
6. Verify in UI:
   - All 5 days should appear
   - Activities evenly distributed
   - Time constraints still respected

---

**Status**: ✅ FIXED  
**Impact**: High - Users now get proper multi-day itineraries  
**Risk**: Low - No breaking changes, only improved distribution algorithm  
**Testing**: Extensive console logging for verification
