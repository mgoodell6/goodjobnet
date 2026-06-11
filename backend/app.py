from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pygsheets
import datetime
import os
import traceback
import json
import time
import sqlite3
import math
import csv
import io
import urllib.request
from werkzeug.security import generate_password_hash, check_password_hash

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='/static_dist')
CORS(app)

# Configuration
# Assuming credentials.json is in the parent directory (same as JobEntryForm)
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'JobEntryForm', 'credentials.json')

if not os.path.exists(SERVICE_ACCOUNT_FILE):
    # Fallback to current directory if not found
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')

SPREADSHEET_ID_JOBS = '1YIGS6DRmnEH3be9TG59nFVhGee2DVcc4MaaXFhKgSic'
WORKSHEET_NAME_JOBS = 'Sheet1'
SPREADSHEET_NAME_SEEKERS = 'GoodJobNet_JobSeekers' # Name of new sheet to create
WORKSHEET_NAME_SEEKERS = 'Sheet1'

_gsheets_client = None

# Global In-Memory Cache
_cache = {}
CACHE_TTL = 300 # 5 minutes

def get_cached_data(key, fetch_fn, ttl=CACHE_TTL):
    now = time.time()
    if key in _cache and (now - _cache[key]['timestamp']) < ttl:
        return _cache[key]['data']
    try:
        data = fetch_fn()
        _cache[key] = {
            'timestamp': now,
            'data': data
        }
        return data
    except Exception as e:
        print(f"Error fetching data for cache key {key}: {e}")
        if key in _cache:
            print(f"Returning stale cache for key: {key}")
            return _cache[key]['data']
        raise e

def invalidate_cache(key=None):
    global _cache
    if key:
        if key in _cache:
            del _cache[key]
            print(f"Invalidated cache key: {key}")
    else:
        _cache.clear()
        print("Invalidated entire cache")

# ZIP Code Distance Helpers
def get_zip_coordinates(zip_code):
    db_path = os.path.join(os.path.dirname(__file__), "zips.db")
    zip_str = str(zip_code).strip()[:5]
    if not zip_str.isdigit():
        return None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lat, lon FROM zips WHERE zip = ?", (zip_str,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0], row[1]
    except Exception as e:
        print(f"Error querying ZIP {zip_str}: {e}")
    return None

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    try:
        lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c
    except (ValueError, TypeError, ZeroDivisionError):
        return float('inf')

# Cached Sheets Helpers
def get_seekers_records():
    def fetch_seekers():
        records = []
        # 1. Try opening via pygsheets and service account (preferred)
        try:
            gc = get_gsheets_client()
            sh = gc.open_by_key("1Ye9hgTVuqUtV8CQhFwLzZzCBz4E26otvJbjiVYRySJ0")
            wks = sh.sheet1
            raw_records = wks.get_all_records()
            for row in raw_records:
                cleaned_row = {}
                for k, v in row.items():
                    if k is None or k == "":
                        continue
                    val = str(v).strip() if v is not None else ""
                    if val.lower() == 'nan':
                        val = ""
                    cleaned_row[k] = val
                records.append(cleaned_row)
            print(f"Successfully fetched {len(records)} seekers via pygsheets")
            return records
        except Exception as e:
            print(f"Failed to fetch seekers via pygsheets: {e}")
            
        # 2. Try fetching via public CSV export as fallback
        try:
            url = "https://docs.google.com/spreadsheets/d/1Ye9hgTVuqUtV8CQhFwLzZzCBz4E26otvJbjiVYRySJ0/export?format=csv"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                csv_data = response.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_data))
            for row in reader:
                cleaned_row = {}
                for k, v in row.items():
                    if k is None or k == "":
                        continue
                    val = str(v).strip() if v is not None else ""
                    if val.lower() == 'nan':
                        val = ""
                    cleaned_row[k] = val
                records.append(cleaned_row)
            print(f"Successfully fetched {len(records)} seekers via fallback CSV URL")
            return records
        except Exception as e2:
            print(f"Failed to fetch seekers via fallback CSV URL: {e2}")
            raise e2
            
    return get_cached_data('seekers_records', fetch_seekers)

def get_master_jobs_records():
    def fetch_master_jobs():
        gc = get_gsheets_client()
        try:
            sh = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
        return sh.sheet1.get_all_records()
    return get_cached_data('master_jobs_records', fetch_master_jobs)

def get_new_jobs_records():
    def fetch_new_jobs():
        gc = get_gsheets_client()
        sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
        return {
            'records': sh.sheet1.get_all_records(),
            'url': sh.url
        }
    return get_cached_data('new_jobs_records', fetch_new_jobs)

def get_new_seekers_records():
    def fetch_new_seekers():
        gc = get_gsheets_client()
        sh = gc.open_by_key("1dY7BsSBTt1lyfGYWvCQKdCicpm4Rgcd4fMyEcNlaSr4")
        return {
            'count': len(sh.sheet1.get_all_records()),
            'url': sh.url
        }
    return get_cached_data('new_seekers_records', fetch_new_seekers)

# Authentication helper
def get_gsheets_client():
    global _gsheets_client
    if _gsheets_client is None:
        if "GOOGLE_CREDENTIALS" in os.environ:
            try:
                _gsheets_client = pygsheets.authorize(service_account_env_var='GOOGLE_CREDENTIALS')
            except Exception as e:
                # Print to server logs for debugging
                print("Failed to authorize using GOOGLE_CREDENTIALS env var:", str(e))
                # Fallback to local file if needed (mostly for local development with both set)
                _gsheets_client = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)
        else:
            _gsheets_client = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)
    return _gsheets_client

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith("api/"):
        return jsonify({"success": False, "error": "API route not found"}), 404
        
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/submit-job', methods=['POST'])
def submit_job():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    jobs_raw = data.get("available_jobs", "")
    if jobs_raw:
        jobs_list = [j.strip() for j in jobs_raw.split('\n') if j.strip()]
        available_jobs_str = ", ".join(jobs_list)
    else:
        available_jobs_str = ""

    current_date = datetime.datetime.now().strftime("%Y-%m-%d")

    row_data = [
        data.get("company_name", ""),
        data.get("company_street", ""),
        data.get("company_city", ""),
        data.get("company_state", ""),
        data.get("company_zip", ""),
        data.get("contact_name", ""),
        data.get("contact_phone", ""),
        data.get("contact_email", ""),
        "TRUE" if data.get("currently_hiring", "Yes") == "Yes" else "FALSE",
        available_jobs_str,
        data.get("company_type", ""),
        data.get("career_website", ""),
        data.get("notes", ""),
        current_date,
        data.get("submitter_name", ""),
        data.get("submitter_ward", ""),
        data.get("submitter_stake", ""),
        data.get("submitter_phone", ""),
        data.get("submitter_email", "")
    ]

    try:
        gc = get_gsheets_client()
        sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
        wks = sh.worksheet_by_title(WORKSHEET_NAME_JOBS)
        wks.append_table(values=[row_data])
        invalidate_cache('new_jobs_records')
        invalidate_cache('master_jobs_records')
        return jsonify({"success": True, "message": "Job successfully added to Google Sheets!"})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


