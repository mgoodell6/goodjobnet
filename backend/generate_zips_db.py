import os
import urllib.request
import zipfile
import io
import sqlite3

def main():
    db_path = os.path.join(os.path.dirname(__file__), "zips.db")
    print(f"Generating ZIP code database at: {db_path}")
    
    url = "http://download.geonames.org/export/zip/US.zip"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("Downloading US zip codes from GeoNames...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            zip_data = response.read()
            
        print("Extracting US.txt...")
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            us_txt = zf.read("US.txt").decode('utf-8')
            
        print("Writing to SQLite database...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS zips (zip TEXT PRIMARY KEY, lat REAL, lon REAL)")
        
        rows = []
        for line in us_txt.splitlines():
            parts = line.split("\t")
            if len(parts) >= 11:
                zip_code = parts[1].strip()
                try:
                    lat = float(parts[9])
                    lon = float(parts[10])
                    rows.append((zip_code, lat, lon))
                except ValueError:
                    pass
                    
        cursor.executemany("INSERT OR REPLACE INTO zips (zip, lat, lon) VALUES (?, ?, ?)", rows)
        conn.commit()
        
        # Create an index on the zip code for super-fast lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_zips_zip ON zips(zip)")
        conn.commit()
        
        conn.close()
        print(f"Finished building zip code database successfully. Added {len(rows)} records.")
        print(f"Database size: {os.path.getsize(db_path) / 1024 / 1024:.2f} MB")
        
    except Exception as e:
        print(f"Error generating zip database: {e}")
        raise e

if __name__ == "__main__":
    main()
