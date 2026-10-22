import pygsheets, re
from collections import defaultdict

gc = pygsheets.authorize(service_file='backend/credentials.json')
sh = gc.open_by_key('1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I')
wks = sh.worksheet_by_title('Destinations')
all_values = wks.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
headers = all_values[0]
name_idx = headers.index('Name')
addr_idx = headers.index('Address')
city_idx = headers.index('City') if 'City' in headers else -1
zip_idx = headers.index('Zip') if 'Zip' in headers else -1

GENERIC_ADDRESSES = {
    '', 'none', 'n/a', 'na', 'null', 'unknown', 'multiple', 'verify address',
    'tbd', 'various', 'remote', 'work from home', 'not provided'
}

def normalize_street(addr):
    if not addr: return ''
    s = addr.lower().strip()
    if s in GENERIC_ADDRESSES:
        return ''
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
    if not city: return ''
    s = city.lower().strip()
    s = re.sub(r'[^\w\s]', ' ', s)
    return ' '.join(s.split())

# Group by (normalized_street, normalized_city)
address_groups = defaultdict(list)
row_keys = []

for idx, r in enumerate(all_values[1:], start=2):
    name = r[name_idx] if name_idx < len(r) else ''
    addr = r[addr_idx] if addr_idx < len(r) else ''
    city = r[city_idx] if city_idx != -1 and city_idx < len(r) else ''
    
    n_street = normalize_street(addr)
    n_city = normalize_city(city)
    
    if n_street:
        key = (n_street, n_city)
        address_groups[key].append(idx)
        row_keys.append((idx, key, addr, city, name))
    else:
        row_keys.append((idx, None, addr, city, name))

# Calculate duplicate count for each row
payload = []
dup_count_summary = defaultdict(int)

for idx, key, addr, city, name in row_keys:
    if key is None:
        # No valid address -> blank
        val = ''
    else:
        total = len(address_groups[key])
        if total > 1:
            val = str(total)
        else:
            val = '0'
    payload.append(val)
    dup_count_summary[val] += 1

print(f"Total rows: {len(payload)}")
print("Duplicate count distribution in 'Potential Duplicate' column:")
for k in sorted(dup_count_summary.keys(), key=lambda x: (int(x) if x.isdigit() else -1)):
    label = f"'{k}'" if k else "'' (blank, no address)"
    print(f"   Value {label}: {dup_count_summary[k]} rows")

sample_dups = [item for item in row_keys if item[1] and len(address_groups[item[1]]) > 1][:10]
print("\nSample duplicates:")
for item in sample_dups:
    idx, key, addr, city, name = item
    count = len(address_groups[key])
    print(f"   Row {idx}: Potential Duplicate={count} | Name='{name}' | Addr='{addr}' | City='{city}'")