@app.route('/api/submit-seeker', methods=['POST'])
def submit_seeker():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    current_date = datetime.datetime.now().strftime("%Y-%m-%d")

    # Assuming these fields from frontend
    row_data = [
        data.get("name", ""),
        data.get("street", ""),
        data.get("city", ""),
        data.get("zipcode", ""),
        data.get("ward", ""),
        data.get("stake", ""),
        data.get("phone", ""),
        data.get("email", ""),
        data.get("skills_education", ""),
        data.get("job_needed", ""),
        ", ".join(data.get("desired_job_types", [])),
        data.get("general_notes", ""),
        "Yes" if data.get("resume_assistance") else "No",
        "Yes" if data.get("interview_coaching") else "No",
        "Yes" if data.get("job_search_assistance") else "No",
        current_date,
        data.get("submitter_name", ""),
        data.get("submitter_ward", ""),
        data.get("submitter_stake", ""),
        data.get("submitter_phone", ""),
        data.get("submitter_email", "")
    ]

    try:
        gc = get_gsheets_client()
        try:
            sh = gc.open(SPREADSHEET_NAME_SEEKERS)
        except pygsheets.SpreadsheetNotFound:
            sh = gc.create(SPREADSHEET_NAME_SEEKERS)
        
        try:
            wks = sh.worksheet_by_title(WORKSHEET_NAME_SEEKERS)
        except pygsheets.WorksheetNotFound:
            wks = sh.sheet1
            wks.title = WORKSHEET_NAME_SEEKERS
            # Set headers if new
            wks.update_row(1, ["Name", "Street", "City", "Zipcode", "Ward", "Stake", "Phone", "Email", "Skills/Education", "Job Needed", "Desired Types", "General Notes", "Resume Asst", "Interview Coach", "Job Search Asst", "Date Entered", "Entered by - Name", "Ward", "Stake", "Phone", "email"])
            
        wks.append_table(values=[row_data])
        invalidate_cache('new_seekers_records')
        return jsonify({"success": True, "message": "Job Seeker successfully added to Google Sheets!"})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/search-jobs', methods=['POST'])
