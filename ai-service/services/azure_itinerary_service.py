"""
Azure OpenAI-based itinerary generation service
"""
import json
from typing import List, Dict, Optional
from openai import AzureOpenAI
from config import settings


class AzureItineraryService:
    """Service for generating itineraries using Azure OpenAI"""
    
    def __init__(self):
        """Initialize Azure OpenAI client"""
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment = settings.AZURE_CHAT_DEPLOYMENT
        print(f"[AzureItineraryService] Initialized with deployment: {self.deployment}")
    
    def generate_itinerary(
        self, 
        chat_id: str, 
        num_days: int, 
        num_people: int, 
        activities: List[Dict],
        hotels: List[Dict] = None,
        mylens_data: List[Dict] = None
    ) -> Optional[Dict]:
        """
        Generate a comprehensive itinerary using Azure OpenAI
        
        Args:
            chat_id: Chat identifier
            num_days: Number of days for the trip
            num_people: Number of people
            activities: List of activity places from cart
            hotels: List of hotels from cart
            mylens_data: List of places from myLens
            
        Returns:
            Complete itinerary with activities and hotel assignments
        """
        try:
            # Prepare the system prompt with comprehensive instructions
            system_prompt = """You are an expert travel planner for Goa, India. Create a realistic, time-aware, well-structured itinerary.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY the number of days requested - do not skip any days
2. Each day should have a logical flow with no time overlaps
3. Include travel time between activities (typically 30-60 minutes)
4. Balance activities throughout the day - don't overload any single day
5. Assign appropriate hotels for accommodation based on location and quality

TIME-SENSITIVE SCHEDULING RULES:
- Morning Activities (6 AM - 11 AM): Treks, Wildlife tours, Yoga, Sunrise spots, Morning water sports
- Late Morning/Afternoon (11 AM - 4 PM): Museums, Forts, Shopping, Lunch, Water sports
- Late Afternoon/Sunset (4 PM - 6 PM): Beach visits, Sunset viewpoints (MUST end before 6 PM)
- Evening (6 PM - 9 PM): Dining, River cruises, Cultural shows, Casual bars
- Night (9 PM - 3 AM): Casinos, Nightclubs, Beach parties

STRICT CONSTRAINTS:
✓ Beach activities → Before 6:00 PM (beaches close at sunset)
✓ Water sports → Between 10:00 AM and 5:00 PM
✓ Nightclubs/Parties → After 9:00 PM
✓ Casinos → After 8:00 PM
✓ Wildlife/Nature → Early morning (before 11:00 AM)
✓ Forts/Museums → Late morning to afternoon
✓ Shopping/Markets → Afternoon to evening
✓ Adventure sports → Morning or early afternoon

HOTEL SELECTION:
- Assign one hotel per day based on:
  * Proximity to activities planned for that day
  * Hotel rating and quality
  * Price range
- Consider check-in/check-out logistics

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanations) with this exact structure:
{
  "chat_id": "string",
  "num_people": number,
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "name": "Activity Name",
          "start_time": "09:00 AM",
          "end_time": "11:00 AM",
          "travel_time_from_prev": "45 mins",
          "region": "North Goa",
          "category": "Adventure",
          "duration": "2 hours",
          "description": "Brief description"
        }
      ],
      "total_duration_mins": 360
    }
  ],
  "hotels": [
    {
      "day": 1,
      "hotel_id": "hotel_id_from_input",
      "name": "Hotel Name",
      "price": 5000,
      "stars": 4,
      "description": "Hotel description",
      "image_url": "url",
      "reason": "Why this hotel for this day"
    }
  ]
}

IMPORTANT: 
- Use 12-hour time format (e.g., 09:00 AM, 02:30 PM)
- Each day should have 4-6 activities max
- Total activity time per day: 6-8 hours (allowing rest time)
- Ensure activities flow geographically to minimize travel time
"""

            # Prepare user prompt with all data
            user_prompt = self._build_user_prompt(
                chat_id, num_days, num_people, activities, hotels, mylens_data
            )
            
            print(f"[AzureItineraryService] Generating itinerary for {num_days} days...")
            
            # Call Azure OpenAI
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            # Parse response
            content = response.choices[0].message.content
            itinerary = json.loads(content)
            
            # Validate the response
            if not self._validate_itinerary(itinerary, num_days, chat_id):
                print("[AzureItineraryService] Validation failed")
                return None
            
            print(f"[AzureItineraryService] Successfully generated {len(itinerary.get('days', []))} days")
            return itinerary
            
        except Exception as e:
            print(f"[AzureItineraryService] Error generating itinerary: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _build_user_prompt(
        self, 
        chat_id: str,
        num_days: int, 
        num_people: int, 
        activities: List[Dict],
        hotels: List[Dict] = None,
        mylens_data: List[Dict] = None
    ) -> str:
        """Build comprehensive user prompt with all data"""
        
        prompt_parts = [
            f"Create a {num_days}-day itinerary for {num_people} people in Goa.",
            f"Chat ID: {chat_id}",
            "",
            "ACTIVITIES IN CART:"
        ]
        
        # Add activities
        if activities:
            for i, activity in enumerate(activities, 1):
                prompt_parts.append(f"{i}. {activity.get('name', 'Unknown')}")
                if activity.get('region'):
                    prompt_parts.append(f"   Location: {activity['region']}")
                if activity.get('category'):
                    prompt_parts.append(f"   Category: {activity['category']}")
                if activity.get('opening_hours'):
                    prompt_parts.append(f"   Hours: {activity['opening_hours']}")
                if activity.get('duration'):
                    prompt_parts.append(f"   Duration: {activity['duration']}")
                if activity.get('description'):
                    prompt_parts.append(f"   Description: {activity['description'][:100]}")
                prompt_parts.append("")
        else:
            prompt_parts.append("(No activities in cart)")
            prompt_parts.append("")
        
        # Add hotels
        if hotels:
            prompt_parts.append("HOTELS IN CART:")
            for i, hotel in enumerate(hotels, 1):
                prompt_parts.append(f"{i}. {hotel.get('name', 'Unknown Hotel')}")
                if hotel.get('stars'):
                    prompt_parts.append(f"   Rating: {hotel['stars']} stars")
                if hotel.get('price'):
                    prompt_parts.append(f"   Price: ₹{hotel['price']}/night")
                if hotel.get('description'):
                    prompt_parts.append(f"   Description: {hotel['description'][:100]}")
                prompt_parts.append(f"   Hotel ID: {hotel.get('hotel_id', 'unknown')}")
                prompt_parts.append("")
        
        # Add myLens data
        if mylens_data:
            prompt_parts.append("PLACES FROM MYLENS (User's interests):")
            for i, place in enumerate(mylens_data, 1):
                prompt_parts.append(f"{i}. {place.get('name', 'Unknown')}")
                if place.get('type'):
                    prompt_parts.append(f"   Type: {place['type']}")
                if place.get('description'):
                    prompt_parts.append(f"   Description: {place['description'][:100]}")
                prompt_parts.append("")
        
        prompt_parts.append("---")
        prompt_parts.append(f"Create the perfect {num_days}-day itinerary using these resources.")
        prompt_parts.append("Prioritize activities from the cart, and supplement with myLens suggestions if needed.")
        prompt_parts.append("Assign hotels strategically based on daily activities.")
        prompt_parts.append("Return ONLY valid JSON matching the schema.")
        
        return "\n".join(prompt_parts)
    
    def _validate_itinerary(self, itinerary: Dict, expected_days: int, chat_id: str) -> bool:
        """Validate the generated itinerary"""
        try:
            # Check required fields
            if not isinstance(itinerary, dict):
                print("[AzureItineraryService] Not a dict")
                return False
            
            if "days" not in itinerary:
                print("[AzureItineraryService] Missing 'days' field")
                return False
            
            days = itinerary["days"]
            if not isinstance(days, list):
                print("[AzureItineraryService] 'days' is not a list")
                return False
            
            # Check day count
            if len(days) != expected_days:
                print(f"[AzureItineraryService] Expected {expected_days} days, got {len(days)}")
                return False
            
            # Validate each day
            for i, day in enumerate(days, 1):
                if not isinstance(day, dict):
                    print(f"[AzureItineraryService] Day {i} is not a dict")
                    return False
                
                if day.get("day") != i:
                    print(f"[AzureItineraryService] Day number mismatch: expected {i}, got {day.get('day')}")
                    return False
                
                if "activities" not in day or not isinstance(day["activities"], list):
                    print(f"[AzureItineraryService] Day {i} missing or invalid activities")
                    return False
            
            print(f"[AzureItineraryService] Validation passed: {len(days)} days generated")
            return True
            
        except Exception as e:
            print(f"[AzureItineraryService] Validation error: {e}")
            return False


# Singleton instance
_azure_itinerary_service = None

def get_azure_itinerary_service() -> AzureItineraryService:
    """Get or create singleton instance"""
    global _azure_itinerary_service
    if _azure_itinerary_service is None:
        _azure_itinerary_service = AzureItineraryService()
    return _azure_itinerary_service
