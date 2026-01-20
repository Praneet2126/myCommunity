import json
import numpy as np
import re
import os
import torch
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from transformers import pipeline

app = FastAPI()

# LLM Configuration (Local Open Source)
class LocalLLM:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LocalLLM, cls).__new__(cls)
            # Force CPU for maximum stability on this machine
            device = "cpu"
            try:
                cls._instance.pipeline = pipeline(
                    "text-generation",
                    model="Qwen/Qwen2.5-0.5B-Instruct",
                    device=device,
                    model_kwargs={"torch_dtype": torch.float32}
                )
            except Exception as e:
                print(f"Error loading local LLM: {e}. Falling back to CPU.")
                cls._instance.pipeline = pipeline(
                    "text-generation",
                    model="Qwen/Qwen2.5-0.5B-Instruct",
                    device="cpu"
                )
        return cls._instance

    def generate_itinerary(self, chat_id: str, num_days: int, num_people: int, places: List[Dict]) -> Optional[Dict]:
        places_json = json.dumps(places)
        messages = [
            {"role": "system", "content": """You are an expert travel planner for Goa. Create a realistic, TIME-AWARE, non-overlapping, sequential itinerary.
            CRITICAL TIME-SENSITIVE RULES:
            1. MUST generate EXACTLY the number of days requested by the user. Do not skip days or generate fewer days.
            2. NO OVERLAPPING TIMES. The 'end_time' of one activity must be BEFORE the 'start_time' of the next.
            3. SEQUENTIAL FLOW: Activities must be in chronological order throughout the day.
            4. TIME-SPECIFIC SCHEDULING:
               - Morning Activities (6 AM - 11 AM): Treks, Wildlife tours, Yoga, Morning water sports
               - Afternoon Activities (11 AM - 4 PM): Museums, Forts, Shopping, Water sports
               - Late Afternoon/Sunset (4 PM - 6 PM): Beach visits, Sunset spots (MUST end before 6 PM)
               - Evening (6 PM - 9 PM): Dining, River cruises, Cultural shows
               - Night Activities (9 PM - 3 AM): Casinos, Nightclubs, Late-night parties
            5. STRICT CONSTRAINTS:
               - Beach activities MUST be scheduled before 6:00 PM
               - Nightclubs and parties MUST start after 9:00 PM
               - Casinos MUST be scheduled after 8:00 PM
               - Water sports MUST be between 10:00 AM and 5:00 PM
               - Wildlife/nature activities MUST be in early morning (before 11 AM)
            6. TRAVEL TIME: Include 45-60 mins of travel between activities.
            7. FORMAT: Use 12-hour AM/PM format (e.g., 09:00 AM, 01:00 PM). Max 6 hours of activity per day.
            8. Output ONLY valid JSON matching the schema below.
            
            Schema:
            {
                "chat_id": "...",
                "num_people": 0,
                "days": [
                    {
                        "day": 1,
                        "activities": [
                            {
                                "name": "...", 
                                "start_time": "09:00 AM", 
                                "end_time": "11:00 AM", 
                                "travel_time_from_prev": "45 mins",
                                "region": "...",
                                "category": "...",
                                "duration": "..."
                            }
                        ],
                        "total_duration_mins": 0
                    }
                ]
            }
            """},
            {"role": "user", "content": f"Create a {num_days}-day realistic itinerary for {num_people} people. Activities: {places_json}"}
        ]
        
        prompt = self.pipeline.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        outputs = self.pipeline(prompt, max_new_tokens=1000, do_sample=False)
        text = outputs[0]['generated_text']
        
        # Extract JSON from response
        try:
            json_str = text.split("assistant\n")[-1].strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
            
            # Basic validation/cleanup for the small model
            data = json.loads(json_str)
            if "days" in data:
                return data
        except Exception as e:
            print(f"Local LLM JSON Error: {e}")
        return None

# Initialize local LLM
local_llm = LocalLLM()

class Place(BaseModel):
    name: str
    duration: str
    score: float = 0.0
    category: str = "General"
    region: str = "Unknown"
    lat: Optional[float] = None
    lon: Optional[float] = None
    best_time: str = "Flexible"

class ActivityInItinerary(Place):
    start_time: str
    end_time: str
    travel_time_from_prev: str = "0 mins"

class CartItem(BaseModel):
    place_name: str
    added_by: str
    count: int = 1

class Cart(BaseModel):
    items: List[CartItem] = []
    num_days: int = 3
    num_people: int = 2

class ItineraryDay(BaseModel):
    day: int
    activities: List[ActivityInItinerary]
    total_duration_mins: int

