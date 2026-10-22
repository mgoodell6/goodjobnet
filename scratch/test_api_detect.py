import sys, os
sys.path.append(os.path.abspath('backend'))
from app import app
import json

client = app.test_client()
response = client.post('/api/detect-jobbank-duplicates')
print("Status code:", response.status_code)
print("Data:", json.loads(response.data))
