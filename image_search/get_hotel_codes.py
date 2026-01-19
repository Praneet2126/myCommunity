import os
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(base_dir)
parent_dir = os.path.dirname(project_root)

hotels_dir = os.path.join(parent_dir, 'hotels')
if not os.path.exists(hotels_dir):
    hotels_dir = os.path.join(project_root, 'hotels')

hotel_data = []
if os.path.exists(hotels_dir):
    for folder in os.listdir(hotels_dir):
        info_path = os.path.join(hotels_dir, folder, 'info.json')
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                try:
                    data = json.load(f)
                    hotel_data.append({
                        "name": data.get("name"),
                        "hotel_code": data.get("hotel_code")
                    })
                except:
                    pass

print(json.dumps(hotel_data, indent=2))