class Itinerary(BaseModel):
    chat_id: str
    days: List[ItineraryDay]
    num_people: int

class SearchEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SearchEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.places_data = []
        self.embeddings = None
        self._load_data()
        self._initialized = True

    def _extract_name(self, full_name: str) -> str:
        words = full_name.split()
        return " ".join(words[:4])

    def _get_region(self, full_text: str) -> str:
        full_text = full_text.lower()
        if "north goa" in full_text:
            return "North"
        if "south goa" in full_text:
            return "South"
        if "central goa" in full_text or "panaji" in full_text:
            return "Central"
        return "Unknown"

    def _load_data(self):
        try:
            with open('goa_activities.json', 'r') as f:
                data = json.load(f)
                raw_places = data.get('places', [])
                
                corpus = []
                for p in raw_places:
                    name = p.get('name', '')
                    description = p.get('description', '')
                    full_text = p.get('full_text', '')
                    suggested_hours = p.get('suggested_hours', '2 hours')
                    category = p.get('category', 'General')
                    
                    combined_text = f"{name} {description} {full_text}"
                    region = self._get_region(combined_text)
                    
                    self.places_data.append({
                        "name": name,
                        "duration": suggested_hours,
                        "category": category,
                        "region": region,
                        "full_text": full_text,
                        "lat": p.get('lat'),
                        "lon": p.get('lon'),
                        "best_time": p.get('best_time', 'Flexible')
                    })
                    corpus.append(combined_text)
                
                if corpus:
                    self.embeddings = self.model.encode(corpus, convert_to_tensor=False)
                    self.embeddings = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        except Exception as e:
            pass

    def search(self, query: str, top_k: int = 3, exclude_names: List[str] = []) -> List[Place]:
        if self.embeddings is None or not self.places_data:
            return []
        
        query_embedding = self.model.encode([query], convert_to_tensor=False)
        query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
        
        similarities = np.dot(self.embeddings, query_embedding.T).flatten()
        
        # Sort indices
        top_indices = np.argsort(similarities)[::-1]
        
        results = []
        for idx in top_indices:
            place_data = self.places_data[idx]
            if place_data['name'] in exclude_names:
                continue
                
            results.append(Place(
                name=place_data['name'],
                duration=place_data['duration'],
                score=float(similarities[idx]),
                category=place_data['category'],
                region=place_data['region'],
                lat=place_data.get('lat'),
                lon=place_data.get('lon'),
                best_time=place_data.get('best_time', 'Flexible')
            ))
            if len(results) >= top_k:
                break
        return results

    def get_place_by_name(self, name: str) -> Optional[Place]:
        for p in self.places_data:
            if p['name'] == name:
                return Place(
                    name=p['name'],
                    duration=p['duration'],
                    category=p['category'],
                    region=p['region'],
                    lat=p.get('lat'),
                    lon=p.get('lon'),
                    best_time=p.get('best_time', 'Flexible')
                )
        return None

class CartManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CartManager, cls).__new__(cls)
            cls._instance.carts = {}
            cls._instance.message_counts = {}
            cls._instance.participants = {}
            cls._instance.message_buffers = {}
        return cls._instance

    def add_to_cart(self, chat_id: str, place_name: str, user_name: str):
        if chat_id not in self.carts:
            self.carts[chat_id] = Cart()
        
        # Check if already exists to increment count
        for item in self.carts[chat_id].items:
            if item.place_name == place_name:
                item.count += 1
                return
                
        self.carts[chat_id].items.append(CartItem(place_name=place_name, added_by=user_name, count=1))

    def get_cart(self, chat_id: str) -> Cart:
        return self.carts.get(chat_id, Cart())

    def update_cart_settings(self, chat_id: str, num_days: int, num_people: int):
        if chat_id not in self.carts:
            self.carts[chat_id] = Cart()
        self.carts[chat_id].num_days = num_days
        self.carts[chat_id].num_people = num_people

    def increment_message(self, chat_id: str, participant: str, message: str) -> int:
        # Detect if this is a block of messages (multiple lines)
        lines = [line.strip() for line in message.split('\n') if line.strip()]
        num_lines = len(lines)
        
        self.message_counts[chat_id] = self.message_counts.get(chat_id, 0) + num_lines
        if chat_id not in self.participants:
            self.participants[chat_id] = set()
        self.participants[chat_id].add(participant)
        
        if chat_id not in self.message_buffers:
            self.message_buffers[chat_id] = []
            
        for line in lines:
            self.message_buffers[chat_id].append(line)
        
        return self.message_counts[chat_id]

    def get_buffer(self, chat_id: str, limit: int = 7) -> str:
        buffer = self.message_buffers.get(chat_id, [])
        combined = " ".join(buffer[-limit:])
        if len(buffer) >= limit:
             self.message_buffers[chat_id] = []
        return combined

    def get_participant_count(self, chat_id: str) -> int:
        return len(self.participants.get(chat_id, set()))