def search_jobs():
    data = request.json
    search_type = data.get("search_type", "type-location")
    company_name = data.get("company_name", "").strip()
    
    if search_type == "company":
        try:
            all_records = get_master_jobs_records()
            results = []
            for row in all_records:
                row_company = str(row.get("Name") or row.get("Company Name") or "").strip().lower()
                if company_name.lower() in row_company:
                    address_val = row.get('Address', row.get('company_street', ''))
                    city_val = row.get('City', '')
                    state_val = row.get('State', 'FL')
                    location = f"{address_val}, {city_val}, {state_val}".strip(", ")
                    
                    is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
                    currently_hiring = "Yes" if is_hiring_val in ["TRUE", "YES", "1", "Y"] else "No"
                    
                    date_verified_str = row.get("Date last verified", row.get("Date Entered", ""))
                    
                    job_entry = {
                        "company": row.get("Name") or row.get("Company Name") or "Unknown",
                        "role": row.get("Available Jobs") or row.get("Job Title") or "Various",
                        "location": location,
                        "distance": "",
                        "career_website": row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or "",
                        "notes": row.get("General Notes") or row.get("Any additional Notes") or row.get("Notes") or row.get("notes", ""),
                        "currently_hiring": currently_hiring,
                        "date_verified": date_verified_str
                    }
                    results.append(job_entry)
            return jsonify({
                "success": True,
                "search_type": "company",
                "results": results
            })
        except Exception as e:
            print(traceback.format_exc())
            return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

    job_types = data.get("job_types", [])
    address = data.get("address", "")
    radius = data.get("radius", 20)
    
    try:
        radius = float(radius)
    except (ValueError, TypeError):
        radius = 20.0
        
    origin_zip = None
    if address and address.strip():
        import re
        zip_match = re.search(r'\b\d{5}\b', address)
        if zip_match:
            origin_zip = zip_match.group(0)
            
    try:
        all_records = get_master_jobs_records()
        
        recent = []
        older = []
        
        three_weeks_ago = datetime.datetime.now() - datetime.timedelta(days=21)
        
        for row in all_records:
            # Check if Currently Hiring is true (defaults to True if column doesn't exist)
            is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
            if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                continue
                
            # Filter by company name if provided
            if company_name:
                row_company = str(row.get("Name") or row.get("Company Name") or "").strip().lower()
                if company_name.lower() not in row_company:
                    continue
                
            # Filter by job type
            row_job_type = str(row.get("Available Jobs", row.get("Job Title", "")))
            if job_types and row_job_type not in job_types and "Other" not in job_types:
                match = False
                for jt in job_types:
                    if jt.lower() in row_job_type.lower():
                        match = True
                        break
                if not match:
                    continue
            
            # Check distance if address and zip code are provided
            dist_miles = float('inf')
            if origin_zip:
                import re
                job_zip_val = str(row.get("Zipcode") or row.get("Zip Code") or row.get("Zip") or row.get("company_zip") or row.get("Zip code") or "").strip()
                # strip .0 if float conversion happened in spreadsheet
                if job_zip_val.endswith('.0'):
                    job_zip_val = job_zip_val[:-2]
                job_zip_match = re.search(r'\b\d{5}\b', job_zip_val)
                if not job_zip_match:
                    continue  # Skip jobs without a valid ZIP if location search is requested
                job_zip_5 = job_zip_match.group(0)
                
                if job_zip_5 == origin_zip:
                    dist_miles = 0.0
                else:
                    try:
                        coords1 = get_zip_coordinates(origin_zip)
                        coords2 = get_zip_coordinates(job_zip_5)
                        if coords1 and coords2:
                            dist_miles = calculate_distance(coords1[0], coords1[1], coords2[0], coords2[1])
                    except Exception:
                        pass
                
                if dist_miles > radius:
                    continue
            
            # Use appropriate column names, falling back to what exists in the fallback sheet
            address_val = row.get('Address', row.get('company_street', ''))
            city_val = row.get('City', '')
            state_val = row.get('State', 'FL')
            location = f"{address_val}, {city_val}, {state_val}".strip(", ")
            
            job_entry = {
                "company": row.get("Name") or row.get("Company Name") or "Unknown",
                "role": row.get("Available Jobs") or row.get("Job Title") or "Various",
                "location": location,
                "distance": f"{round(dist_miles, 1)} miles" if dist_miles != float('inf') else ("" if not origin_zip else "N/A"),
                "career_website": row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or "",
                "notes": row.get("General Notes") or row.get("Any additional Notes") or row.get("Notes") or row.get("notes", "")
            }
            
            date_verified_str = row.get("Date last verified", row.get("Date Entered", ""))
                
            is_recent = False
            if date_verified_str:
                try:
                    # Try parsing M/D/YYYY or YYYY-MM-DD
                    if "-" in date_verified_str:
                        date_obj = datetime.datetime.strptime(date_verified_str.split(" ")[0], "%Y-%m-%d")
                    else:
                        date_obj = datetime.datetime.strptime(date_verified_str.split(" ")[0], "%m/%d/%Y")
                    
                    if date_obj >= three_weeks_ago:
                        is_recent = True
                except:
                    pass # If date parsing fails, it goes to older
            
            if is_recent:
                recent.append(job_entry)
            else:
                older.append(job_entry)
                
        # Sort results by distance if distance filter is active
        if origin_zip:
            def sort_key(x):
                try:
                    return float(x["distance"].split(" ")[0])
                except:
                    return float('inf')
            recent.sort(key=sort_key)
            older.sort(key=sort_key)
                
        return jsonify({
            "success": True, 
            "results": {
                "recent": recent,
                "older": older
            }
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    try:
        # 1. Get stats from Master JobBank
        all_records = get_master_jobs_records()
        
        now = datetime.datetime.now()
        expiring_in_5_days_count = 0
        reaching_2_years_count = 0
        expired_recently_count = 0
        unverified_no_career_count = 0
        
        STANDARD_TYPES = [
            "HVAC Repair", "Accountant", "Airport", "Auto Parts", "Car Wash", 
            "Cashier", "Catering", "CDL Driver", "Cement Mason", "Computer / IT", 
            "Programmer", "Construction", "Corrections", "Custodian", "Customer service", 
            "Data Entry", "Day Care", "Delivery Driver", "Drywaller", "Educator", 
            "Electrician", "Engineering", "Event Staff", "Fast food", "Gas Station", 
            "Grocery Store", "Healthcare", "Hospitality", "Housekeeper", 
            "Information Technology", "Landscaping", "Manager", "Mechanic", 
            "Manufacturing", "Nursing", "Painter", "Pest Control", "Plumbing", 
            "Restaurant", "Retail", "Sales", "Security", "Stocking", 
            "Telephone", "Theme Park", "Transportation", "Warehousing", "Logistics"
        ]
        
        job_type_counts = {}
        total_hot_jobs_matched = 0
        
        for row in all_records:
            is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
            if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                continue

            date_str = str(row.get("Date last verified", row.get("Date Entered", ""))).strip()
            age_days = 9999
            has_date = False
            if date_str:
                try:
                    if "-" in date_str:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                    else:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
                    age_days = (now - date_obj).days
                    has_date = True
                except:
                    pass

            if has_date:
                career_page = row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or ""
                has_career_page = bool(str(career_page).strip())
                if 16 <= age_days <= 21 and has_career_page:
                    expiring_in_5_days_count += 1
                if 22 <= age_days <= 36 and has_career_page:
                    expired_recently_count += 1
                    
            if 640 <= age_days < 730:
                reaching_2_years_count += 1
                
            is_hot = (0 <= age_days <= 21)
            if is_hot:
                total_hot_jobs_matched += 1
                job_title = str(row.get("Available Jobs", row.get("Job Title", ""))).lower()
                matched_type = "Other"
                for st in STANDARD_TYPES:
                    if st.lower() in job_title:
                        matched_type = st
                        break
                job_type_counts[matched_type] = job_type_counts.get(matched_type, 0) + 1
                
            if age_days > 21:
                career_page = row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or ""
                if not str(career_page).strip():
                    unverified_no_career_count += 1
                
        # 2. Get stats from New Job Opportunities sheet
        new_jobs_info = get_new_jobs_records()
        new_jobs_count = len(new_jobs_info['records'])
        new_jobs_url = new_jobs_info['url']
        
        # 3. Get stats from New Job Seekers queue
        seeker_type_counts = {}
        total_seekers_matched = 0
        
        try:
            seekers_records = get_seekers_records()
            total_seekers_matched = len(seekers_records)
            
            for row in seekers_records:
                seeker_types = str(row.get("Type of Job Needed", "")).lower()
                matched_type = "Other"
                for st in STANDARD_TYPES:
                    if st.lower() in seeker_types:
                        matched_type = st
                        break
                seeker_type_counts[matched_type] = seeker_type_counts.get(matched_type, 0) + 1
        except Exception as e:
            print(f"Error fetching seeker types: {e}")
            
        try:
            new_seekers_info = get_new_seekers_records()
            new_seekers_count = new_seekers_info['count']
            new_seekers_url = new_seekers_info['url']
        except Exception as e:
            print(f"Error fetching new seekers: {e}")
            new_seekers_count = 0
            new_seekers_url = ""
            
        total_hot_jobs = total_hot_jobs_matched
            
        return jsonify({
            "success": True, 
            "expiring_soon": expiring_in_5_days_count,
            "expired_recently": expired_recently_count,
            "two_years_soon": reaching_2_years_count,
            "new_jobs_count": new_jobs_count,
            "new_jobs_url": new_jobs_url,
            "new_seekers_count": new_seekers_count,
            "new_seekers_url": new_seekers_url,
            "total_hot_jobs": total_hot_jobs,
            "total_job_seekers": total_seekers_matched,
            "job_types": job_type_counts,
            "seeker_types": seeker_type_counts,
            "unverified_no_career_count": unverified_no_career_count
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/hot-jobs-review', methods=['GET'])
def hot_jobs_review():
    category = request.args.get("category")
    job_type = request.args.get("type", "").lower()

    try:
        all_records = get_master_jobs_records()
        
        now = datetime.datetime.now()
        jobs_to_review = []
        
        for idx, row in enumerate(all_records):
            date_str = str(row.get("Date last verified", row.get("Date Entered", ""))).strip()
            age_days = 0
            has_valid_date = False
            
            if date_str:
                try:
                    if "-" in date_str:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                    else:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
                    age_days = (now - date_obj).days
                    has_valid_date = True
                except:
                    pass
            
            if category == "type":
                row_type = str(row.get("Available Jobs", row.get("Job Title", ""))).lower()
                job_types_list = [t.strip().lower() for t in job_type.split(",") if t.strip()]
                if not job_types_list or not any(t in row_type for t in job_types_list):
                    continue
            elif category == "company":
                import difflib
                company_query = request.args.get("company", "").strip().lower()
                if not company_query:
                    continue
                row_company = str(row.get("Name") or row.get("Company Name") or "").strip().lower()
                
                match = False
                if company_query in row_company:
                    match = True
                else:
                    q_clean = "".join(c for c in company_query if c.isalnum())
                    t_clean = "".join(c for c in row_company if c.isalnum())
                    if q_clean and q_clean in t_clean:
                        match = True
                    else:
                        if q_clean and len(q_clean) >= 3 and difflib.SequenceMatcher(None, q_clean, t_clean).ratio() > 0.8:
                            match = True
                        else:
                            q_words_raw = [w for w in company_query.split() if w]
                            q_words_clean = ["".join(c for c in w if c.isalnum()) for w in q_words_raw]
                            q_words_clean = [w for w in q_words_clean if w]
                            
                            t_words_raw = [w for w in row_company.split() if w]
                            t_words_clean = ["".join(c for c in w if c.isalnum()) for w in t_words_raw]
                            t_words_clean = [w for w in t_words_clean if w]
                            
                            if q_words_clean:
                                all_query_words_matched = True
                                for qw in q_words_clean:
                                    word_matched = False
                                    for tw in t_words_clean:
                                        if len(qw) <= 2:
                                            if qw == tw:
                                                word_matched = True
                                                break
                                        else:
                                            if qw in tw:
                                                word_matched = True
                                                break
                                            if len(tw) >= 3:
                                                if difflib.SequenceMatcher(None, qw, tw).ratio() > 0.8:
                                                    word_matched = True
                                                    break
                                    if not word_matched:
                                        all_query_words_matched = False
                                        break
                                if all_query_words_matched:
                                    match = True
                if not match:
                    continue
            else:
                if not has_valid_date:
                    if category == "unverified_no_career":
                        age_days = 9999
                    else:
                        continue
                
                is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
                if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                    continue
                    
                career_page = row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or ""
                has_career_page = bool(str(career_page).strip())
                
                if category == "5days":
                    if not (16 <= age_days <= 21) or not has_career_page:
                        continue
                elif category == "46weeks":
                    if not (22 <= age_days <= 36) or not has_career_page:
                        continue
                elif category == "unverified_no_career":
                    if age_days <= 21 or has_career_page:
                        continue

            job = {
                "row_index": idx + 2,
                "company_name": row.get("Name") or row.get("Company Name", ""),
                "company_type": row.get("Company Type / Industry") or row.get("Company Type", ""),
                "company_street": row.get("Address") or row.get("company_street", ""),
                "company_city": row.get("City") or row.get("company_city", ""),
                "company_state": row.get("State") or row.get("company_state", ""),
                "company_zip": row.get("Zipcode") or row.get("Zip Code") or row.get("Zip") or row.get("company_zip") or str(row.get("Zip code", "")),
                "career_website": row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website", ""),
                "contact_name": row.get("Hiring Contact") or row.get("Hiring Contact Name") or row.get("Contact Name") or row.get("Hiring Contract Name") or row.get("contact_name", ""),
                "contact_phone": str(row.get("Hiring Contact Phone") or row.get("Contact Phone") or row.get("contact_phone", "")),
                "contact_email": row.get("Hiring Contact Email") or row.get("Contact Email") or row.get("contact_email", ""),
                "currently_hiring": str(row.get("Currently Hiring", "Yes")),
                "available_jobs": row.get("Available Jobs") or row.get("Job Title", ""),
                "notes": row.get("General Notes") or row.get("Any additional Notes") or row.get("Notes") or row.get("notes", ""),
                "date_last_verified": date_str,
                "age_days": age_days
            }
            jobs_to_review.append(job)
                    
        return jsonify({"success": True, "jobs": jobs_to_review})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/update-hot-job', methods=['POST'])
def update_hot_job():
    data = request.json
    if not data or not data.get("row_index"):
        return jsonify({"success": False, "error": "No data or row_index provided"}), 400
        
    try:
        gc = get_gsheets_client()
        try:
            sh = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
            
        wks = sh.sheet1
        headers = wks.get_row(1)
        row_index = data.get("row_index")
        
        # Mapping frontend fields to spreadsheet headers
        field_mapping = {
            "company_name": ["Name", "Company Name"],
            "company_type": ["Company Type / Industry", "Company Type"],
            "company_street": ["Address", "company_street"],
            "company_city": ["City", "company_city"],
            "company_state": ["State", "company_state"],
            "company_zip": ["Zipcode", "Zip Code", "Zip", "company_zip", "Zip code"],
            "career_website": ["Career Page", "Company Career Website", "Career Website"],
            "contact_name": ["Hiring Contact", "Hiring Contact Name", "Contact Name", "Hiring Contract Name", "contact_name"],
            "contact_phone": ["Hiring Contact Phone", "Contact Phone", "contact_phone"],
            "contact_email": ["Hiring Contact Email", "Contact Email", "contact_email"],
            "available_jobs": ["Available Jobs", "Job Title"],
            "notes": ["General Notes", "Any additional Notes", "Notes", "notes"],
            "currently_hiring": ["Currently Hiring"]
        }
        
        # Build update list
        for key, possible_headers in field_mapping.items():
            if key in data:
                val = data[key]
                if key == "currently_hiring":
                    val = "TRUE" if val == "Yes" else "FALSE"
                
                # Find matching header
                col_idx = -1
                for h in possible_headers:
                    if h in headers:
                        col_idx = headers.index(h) + 1
                        break
                
                if col_idx != -1:
                    wks.update_value((row_index, col_idx), str(val))
        
        # Update "Date last verified" or "Date Entered"
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        date_col = -1
        for h in ["Date last verified", "Date Last Verified", "Date Entered", "date_last_verified"]:
            if h in headers:
                date_col = headers.index(h) + 1
                break
                
        if date_col != -1:
            wks.update_value((row_index, date_col), current_date)
            
        # Update "Validated/Entered By (Name)"
        submitter_col = -1
        for h in ["Validated/Entered By (Name)", "Validated By", "Entered By", "Validated/Entered By"]:
            if h in headers:
                submitter_col = headers.index(h) + 1
                break
                
        submitter_name = data.get("submitter_name", "")
        if submitter_col != -1 and submitter_name:
            wks.update_value((row_index, submitter_col), submitter_name)
            
            invalidate_cache('master_jobs_records')
        return jsonify({"success": True, "message": "Job successfully updated!"})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

# Win32 Global Keyboard Hook & Window Closure for Accessibility
import ctypes
import threading
import sys

is_windows = sys.platform.startswith("win")

call_active = False
_hook_id = None
_hook_thread = None
_hook_thread_id = None
_hook_lock = threading.Lock()

if is_windows:
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    # Setup ctypes signatures to prevent 64-bit handle truncation
    user32.IsWindowVisible.argtypes = [wintypes.HWND]
    user32.IsWindowVisible.restype = wintypes.BOOL

    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int

    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows.argtypes = [WNDENUMPROC, wintypes.LPARAM]
    user32.EnumWindows.restype = wintypes.BOOL

    user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.PostMessageW.restype = wintypes.BOOL

    user32.IsWindow.argtypes = [wintypes.HWND]
    user32.IsWindow.restype = wintypes.BOOL

    user32.SetForegroundWindow.argtypes = [wintypes.HWND]
    user32.SetForegroundWindow.restype = wintypes.BOOL

    HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

    user32.CallNextHookEx.argtypes = [wintypes.HHOOK, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM]
    user32.CallNextHookEx.restype = ctypes.c_longlong

    user32.SetWindowsHookExW.argtypes = [ctypes.c_int, HOOKPROC, wintypes.HMODULE, wintypes.DWORD]
    user32.SetWindowsHookExW.restype = wintypes.HHOOK

    user32.UnhookWindowsHookEx.argtypes = [wintypes.HHOOK]
    user32.UnhookWindowsHookEx.restype = wintypes.BOOL

    user32.PostThreadMessageW.argtypes = [wintypes.DWORD, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.PostThreadMessageW.restype = wintypes.BOOL

    user32.GetMessageW.argtypes = [ctypes.POINTER(wintypes.MSG), wintypes.HWND, wintypes.UINT, wintypes.UINT]
    user32.GetMessageW.restype = wintypes.BOOL

    user32.TranslateMessage.argtypes = [ctypes.POINTER(wintypes.MSG)]
    user32.TranslateMessage.restype = wintypes.BOOL

    user32.DispatchMessageW.argtypes = [ctypes.POINTER(wintypes.MSG)]
    user32.DispatchMessageW.restype = wintypes.LPARAM

    kernel32.GetCurrentThreadId.argtypes = []
    kernel32.GetCurrentThreadId.restype = wintypes.DWORD

    kernel32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
    kernel32.GetModuleHandleW.restype = wintypes.HMODULE

    WH_KEYBOARD_LL = 13
    WM_KEYDOWN = 0x0100
    WM_SYSKEYDOWN = 0x0104

    class KBDLLHOOKSTRUCT(ctypes.Structure):
        _fields_ = [
            ("vkCode", wintypes.DWORD),
            ("scanCode", wintypes.DWORD),
            ("flags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", ctypes.POINTER(wintypes.ULONG))
        ]

    def close_google_voice_window():
        try:
            found_hwnd = []
            
            def enum_windows_callback(hwnd, lParam):
                if user32.IsWindowVisible(hwnd):
                    length = user32.GetWindowTextLengthW(hwnd)
                    if length > 0:
                        buf = ctypes.create_unicode_buffer(length + 1)
                        user32.GetWindowTextW(hwnd, buf, length + 1)
                        title = buf.value
                        if "Google Voice" in title or title.startswith("Voice - "):
                            found_hwnd.append(hwnd)
                return True
                
            user32.EnumWindows(WNDENUMPROC(enum_windows_callback), 0)
            
            for hwnd in found_hwnd:
                print(f"[Backend Hangup] Setting foreground window and sending WM_CLOSE to handle {hwnd}")
                user32.SetForegroundWindow(hwnd)
                import time
                time.sleep(0.2)
                user32.PostMessageW(hwnd, 0x0010, 0, 0) # WM_CLOSE = 0x0010
                
                # Wait for 0.4 seconds to see if window is closed or blocked by "Leave site?" prompt
                time.sleep(0.4)
                if user32.IsWindow(hwnd):
                    print(f"[Backend Hangup] Window {hwnd} is still open (likely blocked by prompt). Sending ENTER key...")
                    # VK_RETURN = 0x0D
                    user32.keybd_event(0x0D, 0, 0, 0) # Key press
                    time.sleep(0.05)
                    user32.keybd_event(0x0D, 0, 2, 0) # Key release (KEYEVENTF_KEYUP = 2)
                else:
                    print(f"[Backend Hangup] Window {hwnd} closed successfully without prompt.")
                
            return len(found_hwnd) > 0
        except Exception as ex:
            print("[Backend Hangup] Error closing Google Voice window:", str(ex))
            return False

    def do_global_hangup():
        global call_active
        print("[Global Hook] Hanging up call via global hook...")
        call_active = False
        stop_global_key_listener()
        
        # Close Google Voice window
        close_google_voice_window()
        
        # Fallback: Find Phone Link window and close it
        try:
            import subprocess
            ps_script = """
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*Phone Link*" } | Select-Object -First 1
            if ($proc) {
                $proc.CloseMainWindow()
            }
            """
            subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
        except Exception as ex:
            print("[Global Hook] Error executing Phone Link close fallback:", str(ex))

    def _keyboard_hook_proc(nCode, wParam, lParam):
        global _hook_id
        if nCode >= 0 and (wParam == WM_KEYDOWN or wParam == WM_SYSKEYDOWN):
            kbd = KBDLLHOOKSTRUCT.from_address(lParam)
            # Ignore simulated keypresses (flags bit 4 / 0x10 is LLKHF_INJECTED)
            is_injected = bool(kbd.flags & 0x10)
            if not is_injected:
                vk = kbd.vkCode
                # VK_ESCAPE = 0x1B, VK_RETURN = 0x0D, H/h = 0x48
                if vk in (0x1B, 0x0D, 0x48):
                    print(f"[Global Hook] Intercepted user hangup key: {hex(vk)}")
                    threading.Thread(target=do_global_hangup, daemon=True).start()
                
        return user32.CallNextHookEx(_hook_id, nCode, wParam, lParam)

    _hook_callback_ptr = HOOKPROC(_keyboard_hook_proc)

    def hook_message_loop():
        global _hook_id, _hook_thread_id
        _hook_thread_id = kernel32.GetCurrentThreadId()
        hmod = kernel32.GetModuleHandleW(None)
        _hook_id = user32.SetWindowsHookExW(
            WH_KEYBOARD_LL,
            _hook_callback_ptr,
            hmod,
            0
        )
        if not _hook_id:
            print(f"[Global Hook] Failed to set hook! Error code: {ctypes.GetLastError()}")
            return
            
        print("[Global Hook] Keyboard hook set successfully. Message loop starting...")
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
            
        print("[Global Hook] Message loop exited.")

    def start_global_key_listener():
        global _hook_thread, _hook_id
        with _hook_lock:
            if _hook_thread is not None:
                return
                
            _hook_thread = threading.Thread(target=hook_message_loop, daemon=True)
            _hook_thread.start()

    def stop_global_key_listener():
        global _hook_thread, _hook_id, _hook_thread_id
        with _hook_lock:
            if _hook_id:
                user32.UnhookWindowsHookEx(_hook_id)
                _hook_id = None
                if _hook_thread_id:
                    user32.PostThreadMessageW(_hook_thread_id, 0x0012, 0, 0) # WM_QUIT = 0x0012
            _hook_thread = None
            _hook_thread_id = None
            print("[Global Hook] Keyboard hook stopped.")
else:
    # Safe fallback placeholders for non-Windows platforms
    def close_google_voice_window():
        return False

    def do_global_hangup():
        pass

    def start_global_key_listener():
        pass

    def stop_global_key_listener():
        pass

@app.route('/api/dial', methods=['POST'])
def dial_number():
    data = request.json
    if not data or not data.get("phone"):
        return jsonify({"success": False, "error": "No phone number provided"}), 400
        
    phone = data.get("phone")
    method = data.get("method", "google-voice")
    
    # Clean phone number (digits only)
    clean_phone = "".join(c for c in phone if c.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "1" + clean_phone
        
    if not clean_phone:
        return jsonify({"success": False, "error": "Invalid phone number"}), 400
        
    try:
        global call_active
        call_active = True
        
        is_local_client = request.remote_addr in ('127.0.0.1', 'localhost', '::1')
        
        if not is_windows:
            return jsonify({"success": True, "hook_active": False, "message": "Dial simulated on non-Windows platform (no actions taken)"})
            
        if not is_local_client:
            return jsonify({"success": True, "hook_active": False, "message": "Dial simulated for remote client (no keyboard/window actions taken)"})
            
        import subprocess
        import time
        
        if method == "google-voice" or method == "google-voice-keypress-only":
            if method == "google-voice":
                # Form Google Voice URL with nc (new call) parameter and the phone number (with country code)
                # We omit the '/u/0/' account index to automatically use the default logged-in account
                url = f"https://voice.google.com/calls?a=nc,%2B{clean_phone}"
                import webbrowser
                webbrowser.open(url)
            
            # Wait for browser to open and load the tab
            time.sleep(2.5)
            
            # Send Enter key using PowerShell (with System.Windows.Forms.SendKeys)
            # Since Chrome/Edge is now in focus and the input field contains the number,
            # pressing Enter starts the call automatically.
            ps_cmd = '[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")'
            subprocess.run(["powershell", "-Command", f"Add-Type -AssemblyName System.Windows.Forms; {ps_cmd}"], capture_output=True)
            
        elif method == "phone-link":
            # Launch Phone Link using tel protocol
            subprocess.run(["cmd.exe", "/c", f"start tel:{clean_phone}"], shell=True)
            
            # Wait for Phone Link to launch and focus
            time.sleep(2.0)
            
            # PowerShell script using UI Automation to find the 'Call' or 'Dial' button
            # in Phone Link and invoke it to start the call programmatically.
            ps_script = """
            Add-Type -AssemblyName UIAutomationClient
            Add-Type -AssemblyName UIAutomationTypes
            
            $root = [Windows.Automation.AutomationElement]::RootElement
            
            # Search for Phone Link window
            $condition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, "Phone Link")
            $window = $root.FindFirst([Windows.Automation.TreeScope]::Children, $condition)
            
            if (-not $window) {
                # Fallback to process name PhoneExperienceHost
                $procs = Get-Process -Name "PhoneExperienceHost" -ErrorAction SilentlyContinue
                if ($procs) {
                    $condition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, $procs[0].Id)
                    $window = $root.FindFirst([Windows.Automation.TreeScope]::Children, $condition)
                }
            }
            
            if ($window) {
                # Find Call button dynamically with retry loop (waiting for UI render)
                $button = $null
                for ($retry = 0; $retry -lt 8; $retry++) {
                    $elements = $window.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
                    foreach ($el in $elements) {
                        if ($el.Current.ClassName -eq "Button") {
                            $name = $el.Current.Name
                            $autoId = $el.Current.AutomationId
                            if (($name -like "*Call*") -or ($name -like "*Dial*") -or ($autoId -like "*Call*") -or ($autoId -like "*Dial*")) {
                                $button = $el
                                break
                            }
                        }
                    }
                    if ($button) { break }
                    Start-Sleep -Milliseconds 500
                }
                
                if ($button) {
                    # Click call button
                    $button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
                    Write-Host "Success clicking button: $($button.Current.Name)"
                } else {
                    # Fallback to sending Enter key
                    Add-Type -AssemblyName System.Windows.Forms
                    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                    Write-Host "Fallback Enter sent"
                }
            } else {
                # General fallback: send Enter key to active window
                Add-Type -AssemblyName System.Windows.Forms
                [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                Write-Host "Window not found, fallback Enter sent"
            }
            """
            subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
            
        # Start global key listener with a 0.5s delay to ensure the simulated dial Enter key clears from system
        threading.Timer(0.5, start_global_key_listener).start()
        
        return jsonify({"success": True, "hook_active": True, "message": f"Dialed {clean_phone} using {method}"})
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Failed to dial", "details": str(e)}), 500

@app.route('/api/hangup', methods=['POST'])
def hangup_call():
    try:
        global call_active
        call_active = False
        
        is_local_client = request.remote_addr in ('127.0.0.1', 'localhost', '::1')
        
        if not is_windows:
            return jsonify({"success": True, "message": "Hangup command executed (non-Windows platform, no actions taken)", "closed_gv": False})
            
        if not is_local_client:
            return jsonify({"success": True, "message": "Hangup command executed for remote client (no windows closed on server)", "closed_gv": False})
            
        stop_global_key_listener()
        
        # Close Google Voice window directly
        closed_gv = close_google_voice_window()
        
        # Fallback: Find Phone Link window and close it
        import subprocess
        ps_script = """
        $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*Phone Link*" } | Select-Object -First 1
        if ($proc) {
            $proc.CloseMainWindow()
        }
        """
        subprocess.run(["powershell", "-Command", ps_script], capture_output=True)
        
        return jsonify({"success": True, "message": "Hangup command executed", "closed_gv": closed_gv})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Failed to hang up", "details": str(e)}), 500

@app.route('/api/call-status', methods=['GET'])
def call_status():
    global call_active
    return jsonify({"active": call_active})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    username = data.get("username", "")
    password = data.get("password", "")
    
    try:
        gc = get_gsheets_client()
        try:
            sh = gc.open("GoodJobNet_Users")
            wks = sh.worksheet_by_title("Users")
        except (pygsheets.SpreadsheetNotFound, pygsheets.WorksheetNotFound):
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
            
        # Get all records
        records = wks.get_all_records()
        for idx, row in enumerate(records):
            if row.get("Username") == username:
                if check_password_hash(row.get("PasswordHash", ""), password):
                    # Check if account is approved
                    approved_val = str(row.get("Approved", "TRUE")).strip().upper()
                    if approved_val not in ["TRUE", "YES", "1", "Y"]:
                        return jsonify({"success": False, "error": "Your account is pending approval. Please check back later or contact an administrator."}), 401

                    # Update Date Last Logged In
                    try:
                        headers = wks.get_row(1)
                        if "Date Last Logged In" in headers:
                            col_idx = headers.index("Date Last Logged In") + 1
                            wks.update_value((idx + 2, col_idx), datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                    except Exception as ex:
                        print("Failed to update last login date:", str(ex))
                        
                    return jsonify({
                        "success": True, 
                        "token": "dummy_token", 
                        "role": row.get("Role", "user"),
                        "name": row.get("Name", ""),
                        "ward": row.get("Ward", ""),
                        "stake": row.get("Stake", ""),
                        "email": row.get("Email", ""),
                        "phone": row.get("Phone", "")
                    })
                else:
                    return jsonify({"success": False, "error": "Invalid credentials"}), 401
                    
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    try:
        gc = get_gsheets_client()
        try:
            sh = gc.open("GoodJobNet_Users")
        except pygsheets.SpreadsheetNotFound:
            sh = gc.create("GoodJobNet_Users")
            wks = sh.sheet1
            wks.title = "Users"
            wks.update_row(1, ["Name", "Ward", "Stake", "Calling", "Email", "Phone", "Username", "Role", "Date Registered", "Date Last Logged In", "Approved", "PasswordHash"])
            
        wks = sh.worksheet_by_title("Users")
        
        # Check if username already exists
        try:
            records = wks.get_all_records()
            for r in records:
                if str(r.get("Username", "")).strip().lower() == str(data.get("username", "")).strip().lower():
                    return jsonify({"success": False, "error": "Username already exists. Please choose a unique username."}), 400
        except Exception as ex:
            print("Failed to check duplicate username:", str(ex))
            
        calling = data.get("calling", "")
        role = "admin" if calling == "Employment Center missionary/volunteer" else "user"
        
        # Get headers and add "Approved" column if not present
        headers = wks.get_row(1)
        if "Approved" not in headers:
            if "PasswordHash" in headers:
                pwd_idx = headers.index("PasswordHash")
                headers.insert(pwd_idx, "Approved")
            else:
                headers.append("Approved")
            wks.update_row(1, headers)
            
        # Dynamically build row_data based on headers to ensure robustness
        row_dict = {
            "Name": data.get("name", ""),
            "Ward": data.get("ward", ""),
            "Stake": data.get("stake", ""),
            "Calling": calling,
            "Email": data.get("email", ""),
            "Phone": data.get("phone", ""),
            "Username": data.get("username", ""),
            "Role": role,
            "Date Registered": datetime.datetime.now().strftime("%Y-%m-%d"),
            "Date Last Logged In": "",
            "Approved": "FALSE",
            "PasswordHash": generate_password_hash(data.get("password", ""))
        }
        row_data = [row_dict.get(h, "") for h in headers]
        wks.append_table(values=[row_data])
        return jsonify({"success": True, "role": role})
    except Exception as e:
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/update-snapshot', methods=['POST'])
def update_snapshot():
    try:
        gc = get_gsheets_client()
        
        try:
            sh_master = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh_master = gc.open_by_key("1YIGS6DRmnEH3be9TG59nFVhGee2DVcc4MaaXFhKgSic")
            
        wks_master = sh_master.sheet1
        all_values = wks_master.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
        
        if not all_values or len(all_values) < 1:
            return jsonify({"success": False, "error": "Master spreadsheet is empty."}), 400
            
        headers = all_values[0]
        
        date_col_idx = -1
        hiring_col_idx = -1
        for i, h in enumerate(headers):
            h_str = str(h).lower()
            if h_str in ['date last verified', 'date entered', 'date']:
                if date_col_idx == -1:
                    date_col_idx = i
            if h_str in ['currently hiring', 'hiring']:
                hiring_col_idx = i
                
        if date_col_idx == -1:
            return jsonify({"success": False, "error": "Could not find 'Date last verified' column."}), 400
            
        three_weeks_ago = datetime.datetime.now() - datetime.timedelta(days=21)
        
        target_columns = [
            "Name", "Address", "City", "Zip", "Contact", "Hiring Contact phone", 
            "Available Jobs", "Company Type", "Career Page", "General Notes", "Full Address"
        ]
        
        idx_map = {}
        for i, h in enumerate(headers):
            h_str = str(h).lower()
            if 'Name' not in idx_map and h_str in ['name', 'company name']: idx_map['Name'] = i
            elif 'Address' not in idx_map and h_str in ['street', 'address', 'company street']: idx_map['Address'] = i
            elif 'City' not in idx_map and h_str in ['city', 'company city']: idx_map['City'] = i
            elif 'State' not in idx_map and h_str in ['state', 'company state']: idx_map['State'] = i
            elif 'Zip' not in idx_map and h_str in ['zip', 'zipcode', 'company zip']: idx_map['Zip'] = i
            elif 'Contact' not in idx_map and h_str in ['hiring contact', 'hiring contact name', 'contact', 'contact name']: idx_map['Contact'] = i
            elif 'Hiring Contact phone' not in idx_map and h_str in ['hiring contact phone', 'contact phone', 'phone']: idx_map['Hiring Contact phone'] = i
            elif 'Available Jobs' not in idx_map and h_str in ['available jobs', 'job title']: idx_map['Available Jobs'] = i
            elif 'Company Type' not in idx_map and h_str in ['company type / industry', 'company type', 'industry']: idx_map['Company Type'] = i
            elif 'Career Page' not in idx_map and h_str in ['career page', 'career website', 'company career website']: idx_map['Career Page'] = i
            elif 'General Notes' not in idx_map and h_str in ['notes', 'general notes', 'additional notes']: idx_map['General Notes'] = i
            
        snapshot_data = [target_columns]
        
        for row in all_values[1:]:
            if hiring_col_idx != -1 and len(row) > hiring_col_idx:
                is_hiring_val = str(row[hiring_col_idx]).strip().upper()
                if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                    continue
            
            is_recent = False
            if len(row) > date_col_idx:
                date_str = str(row[date_col_idx]).strip()
                if date_str:
                    try:
                        if "-" in date_str:
                            date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                        else:
                            date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
                            
                        if date_obj >= three_weeks_ago:
                            is_recent = True
                    except:
                        pass
            
            if is_recent:
                def get_val(key):
                    if key in idx_map and idx_map[key] < len(row):
                        return str(row[idx_map[key]]).strip()
                    return ""
                
                new_row = []
                for col in target_columns:
                    if col == "Full Address":
                        addr = get_val("Address")
                        city = get_val("City")
                        state = get_val("State")
                        zip_val = get_val("Zip")
                        parts = [p for p in [addr, city, state, zip_val] if p]
                        new_row.append(", ".join(parts))
                    else:
                        new_row.append(get_val(col))
                        
                snapshot_data.append(new_row)
                
        sh_snapshot = gc.open_by_key("1T42pCZhRcZcAtlTSSOac5GzR4eI0OcBS47IAbA8h3Hg")
        wks_snapshot = sh_snapshot.sheet1
        wks_snapshot.clear()
        wks_snapshot.update_values('A1', snapshot_data)
        
        invalidate_cache('master_jobs_records')
        return jsonify({"success": True, "message": f"Snapshot updated successfully with {len(snapshot_data)-1} jobs!"})
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


@app.route('/api/job-seeker-matches-report', methods=['GET'])
def job_seeker_matches_report():
    try:
        gc = get_gsheets_client()
        # 1. Get all seekers from the Unemployed List spreadsheet
        try:
            seekers_records = get_seekers_records()
        except Exception as e:
            print(f"Error fetching seekers: {e}")
            seekers_records = []
            
        # 2. Get all jobs
        jobs_records = get_master_jobs_records()
        
        # 3. Filter Hot Jobs (Verified in last 3 weeks and Currently Hiring = TRUE)
        now = datetime.datetime.now()
        three_weeks_ago = now - datetime.timedelta(days=21)
        hot_jobs = []
        
        for row in jobs_records:
            is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
            if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                continue
                
            date_str = str(row.get("Date last verified", row.get("Date Entered", ""))).strip()
            if not date_str:
                continue
                
            try:
                if "-" in date_str:
                    date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                else:
                    date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
                    
                if date_obj >= three_weeks_ago:
                    hot_jobs.append(row)
            except:
                continue
                
        # 4. Generate report
        report = []
        for seeker in seekers_records:
            name = seeker.get(" Name", seeker.get("Name", "Unknown"))
            street = seeker.get("Street", "")
            city = seeker.get("City", "")
            zip_val = seeker.get("Zip", seeker.get("Zipcode", ""))
            
            if str(zip_val).endswith('.0'):
                zip_val = str(zip_val)[:-2]
            zipcode = str(zip_val).strip()
                
            address = f"{street} {city} {zipcode}".strip()
            skills = str(seeker.get("Skills/Education", ""))
            desired_types_raw = str(seeker.get("Type of Job Needed", seeker.get("Desired Types", "")))
            
            if not desired_types_raw or desired_types_raw == "nan":
                report.append({
                    "name": name,
                    "address": address,
                    "skills": skills,
                    "desired_types": "",
                    "hot_jobs_count": "More information needed (Missing Job Types)"
                })
                continue
                
            if not address or not zipcode or zipcode == "nan":
                report.append({
                    "name": name,
                    "address": address,
                    "skills": skills,
                    "desired_types": desired_types_raw,
                    "hot_jobs_count": "More information needed (Missing Address/Zipcode)"
                })
                continue
                
            # Split by comma, filter empty, and normalize common typos and spacing variations
            desired_types_list = []
            for t in desired_types_raw.split(","):
                t = t.strip().lower()
                if not t:
                    continue
                t = t.replace("warehouseing", "warehousing").replace(" / ", "/")
                desired_types_list.append(t)
            
            # Find matching hot jobs within 20 miles
            matched_jobs_count = 0
            for job in hot_jobs:
                job_type = str(job.get("Available Jobs", job.get("Job Title", ""))).lower()
                job_type = job_type.replace(" / ", "/")
                
                # Check type match
                match = False
                for dt in desired_types_list:
                    if dt in job_type:
                        match = True
                        break
                
                if not match:
                    continue
                    
                # Check distance
                job_zip = str(job.get("Zipcode") or job.get("Zip Code") or job.get("Zip") or job.get("company_zip") or job.get("Zip code", "")).strip()
                if job_zip:
                    try:
                        # Extract 5 digit zip just in case
                        job_zip_5 = job_zip[:5]
                        seeker_zip_5 = zipcode[:5]
                        
                        if job_zip_5 == seeker_zip_5:
                            dist_miles = 0.0
                        else:
                            coords1 = get_zip_coordinates(seeker_zip_5)
                            coords2 = get_zip_coordinates(job_zip_5)
                            if coords1 and coords2:
                                dist_miles = calculate_distance(coords1[0], coords1[1], coords2[0], coords2[1])
                            else:
                                dist_miles = float('inf')
                                
                        if dist_miles <= 20:
                            matched_jobs_count += 1
                    except Exception:
                        pass
                        
            report.append({
                "name": name,
                "address": address,
                "skills": skills,
                "desired_types": desired_types_raw,
                "hot_jobs_count": matched_jobs_count
            })
            
        # 5. Export to Google Sheets
        try:
            sh_report = gc.open_by_key("1nI1GA-ajJmZncYzYPSsTY10LXKgyd43dBIYLFsUec2w")
            wks_report = sh_report.sheet1
            
            sheet_data = [["Name", "Address", "Skills / Education", "Desired Job Types", "Hot Jobs within 20 miles"]]
            for r in report:
                sheet_data.append([
                    r["name"], 
                    r["address"], 
                    r["skills"], 
                    r["desired_types"], 
                    str(r["hot_jobs_count"])
                ])
                
            wks_report.clear()
            wks_report.update_values('A1', sheet_data)
        except Exception as e:
            print(f"Error exporting report to Google Sheets: {e}")
            
        return jsonify({"success": True, "report": report})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


@app.route('/api/search-seekers', methods=['POST'])
def search_seekers():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    job_types = data.get("job_types", [])
    address = data.get("address", "")
    radius = data.get("radius", 20)
    
    try:
        radius = float(radius)
    except (ValueError, TypeError):
        radius = 20.0
        
    if not address or not address.strip():
        return jsonify({"success": False, "error": "Address is required"}), 400
        
    # Extract 5-digit zip code from address
    import re
    zip_match = re.search(r'\b\d{5}\b', address)
    if not zip_match:
        return jsonify({"success": False, "error": "No valid 5-digit US zip code found in the address. Please include a zip code (e.g. 32801)."}), 400
    origin_zip = zip_match.group(0)
    
    try:
        # Load seekers from Unemployed List spreadsheet
        seekers_records = get_seekers_records()
        
        results = []
        has_other = any(jt.lower() == "other" for jt in job_types)
        
        # Normalize helper
        def normalize(t):
            return t.strip().lower().replace(" / ", "/").replace("warehouseing", "warehousing")
            
        normalized_req_types = [normalize(jt) for jt in job_types if jt.strip()]
        
        for seeker in seekers_records:
            name = seeker.get(" Name", seeker.get("Name", "Unknown")).strip()
            street = str(seeker.get("Street", "")).strip()
            city = str(seeker.get("City", "")).strip()
            zip_val = str(seeker.get("Zip", seeker.get("Zipcode", ""))).strip()
            
            if zip_val.endswith('.0'):
                zip_val = zip_val[:-2]
            seeker_zip = zip_val.strip()
            
            # Format seeker address
            addr_parts = [p for p in [street, city, seeker_zip] if p]
            seeker_address = ", ".join(addr_parts)
            
            # Get phone and email
            phone = str(seeker.get("Phone ") or seeker.get("Phone") or seeker.get("phone", "")).strip()
            email = str(seeker.get("email") or seeker.get("Email") or seeker.get("Email Address", "")).strip()
            
            # Get and parse desired job types
            seeker_job_types = str(seeker.get("Type of Job Needed", seeker.get("Desired Types", ""))).strip()
            
            # Filter by job type (if job_types provided and doesn't contain "Other")
            if normalized_req_types and not has_other:
                seeker_types_list = [normalize(t) for t in seeker_job_types.split(",") if t.strip()]
                match = False
                for req_type in normalized_req_types:
                    for st in seeker_types_list:
                        if req_type in st or st in req_type:
                            match = True
                            break
                    if match:
                        break
                if not match:
                    continue
                    
            # Calculate distance
            seeker_zip_5 = seeker_zip[:5]
            origin_zip_5 = origin_zip[:5]
            
            if not seeker_zip_5:
                continue
                
            dist_miles = float('inf')
            if seeker_zip_5 == origin_zip_5:
                dist_miles = 0.0
            else:
                try:
                    coords1 = get_zip_coordinates(origin_zip_5)
                    coords2 = get_zip_coordinates(seeker_zip_5)
                    if coords1 and coords2:
                        dist_miles = calculate_distance(coords1[0], coords1[1], coords2[0], coords2[1])
                except Exception:
                    pass
                    
            if dist_miles <= radius:
                results.append({
                    "name": name,
                    "address": seeker_address,
                    "phone": phone,
                    "email": email,
                    "job_types": seeker_job_types,
                    "distance": round(dist_miles, 1) if dist_miles != float('inf') else "N/A"
                })
                
        # Sort results by distance
        results.sort(key=lambda x: x["distance"] if isinstance(x["distance"], (int, float)) else float('inf'))
        
        return jsonify({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
