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

def clean_address(addr):
    if not addr: return ''
    s = addr.lower().strip()
    # If generic or empty
    if s in {'', 'none', 'n/a', 'na', 'null', 'unknown', 'multiple', 'verify address', 'tbd', 'various', 'remote'}:
        return ''
    # remove punctuation
    s = re.sub(r'[^\w\s]', ' ', s)
    # standard street abbreviations
    replacements = {
        'street': 'st', 'road': 'rd', 'boulevard': 'blvd', 'avenue': 'ave',
        'drive': 'dr', 'court': 'ct', 'lane': 'ln', 'highway': 'hwy',
        'parkway': 'pkwy', 'circle': 'cir', 'trail': 'trl', 'north': 'n',
        'south': 's', 'east': 'e', 'west': 'w', 'suite': 'ste', 'unit': 'ste', 'apt': 'ste'
    }
    tokens = [replacements.get(t, t) for t in s.split()]
    return ' '.join(tokens)

# Test 1: Just normalized street address
street_counts = defaultdict(int)
# Test 2: Normalized street address + city
street_city_counts = defaultdict(int)
# Test 3: Normalized street address + zip (if zip present, else city)
street_zip_counts = defaultdict(int)

cleaned = []
for r in all_values[1:]:
    name = r[name_idx] if name_idx < len(r) else ''
    addr = r[addr_idx] if addr_idx < len(r) else ''
    city = r[city_idx] if city_idx != -1 and city_idx < len(r) else ''
    zip_code = r[zip_idx] if zip_idx != -1 and zip_idx < len(r) else ''
    norm_a = clean_address(addr)
    norm_c = city.lower().strip()
    norm_z = re.sub(r'\D', '', zip_code)[:5]
    cleaned.append((norm_a, norm_c, norm_z, name, addr))
    if norm_a:
        street_counts[norm_a] += 1
        if norm_c:
            street_city_counts[(norm_a, norm_c)] += 1
        if norm_z:
            street_zip_counts[(norm_a, norm_z)] += 1

print(f"Total rows: {len(cleaned)}")
print(f"Rows with non-empty street address: {sum(1 for x in cleaned if x[0])}")
print(f"Rows flagged as duplicate (count > 1) by street address alone: {sum(1 for x in cleaned if x[0] and street_counts[x[0]] > 1)}")
print(f"Rows flagged as duplicate by street + city: {sum(1 for x in cleaned if x[0] and x[1] and street_city_counts[(x[0], x[1])] > 1)}")
print(f"Rows flagged as duplicate by street + zip: {sum(1 for x in cleaned if x[0] and x[2] and street_zip_counts[(x[0], x[2])] > 1)}")