def parse_duration(duration_str: str) -> int:
    duration_str = duration_str.lower()
    if "night activity" in duration_str:
        return 180
    
    nums = re.findall(r'\d+', duration_str)
    if not nums:
        return 120
    
    if "hour" in duration_str:
        avg_hours = sum(int(n) for n in nums) / len(nums)
        return int(avg_hours * 60)
    elif "minute" in duration_str:
        return int(sum(int(n) for n in nums) / len(nums))
    
    return 120


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


def get_time_slot_priority(place) -> tuple:
    """
    Categorize activity by time slot and return (priority, earliest_start_minutes, latest_end_minutes)
    Priority: 0=morning, 1=afternoon, 2=late_afternoon, 3=evening, 4=night
    """
    best_time = place.best_time.lower() if hasattr(place, 'best_time') else place.get("best_time", "").lower()
    category = place.category.lower() if hasattr(place, 'category') else place.get("category", "").lower()
    name = place.name.lower() if hasattr(place, 'name') else place.get("name", "").lower()
    
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
    # For museums, forts, shopping, churches, etc.
    return (1, 11 * 60, 16 * 60)  # 11 AM - 4 PM

@app.on_event("startup")
def startup_event():
    SearchEngine()
    CartManager()

@app.post("/chat/message")
async def process_message(chat_id: str, user: str, message: str):
    # Split message into lines to count accurately
    lines = [l.strip() for l in message.split('\n') if l.strip()]
    num_lines = len(lines)
    
    manager = CartManager()
    count = manager.increment_message(chat_id, user, message)
    
    recommendations = []
    # Trigger if we hit a multiple of 7 OR if a batch just crossed the 7 threshold
    trigger_rec = count > 0 and (count % 7 == 0 or (count // 7 > (count - num_lines) // 7))
    
    if trigger_rec:
        combined_query = manager.get_buffer(chat_id, limit=7)
        engine = SearchEngine()
        
        # Get existing items to exclude
        cart = manager.get_cart(chat_id)
        exclude = [item.place_name for item in cart.items]
        
        recommendations = engine.search(combined_query, top_k=5, exclude_names=exclude)
    
    return {
        "message_count": count,
        "recommendations": recommendations,
        "trigger_rec": trigger_rec
    }

@app.post("/cart/add")
async def add_to_cart(chat_id: str, user: str, place_name: str):
    manager = CartManager()
    engine = SearchEngine()
    
    cart = manager.get_cart(chat_id)
    # Check cap: max 10 items in cart
    if len(cart.items) >= 10:
        raise HTTPException(status_code=400, detail="Cart is full (max 10 items)")

    place = engine.get_place_by_name(place_name)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    
    manager.add_to_cart(chat_id, place_name, user)
    return {"status": "success", "cart": manager.get_cart(chat_id)}

@app.get("/cart/{chat_id}")
async def get_cart(chat_id: str):
    return CartManager().get_cart(chat_id)

@app.post("/cart/update")
async def update_cart(chat_id: str, num_days: int, num_people: int):
    CartManager().update_cart_settings(chat_id, num_days, num_people)
    return {"status": "success"}

@app.post("/itinerary/generate", response_model=Itinerary)
def generate_itinerary(chat_id: str):
    manager = CartManager()
    engine = SearchEngine()
    cart = manager.get_cart(chat_id)
    
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # 1. Expand items by count
    all_places = []
    for item in cart.items:
        place = engine.get_place_by_name(item.place_name)
        if place:
            for _ in range(item.count):
                all_places.append(place)
    
    # 2. Try LLM first
    llm_itinerary = local_llm.generate_itinerary(
        chat_id=chat_id,
        num_days=cart.num_days,
        num_people=cart.num_people,
        places=[p.dict() for p in all_places]
    )
    
    # Validate LLM output - ensure it has the correct number of days
    if llm_itinerary:
        try:
            llm_num_days = len(llm_itinerary.get("days", []))
            requested_days = cart.num_days
            
            if llm_num_days == requested_days:
                print(f"[LLM] Generated {llm_num_days} days as requested")
                return Itinerary(**llm_itinerary)
            else:
                print(f"[LLM] Generated {llm_num_days} days but {requested_days} were requested - falling back to deterministic")
        except:
            print("[LLM] Error parsing LLM output - falling back to deterministic")

    # 3. Time-aware Deterministic Scheduler (Fallback)
    num_days = cart.num_days
    print(f"[Scheduler] Using deterministic scheduler for {num_days} days")
    print(f"[Itinerary Generator] Creating {num_days}-day itinerary for {cart.num_people} people with {len(all_places)} activities")
    
    days = [ItineraryDay(day=i+1, activities=[], total_duration_mins=0) for i in range(num_days)]
    day_clocks = [480 for _ in range(num_days)]  # Start at 8:00 AM
    
    print(f"[Itinerary Generator] Created {len(days)} day slots")
    
    # Collect all places with their time slot priorities
    all_places_with_priority = []
    for place in all_places:
        priority, earliest_start, latest_end = get_time_slot_priority(place)
        all_places_with_priority.append({
            "place": place,
            "priority": priority,
            "earliest_start": earliest_start,
            "latest_end": latest_end
        })
    
    # Sort by priority (morning first, night last), then by region to group similar activities
    all_places_with_priority.sort(key=lambda x: (x["priority"], x["place"].region))
    
    # Schedule activities with round-robin distribution across days
    current_day_index = 0  # Start with day 0 and rotate
    
    for item in all_places_with_priority:
        place = item["place"]
        priority = item["priority"]
        earliest_start = item["earliest_start"]
        latest_end = item["latest_end"]
        duration = parse_duration(place.duration)
        
        # Try to find a suitable day, starting from current_day_index and cycling through
        best_day_idx = None
        best_start_time = None
        
        # Try all days starting from the current day index
        for offset in range(num_days):
            d_idx = (current_day_index + offset) % num_days
            
            # Check if day has room (max 6 hours)
            if days[d_idx].total_duration_mins + duration > 360:
                continue
            
            curr_time = day_clocks[d_idx]
            
            # Adjust current time based on activity time slot
            if priority == 0:  # Morning activities (6 AM - 11 AM)
                if curr_time < earliest_start:
                    curr_time = earliest_start
                if curr_time + duration > latest_end:
                    continue
                    
            elif priority == 1:  # Afternoon activities (11 AM - 4 PM)
                if curr_time < earliest_start:
                    curr_time = earliest_start
                if curr_time + duration > latest_end:
                    continue
                    
            elif priority == 2:  # Beach/Sunset (4 PM - 6 PM) - MUST end before 6 PM
                if curr_time < earliest_start:
                    curr_time = earliest_start
                if curr_time + duration > latest_end:
                    continue
                    
            elif priority == 3:  # Evening (6 PM - 9 PM)
                if curr_time < earliest_start:
                    curr_time = earliest_start
                if curr_time + duration > latest_end:
                    continue
                    
            elif priority == 4:  # Night activities (9 PM - 3 AM)
                if curr_time < earliest_start:
                    curr_time = earliest_start
            
            # Found a suitable slot
            best_day_idx = d_idx
            best_start_time = curr_time
            break
        
        # If no suitable day found, skip this activity
        if best_day_idx is None:
            continue
        
        # Format times
        def fmt(m):
            h = (m // 60) % 24
            mins = m % 60
            ap = "AM" if h < 12 else "PM"
            dh = h if 0 < h <= 12 else (h - 12 if h > 12 else 12)
            return f"{dh:02d}:{mins:02d} {ap}"
        
        # Add travel time if not first activity
        travel_buffer = 45 if days[best_day_idx].activities else 0
        
        act = ActivityInItinerary(
            **place.dict(),
            start_time=fmt(best_start_time),
            end_time=fmt(best_start_time + duration),
            travel_time_from_prev=f"{travel_buffer} mins"
        )
        
        days[best_day_idx].activities.append(act)
        days[best_day_idx].total_duration_mins += duration
        day_clocks[best_day_idx] = best_start_time + duration + travel_buffer
        
        # Move to next day for better distribution (round-robin)
        current_day_index = (best_day_idx + 1) % num_days
    
    # Log the distribution
    for day in days:
        print(f"[Itinerary Generator] Day {day.day} (type: {type(day.day)}): {len(day.activities)} activities, {day.total_duration_mins} mins")
    
    print(f"[Itinerary Generator] Total days created: {len(days)}")
    print(f"[Itinerary Generator] Days with activities: {sum(1 for d in days if d.activities)}")
    
    # Debug: Print actual day numbers
    print(f"[Itinerary Generator] Day numbers: {[d.day for d in days]}")
                
    return Itinerary(chat_id=chat_id, days=days, num_people=cart.num_people)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
