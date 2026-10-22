"""
JobBank Address-Based Duplicate Detection Script
Scans through all entered jobs in the Master JobBank spreadsheet (Destinations worksheet),
normalizes company street addresses and cities, and writes the duplicate counts into the
'Potential Duplicate' column:
- '0' for unique jobs with a valid address
- Total count (e.g. '2', '3') for jobs sharing an address
- Blank ('') for jobs with missing/generic addresses
"""

import os
import re
import pygsheets
from collections import defaultdict

SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'JobEntryForm', 'credentials.json')
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')

SPREADSHEET_ID_MASTER_JOBBANK = '1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I'
SPREADSHEET_ID_JOBS = '1YIGS6DRmnEH3be9TG59nFVhGee2DVcc4MaaXFhKgSic'

GENERIC_ADDRESSES = {
    '', 'none', 'n/a', 'na', 'null', 'unknown', 'multiple', 'verify address',
    'tbd', 'various', 'remote', 'work from home', 'not provided'
}

def normalize_street(addr):
    if not addr:
        return ''
    s = str(addr).lower().strip()
    if s in GENERIC_ADDRESSES:
        return ''
    s = re.sub(r'#\s*', ' ste ', s)
    s = re.sub(r'[^\w\s]', ' ', s)
    replacements = {
        'street': 'st', 'road': 'rd', 'boulevard': 'blvd', 'avenue': 'ave',
        'drive': 'dr', 'court': 'ct', 'lane': 'ln', 'highway': 'hwy',
        'parkway': 'pkwy', 'circle': 'cir', 'trail': 'trl', 'place': 'pl',
        'terrace': 'ter', 'way': 'way',
        'north': 'n', 'south': 's', 'east': 'e', 'west': 'w',
        'suite': 'ste', 'unit': 'ste', 'apt': 'ste', 'apartment': 'ste'
    }
    tokens = [replacements.get(t, t) for t in s.split()]
    normalized = ' '.join(tokens)
    return normalized if len(normalized) > 3 else ''

def normalize_city(city):
    if not city:
        return ''
    s = str(city).lower().strip()
    s = re.sub(r'[^\w\s]', ' ', s)
    return ' '.join(s.split())

def col_idx_to_letter(col):
    letter = ''
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        letter = chr(65 + remainder) + letter
    return letter

def run_duplicate_detection():
    print(f"Authorizing Google Sheets API using {SERVICE_ACCOUNT_FILE}...")
    gc = pygsheets.authorize(service_file=SERVICE_ACCOUNT_FILE)

    try:
        sh_jb = gc.open_by_key(SPREADSHEET_ID_MASTER_JOBBANK)
    except Exception:
        sh_jb = gc.open_by_key(SPREADSHEET_ID_JOBS)

    try:
        wks_jb = sh_jb.worksheet_by_title("Destinations")
    except Exception:
        wks_jb = sh_jb.sheet1

    print(f"Reading spreadsheet '{sh_jb.title}', worksheet '{wks_jb.title}'...")
    all_values = wks_jb.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
    if not all_values or len(all_values) < 2:
        print("Error: JobBank spreadsheet has no job entries.")
        return

    headers = list(all_values[0])

    target_header = "potential duplicate"
    col_idx = -1
    for i, h in enumerate(headers):
        if str(h).strip().lower() == target_header:
            col_idx = i + 1
            break

    if col_idx == -1:
        headers.append("Potential Duplicate")
        wks_jb.update_row(1, headers)
        col_idx = len(headers)

    addr_col_idx = -1
    city_col_idx = -1
    for i, h in enumerate(headers):
        h_lower = str(h).strip().lower()
        if h_lower in ["address", "company_street", "street"] and addr_col_idx == -1:
            addr_col_idx = i
        if h_lower in ["city", "county", "company_city"] and city_col_idx == -1:
            city_col_idx = i

    address_groups = defaultdict(list)
    row_keys = []

    for row in all_values[1:]:
        addr_val = row[addr_col_idx] if addr_col_idx != -1 and addr_col_idx < len(row) else ''
        city_val = row[city_col_idx] if city_col_idx != -1 and city_col_idx < len(row) else ''

        norm_street = normalize_street(addr_val)
        norm_city = normalize_city(city_val)

        if norm_street:
            key = (norm_street, norm_city)
            address_groups[key].append(row)
            row_keys.append(key)
        else:
            row_keys.append(None)

    update_payload = []
    duplicate_rows_count = 0

    for key in row_keys:
        if key is None:
            val = ''
        else:
            total_in_group = len(address_groups[key])
            if total_in_group > 1:
                val = str(total_in_group)
                duplicate_rows_count += 1
            else:
                val = '0'
        update_payload.append([val])

    duplicate_clusters_count = sum(1 for grp in address_groups.values() if len(grp) > 1)
    col_letter = col_idx_to_letter(col_idx)
    range_str = f"{col_letter}2"

    print(f"Updating Column {col_letter} ('Potential Duplicate') across {len(update_payload)} rows...")
    wks_jb.update_values(crange=range_str, values=update_payload)
    print(f"Completed! Scanned {len(update_payload)} JobBank entries.")
    print(f"Found {duplicate_rows_count} potential duplicates across {duplicate_clusters_count} address locations.")
    print(f"Spreadsheet URL: {sh_jb.url}")

if __name__ == "__main__":
    run_duplicate_detection()
