import pygsheets

gc = pygsheets.authorize(service_file='backend/credentials.json')
sh = gc.open_by_key('1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I')
wks = sh.worksheet_by_title('Destinations')
all_values = wks.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
headers = all_values[0]
name_idx = headers.index('Name')
addr_idx = headers.index('Address')
jobs_idx = headers.index('Available Jobs') if 'Available Jobs' in headers else -1

for idx, r in enumerate(all_values[1:], start=2):
    addr = r[addr_idx].strip() if addr_idx < len(r) else ''
    if '1 COURTHOUSE SQUARE' in addr.upper():
        name = r[name_idx] if name_idx < len(r) else ''
        jobs = r[jobs_idx] if jobs_idx != -1 and jobs_idx < len(r) else ''
        print(f'Row {idx}: Name="{name}", Jobs="{jobs}"')
