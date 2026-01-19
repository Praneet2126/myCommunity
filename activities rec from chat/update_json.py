import json

coords = {
    "Deltin Royale Casino": {"lat": 15.5011, "lon": 73.8286, "best_time": "7:00 PM - 1:00 AM"},
    "Casino Pride": {"lat": 15.5015, "lon": 73.8300, "best_time": "8:00 PM - 2:00 AM"},
    "Tito's Lane": {"lat": 15.5553, "lon": 73.7517, "best_time": "9:00 PM - 3:00 AM"},
    "LPK (Love Passion Karma) Waterfront": {"lat": 15.5056, "lon": 73.7853, "best_time": "10:00 PM - 4:00 AM"},
    "Thalassa": {"lat": 15.6111, "lon": 73.7350, "best_time": "5:00 PM - 8:00 PM (Sunset)"},
    "Grande Island Scuba Diving": {"lat": 15.3533, "lon": 73.7667, "best_time": "8:00 AM - 2:00 PM"},
    "Parasailing at Sinquerim Beach": {"lat": 15.4994, "lon": 73.7683, "best_time": "10:00 AM - 5:00 PM"},
    "Sal Backwaters Kayaking": {"lat": 15.1500, "lon": 73.9500, "best_time": "7:00 AM - 10:00 AM"},
    "Jet Skiing at Calangute": {"lat": 15.5442, "lon": 73.7550, "best_time": "10:00 AM - 5:00 PM"},
    "Bungee Jumping (Mayem Lake)": {"lat": 15.5667, "lon": 73.9500, "best_time": "9:00 AM - 4:00 PM"},
    "Dolphin Spotting Trip": {"lat": 15.5000, "lon": 73.7500, "best_time": "8:00 AM - 11:00 AM"},
    "Netravali Wildlife Trek": {"lat": 15.0833, "lon": 74.2167, "best_time": "7:00 AM - 1:00 PM"},
    "Sahakari Spice Farm": {"lat": 15.4000, "lon": 74.0167, "best_time": "10:00 AM - 3:00 PM"},
    "Cumbarjua Canal Crocodile Safari": {"lat": 15.5167, "lon": 73.9333, "best_time": "9:00 AM - 12:00 PM"},
    "Basilica of Bom Jesus": {"lat": 15.5008, "lon": 73.9116, "best_time": "9:00 AM - 6:00 PM"},
    "Aguada Fort": {"lat": 15.4922, "lon": 73.7731, "best_time": "9:30 AM - 6:00 PM"},
    "Anjuna Beach": {"lat": 15.5733, "lon": 73.7411, "best_time": "4:00 PM - 7:00 PM"},
    "Calangute Beach": {"lat": 15.5442, "lon": 73.7550, "best_time": "10:00 AM - 6:00 PM"},
    "Palolem Beach": {"lat": 15.0100, "lon": 74.0233, "best_time": "Early Morning / Sunset"},
    "Dudhsagar Waterfalls": {"lat": 15.3144, "lon": 74.3142, "best_time": "8:00 AM - 4:00 PM"}
}

with open('goa_activities.json', 'r') as f:
    data = json.load(f)

for p in data['places']:
    name = p['name']
    if name in coords:
        p['lat'] = coords[name]['lat']
        p['lon'] = coords[name]['lon']
        p['best_time'] = coords[name]['best_time']
    else:
        # Default or randomize slightly around a central point if unknown, 
        # but let's just stick to "Unknown" for now to let LLM handle it by region
        p['lat'] = None
        p['lon'] = None
        p['best_time'] = "Flexible"

with open('goa_activities.json', 'w') as f:
    json.dump(data, f, indent=2)
