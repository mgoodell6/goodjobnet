import pygsheets, re
from collections import defaultdict

gc = pygsheets.authorize(service_file='backend/credentials.json')
sh = gc.open_by_key('1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I')
try:
    wks = sh.worksheet_by_title('Destinations')
except Exception:
    wks = sh.sheet1

all_values = wks.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
headers = list(all_values[0])

# Locate 'Potential Duplicate' column
target_header = "potential duplicate"
col_idx = -1
for i, h in enumerate(headers):
    if str(h).strip().lower() == target_header:
        col_idx = i + 1
        break

if col_idx == -1:
    headers.append("Potential Duplicate")
    wks.update_row(1, headers)
    col_idx = len(headers)

# Locate Address and City columns
addr_col_idx = -1
city_col_idx = -1
for i, h in enumerate(headers):
    h_lower = str(h).strip().lower()
    if h_lower in ["address", "company_street", "street"] and addr_col_idx == -1:
        addr_col_idx = i
    if h_lower in ["city", "county", "company_city"] and city_col_idx == -1:
        city_col_idx = i

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
        total = len(address_groups[key])
        if total > 1:
            val = str(total)
            duplicate_rows_count += 1
        else:
            val = '0'
    update_payload.append([val])

duplicate_clusters_count = sum(1 for grp in address_groups.values() if len(grp) > 1)

def col_idx_to_letter(col):
    letter = ''
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        letter = chr(65 + remainder) + letter
    return letter

col_letter = col_idx_to_letter(col_idx)
range_str = f"{col_letter}2"
print(f"Updating range {range_str} (Col {col_idx} = {col_letter}) with {len(update_payload)} rows...")
wks.update_values(crange=range_str, values=update_payload)
print(f"Success! Updated {len(update_payload)} rows. Found {duplicate_rows_count} potential duplicates across {duplicate_clusters_count} address locations.")
