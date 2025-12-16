import mercadopago
import os
import json

# Use the EXISTING Access Token (likely a Production App Token) to create Test Users associated with it.
# This allows us to generate a "Seller" (Collector) and a "Buyer" (Payer).
# Using the Seller's Access Token for the backend will ensure we are in "Test Mode".

# Replace this with the token currently in docker-compose if needed, 
# or read from env.
ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "APP_USR-7325678715685755-121512-6406bc5bc892cf058e324f652e8906d5-3067813965")

sdk = mercadopago.SDK(ACCESS_TOKEN)

def create_test_user(site_id="MLA", description="Test User"):
    formatted_description = f"MantenPro {description}"
    data = {"site_id": site_id, "description": formatted_description[0:30]}
    
    try:
        # Using generic request method if specific wrapper fails
        # Endpoint: https://api.mercadopago.com/users/test_user
        # The SDK usually has a 'post' or 'create' on the main object or via request_options
        
        # Trying a direct request via the 'mercadopago' http_client or similar if available, 
        # but the SDK usually exposes .post(uri, data)
        # Check if sdk has .post, otherwise use request lib if available (not guaranteed)
        
        # Attempt 1: sdk.post (common in some versions)
        # response = sdk.post("/users/test_user", data)
        
        # Attempt 2: using internal http client if exposed, or fallback to standard library
        import urllib.request
        import urllib.error
        
        url = "https://api.mercadopago.com/users/test_user"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req) as r:
            response_data = json.loads(r.read().decode('utf-8'))
            return response_data

    except Exception as e:
        print(f"Exception creating user: {e}")
        return None

def validate_token():
    try:
        import urllib.request
        url = "https://api.mercadopago.com/users/me"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode('utf-8'))
            print("Token is VALID.")
            print(f"User ID: {data.get('id')}")
            print(f"Scopes: {data.get('scopes')}") # Might not be in response, but good to check
            return True
    except Exception as e:
        print(f"Token Validation Failed: {e}")
        return False

def main():
    print(f"Checking token: {ACCESS_TOKEN[:10]}...")
    if not validate_token():
        print("Cannot proceed with invalid token.")
        return

    # 1. Create Seller (Collector)
    print("\n--- Creating SELLER (Collector) ---")
    seller = create_test_user(description="Seller")
    if seller:
        print(f"SELLER ID: {seller['id']}")
        print(f"SELLER EMAIL: {seller['email']}")
        print(f"SELLER ACCESS_TOKEN: {seller['site_status']['leads_access_token'] if 'leads_access_token' in seller['site_status'] else 'N/A'}")
        # Actually usually 'nickname' and 'password' are provided, 
        # but for API use we need the Access Token of this test user?
        # WAIT: The /users/test endpoint returns a test user. 
        # But `preapproval` requires an Access Token. 
        # DOES THE TEST USER HAVE AN ACCESS TOKEN?
        # Usually checking the response...
        # It seems /users/test creates a user but getting their specific Access Token might require 
        # standard OAuth flow or it's not simple. 
        # HOWEVER, for standard checkout, we use OUR Access Token and just use Test Users.
        # BUT the error says "Both payer and collector must be real or test users".
        
        # This implies:
        # A) Our Access Token belongs to a REAL user -> We must use REAL Payers (and real money).
        # B) Our Access Token belongs to a TEST user -> We must use TEST Payers.
        
        # To get a Test User's Access Token, we often need to authenticate as them?
        # Actually, if we use the "APP_USR-..." token, we ARE the collector.
        # If that token is from a PRODUCTION account, we are a REAL collector.
        # So we MUST use REAL Payers? 
        # NO, we can use Sandbox Mode? 
        # Subscriptions API (Preapproval) does NOT share the same "Sandbox Mode" switch as Checkout Pro sometimes.
        
        # CORRECT APPROACH for invalidating "Both payer and collector...":
        # We need an Access Token that belongs to a TEST USER.
        # We can generated a Test User, and usually the response includes test credentials?
        # Let's inspect the output.
        pass
    else:
        print("Failed to create Seller.")

    # 2. Create Buyer (Payer)
    print("\n--- Creating BUYER (Payer) ---")
    buyer = create_test_user(description="Buyer")
    if buyer:
        print(f"BUYER ID: {buyer['id']}")
        print(f"BUYER EMAIL: {buyer['email']}")
    else:
        print("Failed to create Buyer.")

if __name__ == "__main__":
    main()
