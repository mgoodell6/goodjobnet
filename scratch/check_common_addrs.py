import pygsheets, re
from collections import Counter

gc = pygsheets.authorize(service_file='backend/credentials.json')
sh = gc.open_by_key('1NxDQTta3xvch5jn_j-DpWvGg0zRfJhpGnLv9rFQxw6I')
wks = sh.worksheet_by_title('Destinations')
all_values = wks.get_all_values(include_tailing_empty_rows=False, include_tailing_empty=False)
headers = all_values[0]
addr_idx = headers.index('Address')

addrs = [r[addr_idx].strip() for r in all_values[1:] if addr_idx < len(r)]
c = Counter(addrs)
print('Most common addresses:')
for addr, count in c.most_common(25):
    print(f'   Count {count}: "{addr}"')
