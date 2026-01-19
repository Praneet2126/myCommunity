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
            {"role": "system", "content": """You are an expert travel planner for Goa. Create a realistic, non-overlapping, sequential itinerary.
            CRITICAL RULES:
            1. NO OVERLAPPING TIMES. The 'end_time' of one activity must be BEFORE the 'start_time' of the next.
            2. SEQUENTIAL FLOW: Activities must be in order (e.g., 9am, then 1pm, then 6pm).
            3. RESPECT BEST TIME: Only schedule Casinos/Clubs at night (after 7pm). Schedule Treks/Wildlife in the morning.
            4. TRAVEL TIME: Include 45-60 mins of travel between activities.
            5. FORMAT: Use 12-hour AM/PM format (e.g., 09:00 AM, 01:00 PM). Max 6 hours of activity per day.
            6. Output ONLY valid JSON matching the schema below.
            
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
    if llm_itinerary:
        try: return Itinerary(**llm_itinerary)
        except: pass

    # 3. Determinstic Robust Scheduler (Fallback)
    # Group by region to minimize travel
    by_region = {"North": [], "South": [], "Central": [], "Unknown": []}
    for p in all_places:
        by_region[p.region].append(p)
    
    num_days = cart.num_days
    days = [ItineraryDay(day=i+1, activities=[], total_duration_mins=0) for i in range(num_days)]
    day_clocks = [480 for _ in range(num_days)] # Start at 8:00 AM
    
    # Simple assignment: Assign regions to days
    regions = ["North", "South", "Central", "Unknown"]
    
    for r_idx, region_name in enumerate(regions):
        queue = by_region[region_name]
        # Sort queue: Morning -> Night
        def t_score(p):
            bt = p.best_time.lower()
            if "morning" in bt or "07:" in bt or "08:" in bt: return 0
            if "night" in bt or "pm" in bt: return 2
            return 1
        queue.sort(key=t_score)
        
        for place in queue:
            duration = parse_duration(place.duration)
            bt = place.best_time.lower()
            
            # Find a day. Preference: Day matching the region index, or next available.
            start_day = r_idx % num_days
            for offset in range(num_days):
                d_idx = (start_day + offset) % num_days
                
                # Check constraints: 
                # a) Max 6 hours (360 mins) per day
                # b) Sequential timing
                if days[d_idx].total_duration_mins + duration > 360:
                    continue
                
                curr_time = day_clocks[d_idx]
                
                # If night activity, jump to evening
                if ("night" in bt or "pm" in bt) and curr_time < 1140:
                    curr_time = 1140 # 7:00 PM
                
                # Format times
                def fmt(m):
                    h = (m // 60) % 24
                    mins = m % 60
                    ap = "AM" if h < 12 else "PM"
                    dh = h if 0 < h <= 12 else (h-12 if h > 12 else 12)
                    return f"{dh:02d}:{mins:02d} {ap}"
                
                act = ActivityInItinerary(
                    **place.dict(),
                    start_time=fmt(curr_time),
                    end_time=fmt(curr_time + duration),
                    travel_time_from_prev="45 mins" if days[d_idx].activities else "0 mins"
                )
                
                days[d_idx].activities.append(act)
                days[d_idx].total_duration_mins += duration
                day_clocks[d_idx] = curr_time + duration + 45 # Travel buffer
                break
                
    return Itinerary(chat_id=chat_id, days=days, num_people=cart.num_people)

    return Itinerary(
        chat_id=chat_id,
        days=days,
        num_people=cart.num_people
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
