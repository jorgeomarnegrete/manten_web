import urllib.request
import urllib.parse
import urllib.error
import json
import sys
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def make_request(method, endpoint, data=None, headers=None):
    if headers is None:
        headers = {}
    
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    
    for k, v in headers.items():
        req.add_header(k, v)
    
    if data is not None:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Connection failed: {e.reason}")
        return 0, {}

def run_test():
    # 1. Login
    email = "admin@test.com"
    password = "admin" 
    
    print("Testing Login...")
    status, res = make_request("POST", "/token", {"username": email, "password": password}) # Use form-urlencoded logic inside helper?
    # Wait, /token expects x-www-form-urlencoded, my helper sends JSON.
    # Need to adjust helper or manual call for token.
    
    # Manual form-data call for token
    data = urllib.parse.urlencode({"username": email, "password": password}).encode()
    req = urllib.request.Request(f"{BASE_URL}/token", data=data, method="POST")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            status = 200
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            res = json.loads(e.read().decode('utf-8'))
        except:
            res = {}
    except urllib.error.URLError:
        print("Could not connect to backend. Is it running?")
        sys.exit(1)

    if status != 200:
        print("Login failed, trying to register new company...")
        ts = int(time.time())
        email = f"admin{ts}@test.com"
        password = "admin"
        status, res = make_request("POST", "/register", {
            "name": f"Test Company {ts}",
            "admin_email": email,
            "admin_password": password
        })
        if status != 200:
            print(f"Registration failed: {res}")
            sys.exit(1)
            
        # Login again
        data = urllib.parse.urlencode({"username": email, "password": password}).encode()
        req = urllib.request.Request(f"{BASE_URL}/token", data=data, method="POST")
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        try:
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode('utf-8'))
                status = 200
        except:
            print("Login after reg failed")
            sys.exit(1)

    token = res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in as {email}")

    # 2. Create Sector
    print("Creating Sector...")
    status, res = make_request("POST", "/archives/sectors", {"name": "Maintenance Sector"}, headers)
    if status != 200:
        print(f"Sector creation failed: {res}")
        sys.exit(1)
    sector_id = res["id"]

    # 3. Create Asset
    print("Creating Asset...")
    status, res = make_request("POST", "/archives/assets", {
        "name": "Generator X1",
        "sector_id": sector_id,
        "status": "ACTIVE"
    }, headers)
    if status != 200:
        print(f"Asset creation failed: {res}")
        sys.exit(1)
    asset_id = res["id"]

    # 4. Create Preventive Plan
    print("Creating Preventive Plan...")
    status, res = make_request("POST", "/preventive-plans/", {
        "name": "Monthly Check",
        "frequency_type": "MONTHLY",
        "frequency_value": 1,
        "asset_id": asset_id,
        "tasks": [
            {"description": "Check Oil Level", "estimated_time": 10},
            {"description": "Clean Filters", "estimated_time": 30}
        ]
    }, headers)
    if status != 200:
        print(f"Plan creation failed: {res}")
        sys.exit(1)
    plan_id = res["id"]
    print(f"Plan created with ID {plan_id}")

    # 5. Check and Run (Trigger)
    print("Triggering Check and Run...")
    status, res = make_request("POST", "/preventive-plans/check-and-run", None, headers)
    if status != 200:
        print(f"Check run failed: {res}")
        sys.exit(1)
    
    print(f"Check result: {res}")
    if res.get("generated_count", 0) == 0:
        print("WARNING: No OTs generated. Check plan next_run date.")
    
    # 6. Verify Work Order
    print("Verifying Work Orders...")
    status, wos = make_request("GET", "/work-orders/", None, headers)
    if status != 200:
        print(f"Get WOs failed: {wos}")
        sys.exit(1)
    
    print(f"Found {len(wos)} Work Orders")
    
    found = False
    for wo in wos:
        if wo.get("plan_id") == plan_id:
            found = True
            print(f"SUCCESS: Work Order {wo['ticket_number']} generated for Plan {plan_id}")
            break
    
    if not found:
        print("FAILURE: Did not find generated Work Order for the plan.")
        sys.exit(1)

    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    run_test()
