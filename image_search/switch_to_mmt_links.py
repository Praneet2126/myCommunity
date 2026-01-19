import os
import json
import sqlite3
import urllib.parse
from pathlib import Path

def update_to_mmt_links():
    # 1. Resolve paths
    base_dir = Path("hotels")
    if not base_dir.exists():
        base_dir = Path("../hotels")
    
    if not base_dir.exists():
        print("Error: 'hotels' directory not found.")
        return
        
    db_path = Path("image_search/hotels.db")
    if not db_path.exists():
        db_path = Path("hotels.db")
        
    if not db_path.exists():
        print("Error: 'hotels.db' not found.")
        return

    # 2. Update info.json files with MMT Search Links
    print("Updating info.json files with MakeMyTrip links...")
    updated_info = 0
    for info_file in base_dir.glob("**/info.json"):
        try:
            with open(info_file, 'r') as f:
                data = json.load(f)
            
            name = data.get('name', '')
            if name:
                # Add 'Goa' to search if not present, as most are in Goa
                search_query = name if "goa" in name.lower() else f"{name} Goa"
                encoded_name = urllib.parse.quote(search_query)
                mmt_link = f"https://www.makemytrip.com/hotels/hotel-listing/?searchText={encoded_name}"
                data['external_link'] = mmt_link
                
                with open(info_file, 'w') as f:
                    json.dump(data, f, indent=4)
                updated_info += 1
        except Exception as e:
            print(f"Error updating {info_file}: {e}")

    # 3. Update SQLite database
    print("Updating hotels.db...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name FROM hotels")
    rows = cursor.fetchall()
    
    updated_db = 0
    for h_id, name in rows:
        search_query = name if "goa" in name.lower() else f"{name} Goa"
        encoded_name = urllib.parse.quote(search_query)
        mmt_link = f"https://www.makemytrip.com/hotels/hotel-listing/?searchText={encoded_name}"
        
        cursor.execute("UPDATE hotels SET external_link = ? WHERE id = ?", (mmt_link, h_id))
        updated_db += 1

    conn.commit()
    conn.close()
    
    print(f"✅ Updated {updated_info} info.json files.")
    print(f"✅ Updated {updated_db} database records.")
    print("🚀 All hotels now use MakeMyTrip search links.")

if __name__ == "__main__":
    update_to_mmt_links()
