import os
import json
import sqlite3
import re
import random
from pathlib import Path

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9 ]', '', text)
    text = text.replace('  ', ' ').strip()
    return text.replace(' ', '-')

def generate_metadata():
    # Path to hotels folder
    # Root is GenAI, hotels is ../hotels
    hotels_dir = Path("../hotels")
    if not hotels_dir.exists():
        print(f"Error: Hotels directory not found at {hotels_dir}")
        return

    print(f"Updating hotel metadata in: {hotels_dir}")
    
    # 1. Update info.json files
    updated_count = 0
    for info_path in hotels_dir.glob("**/info.json"):
        try:
            with open(info_path, 'r') as f:
                data = json.load(f)
            
            name = data.get('name', '')
            code = data.get('hotel_code', '')
            
            if not name or not code:
                continue
                
            # Generate External Link
            name_slug = slugify(name)
            # Most of these hotels seem to be in Goa based on the previous context
            external_link = f"https://www.goibibo.com/hotels/{name_slug}-hotel-in-goa-{code}/"
            
            # Update data
            data['external_link'] = external_link
            
            # Heuristic for Stars if missing or 0
            if data.get('stars', 0) == 0:
                name_l = name.lower()
                if any(x in name_l for x in ['resort', 'spa', 'alila', 'grand']):
                    data['stars'] = 5
                elif any(x in name_l for x in ['hotel', 'inn', 'suites']):
                    data['stars'] = 4
                else:
                    data['stars'] = 3
            
            # Heuristic for Price if missing or 0
            if data.get('price', 0) == 0:
                data['price'] = random.randint(4500, 18000)

            with open(info_path, 'w') as f:
                json.dump(data, f, indent=4)
            
            updated_count += 1
            print(f"✅ Updated info.json: {name}")
        except Exception as e:
            print(f"❌ Error updating {info_path}: {e}")

    # 2. Update Database
    db_path = Path("image_search/hotels.db")
    if db_path.exists():
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if external_link column exists
            cursor.execute("PRAGMA table_info(hotels)")
            columns = [col[1] for col in cursor.fetchall()]
            if 'external_link' not in columns:
                cursor.execute("ALTER TABLE hotels ADD COLUMN external_link TEXT")
            
            # Sync data from info.json files to DB
            for info_path in hotels_dir.glob("**/info.json"):
                with open(info_path, 'r') as f:
                    data = json.load(f)
                    cursor.execute("""
                        UPDATE hotels 
                        SET stars = ?, price = ?, external_link = ? 
                        WHERE name = ?
                    """, (data['stars'], data['price'], data['external_link'], data['name']))
            
            conn.commit()
            conn.close()
            print("\n🚀 Database synced with new metadata.")
        except Exception as e:
            print(f"❌ Error updating database: {e}")

    print(f"\nDone! Successfully processed {updated_count} hotels.")

if __name__ == "__main__":
    generate_metadata()
