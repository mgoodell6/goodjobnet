from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pygsheets
import datetime
import os
import traceback
import json
from werkzeug.security import generate_password_hash, check_password_hash

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='/')
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
        return jsonify({"success": True, "message": "Job Seeker successfully added to Google Sheets!"})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/search-jobs', methods=['POST'])
def search_jobs():
    data = request.json
    job_types = data.get("job_types", [])
    
    try:
        gc = get_gsheets_client()
        try:
            # Try to open the Master JobBank file
            sh = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            # Fallback to the job entry sheet if the master is not shared or accessible
            sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
            
        wks = sh.sheet1
        all_records = wks.get_all_records()
        
        recent = []
        older = []
        
        three_weeks_ago = datetime.datetime.now() - datetime.timedelta(days=21)
        
        for row in all_records:
            # Check if Currently Hiring is true (defaults to True if column doesn't exist)
            is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
            if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
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
            
            # Use appropriate column names, falling back to what exists in the fallback sheet
            address_val = row.get('Address', row.get('company_street', ''))
            city_val = row.get('City', '')
            state_val = row.get('State', 'FL')
            location = f"{address_val}, {city_val}, {state_val}".strip(", ")
            
            job_entry = {
                "company": row.get("Name") or row.get("Company Name") or "Unknown",
                "role": row.get("Available Jobs") or row.get("Job Title") or "Various",
                "location": location,
                "career_website": row.get("Career Page") or row.get("Company Career Website") or row.get("Career Website") or ""
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
        gc = get_gsheets_client()
        
        # 1. Get stats from Master JobBank
        try:
            sh_master = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh_master = gc.open_by_key("1YIGS6DRmnEH3be9TG59nFVhGee2DVcc4MaaXFhKgSic")
            
        wks_master = sh_master.sheet1
        all_records = wks_master.get_all_records()
        
        now = datetime.datetime.now()
        expiring_in_5_days_count = 0
        reaching_2_years_count = 0
        expired_recently_count = 0
        
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
            date_str = str(row.get("Date last verified", row.get("Date Entered", ""))).strip()
            if not date_str:
                continue
                
            try:
                if "-" in date_str:
                    date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                else:
                    date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
            except:
                continue
                
            age_days = (now - date_obj).days
            
            is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
            is_hot = False
            if is_hiring_val in ["TRUE", "YES", "1", "Y"]:
                if 0 <= age_days <= 21:
                    is_hot = True
                if 16 <= age_days < 21:
                    expiring_in_5_days_count += 1
                if 22 <= age_days <= 36:
                    expired_recently_count += 1
                    
            if 640 <= age_days < 730:
                reaching_2_years_count += 1
                
            if is_hot:
                total_hot_jobs_matched += 1
                job_title = str(row.get("Available Jobs", row.get("Job Title", ""))).lower()
                matched_type = "Other"
                for st in STANDARD_TYPES:
                    if st.lower() in job_title:
                        matched_type = st
                        break
                job_type_counts[matched_type] = job_type_counts.get(matched_type, 0) + 1
                
        # 2. Get stats from New Job Opportunities sheet
        sh_jobs = gc.open_by_key(SPREADSHEET_ID_JOBS)
        new_jobs_count = len(sh_jobs.sheet1.get_all_records())
        new_jobs_url = sh_jobs.url
        
        # 3. Get stats from New Job Seekers queue
        seeker_type_counts = {}
        total_seekers_matched = 0
        
        try:
            import pandas as pd
            import warnings
            warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
            url = "https://docs.google.com/spreadsheets/d/1BCkpZ2S_Covnh-cc5mg8auKWeKOfqubT/export?format=xlsx"
            df_seekers = pd.read_excel(url)
            df_seekers = df_seekers.fillna("")
            seekers_records = df_seekers.to_dict('records')
            
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
            sh_new_seekers = gc.open_by_key("1dY7BsSBTt1lyfGYWvCQKdCicpm4Rgcd4fMyEcNlaSr4")
            new_seekers_count = len(sh_new_seekers.sheet1.get_all_records())
            new_seekers_url = sh_new_seekers.url
        except Exception as e:
            print(f"Error fetching new seekers: {e}")
            new_seekers_count = 0
            new_seekers_url = ""
        # 4. Get stats from Hot Job Snapshot
        try:
            sh_hot_jobs = gc.open_by_key("1T42pCZhRcZcAtlTSSOac5GzR4eI0OcBS47IAbA8h3Hg")
            wks_hot_jobs = sh_hot_jobs.sheet1
            total_hot_jobs = len(wks_hot_jobs.get_all_records())
        except Exception:
            total_hot_jobs = 0
            
        return jsonify({
            "success": True, 
            "expiring_soon": expiring_in_5_days_count,
            "expired_recently": expired_recently_count,
            "two_years_soon": reaching_2_years_count,
            "new_jobs_count": new_jobs_count,
            "new_jobs_url": new_jobs_url,
            "new_seekers_count": new_seekers_count,
            "new_seekers_url": new_seekers_url,
            "total_hot_jobs": total_hot_jobs_matched,
            "total_job_seekers": total_seekers_matched,
            "job_types": job_type_counts,
            "seeker_types": seeker_type_counts
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

@app.route('/api/hot-jobs-review', methods=['GET'])
def hot_jobs_review():
    category = request.args.get("category")
    job_type = request.args.get("type", "").lower()

    try:
        gc = get_gsheets_client()
        try:
            sh = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh = gc.open_by_key(SPREADSHEET_ID_JOBS)
            
        wks = sh.sheet1
        all_records = wks.get_all_records()
        
        now = datetime.datetime.now()
        jobs_to_review = []
        
        for idx, row in enumerate(all_records):
            age_days = 0
            date_str = str(row.get("Date last verified", row.get("Date Entered", ""))).strip()
            
            if category == "type":
                row_type = str(row.get("Available Jobs", row.get("Job Title", ""))).lower()
                if not job_type or job_type not in row_type:
                    continue
            else:
                if not date_str:
                    continue
                    
                try:
                    if "-" in date_str:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d")
                    else:
                        date_obj = datetime.datetime.strptime(date_str.split(" ")[0], "%m/%d/%Y")
                except:
                    continue
                    
                age_days = (now - date_obj).days
                is_hiring_val = str(row.get("Currently Hiring", "TRUE")).strip().upper()
                
                if is_hiring_val not in ["TRUE", "YES", "1", "Y"]:
                    continue
                    
                if category == "5days" and not (16 <= age_days <= 21):
                    continue
                elif category == "46weeks" and not (22 <= age_days <= 36):
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
                "notes": row.get("Notes") or row.get("notes", ""),
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
            "notes": ["Notes", "notes"],
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
            
        return jsonify({"success": True, "message": "Job successfully updated!"})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500

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
            wks.update_row(1, ["Name", "Ward", "Stake", "Calling", "Email", "Phone", "Username", "Role", "Date Registered", "Date Last Logged In", "PasswordHash"])
            
        wks = sh.worksheet_by_title("Users")
        calling = data.get("calling", "")
        role = "admin" if calling == "Employment Center missionary/volunteer" else "user"
        
        row_data = [
            data.get("name", ""), data.get("ward", ""), data.get("stake", ""), 
            calling, data.get("email", ""), data.get("phone", ""), 
            data.get("username", ""), role, datetime.datetime.now().strftime("%Y-%m-%d"),
            datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), # Date Last Logged In
            generate_password_hash(data.get("password", ""))
        ]
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
        
        return jsonify({"success": True, "message": f"Snapshot updated successfully with {len(snapshot_data)-1} jobs!"})
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


@app.route('/api/job-seeker-matches-report', methods=['GET'])
def job_seeker_matches_report():
    try:
        import pgeocode
        import math
        dist_calc = pgeocode.GeoDistance('US')
        
        gc = get_gsheets_client()
        # 1. Get all seekers from the Unemployed List spreadsheet
        try:
            import pandas as pd
            import warnings
            warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
            url = "https://docs.google.com/spreadsheets/d/1BCkpZ2S_Covnh-cc5mg8auKWeKOfqubT/export?format=xlsx"
            df_seekers = pd.read_excel(url)
            df_seekers = df_seekers.fillna("")
            seekers_records = df_seekers.to_dict('records')
        except Exception as e:
            print(f"Error fetching seekers: {e}")
            seekers_records = []
            
        # 2. Get all jobs
        try:
            sh_master = gc.open_by_key("1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I")
        except Exception:
            sh_master = gc.open_by_key(SPREADSHEET_ID_JOBS)
        wks_jobs = sh_master.sheet1
        jobs_records = wks_jobs.get_all_records()
        
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
                        dist_km = dist_calc.query_postal_code(seeker_zip_5, job_zip_5)
                        if not math.isnan(dist_km):
                            dist_miles = dist_km * 0.621371
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
            
        return jsonify({"success": True, "report": report})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": "Server Error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
