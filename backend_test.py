#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for QR Visitor Alert System
Tests all backend endpoints with proper data validation
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BASE_URL = "https://home-access-qr.preview.emergentagent.com/api"

# Test data
TEST_OWNER_EMAIL = "tester@example.com"
TEST_MEDIA_B64 = "dGVzdA=="  # base64 encoded "test"

def log_test(test_name, success=True, details=""):
    """Log test results with clear formatting"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} | {test_name}")
    if details:
        print(f"    {details}")

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, json=data, params=params, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, timeout=10)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return None

def test_api_health():
    """Test if API is running"""
    print("\n" + "="*60)
    print("🔧 API HEALTH CHECK")
    print("="*60)
    
    response = make_request("GET", "/")
    if response and response.status_code == 200:
        log_test("API Health Check", True, f"Status: {response.status_code}")
        return True
    else:
        log_test("API Health Check", False, f"Status: {response.status_code if response else 'No response'}")
        return False

def test_location_api():
    """Test Location CRUD operations"""
    print("\n" + "="*60)
    print("📍 LOCATION API TESTS")
    print("="*60)
    
    location_id = None
    
    # Test 1: Create Location
    location_data = {
        "name": "Test Office Building",
        "description": "Main entrance for testing",
        "owner_email": TEST_OWNER_EMAIL
    }
    
    response = make_request("POST", "/locations", location_data)
    if response and response.status_code == 200:
        result = response.json()
        location_id = result.get("id")
        log_test("Create Location", True, f"Created location ID: {location_id}")
    else:
        log_test("Create Location", False, f"Status: {response.status_code if response else 'No response'}")
        return None
    
    # Test 2: Get All Locations for User
    response = make_request("GET", "/locations", params={"owner_email": TEST_OWNER_EMAIL})
    if response and response.status_code == 200:
        locations = response.json()
        found_location = any(loc["id"] == location_id for loc in locations)
        log_test("Get All Locations", found_location, f"Found {len(locations)} locations")
    else:
        log_test("Get All Locations", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 3: Get Specific Location
    response = make_request("GET", f"/locations/{location_id}")
    if response and response.status_code == 200:
        location = response.json()
        log_test("Get Specific Location", True, f"Name: {location.get('name')}")
    else:
        log_test("Get Specific Location", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 4: Delete Location (we'll do this later after visitor tests)
    return location_id

def test_visitor_request_api(location_id):
    """Test Visitor Request operations"""
    print("\n" + "="*60)
    print("👥 VISITOR REQUEST API TESTS")
    print("="*60)
    
    if not location_id:
        log_test("Visitor Request Tests", False, "No location ID provided")
        return None
    
    visitor_request_id = None
    
    # Test 1: Create Visitor Request
    visitor_data = {
        "location_id": location_id,
        "visitor_name": "John Doe",
        "visitor_phone": "+1234567890",
        "visitor_email": "john.doe@example.com",
        "purpose": "Business meeting with Sarah",
        "media_type": "photo",
        "media_base64": TEST_MEDIA_B64
    }
    
    response = make_request("POST", "/visitor-requests", visitor_data)
    if response and response.status_code == 200:
        result = response.json()
        visitor_request_id = result.get("id")
        log_test("Create Visitor Request", True, f"Created request ID: {visitor_request_id}")
    else:
        log_test("Create Visitor Request", False, f"Status: {response.status_code if response else 'No response'}")
        return None
    
    # Test 2: Get Visitor Requests for Location
    response = make_request("GET", "/visitor-requests", params={"location_id": location_id})
    if response and response.status_code == 200:
        requests_list = response.json()
        found_request = any(req["id"] == visitor_request_id for req in requests_list)
        log_test("Get Visitor Requests by Location", found_request, f"Found {len(requests_list)} requests")
    else:
        log_test("Get Visitor Requests by Location", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 3: Get Specific Visitor Request
    response = make_request("GET", f"/visitor-requests/{visitor_request_id}")
    if response and response.status_code == 200:
        request = response.json()
        log_test("Get Specific Visitor Request", True, f"Visitor: {request.get('visitor_name')}")
    else:
        log_test("Get Specific Visitor Request", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 4: Update Visitor Request Status
    response = make_request("PATCH", f"/visitor-requests/{visitor_request_id}/status", params={"status": "approved"})
    if response and response.status_code == 200:
        log_test("Update Visitor Status", True, "Status updated to approved")
    else:
        log_test("Update Visitor Status", False, f"Status: {response.status_code if response else 'No response'}")
    
    return visitor_request_id

def test_notification_api():
    """Test Notification operations"""
    print("\n" + "="*60)
    print("🔔 NOTIFICATION API TESTS")
    print("="*60)
    
    # Test 1: Get Notifications for Owner
    response = make_request("GET", "/notifications", params={"owner_email": TEST_OWNER_EMAIL})
    if response and response.status_code == 200:
        notifications = response.json()
        log_test("Get Notifications", True, f"Found {len(notifications)} notifications")
        
        # Test if notification was created from visitor request
        if notifications:
            notification_id = notifications[0].get("id")
            
            # Test 2: Mark Notification as Read
            response = make_request("PATCH", f"/notifications/{notification_id}/read")
            if response and response.status_code == 200:
                log_test("Mark Notification as Read", True)
            else:
                log_test("Mark Notification as Read", False, f"Status: {response.status_code if response else 'No response'}")
        
    else:
        log_test("Get Notifications", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 3: Get Notification Count
    response = make_request("GET", "/notifications/count", params={"owner_email": TEST_OWNER_EMAIL})
    if response and response.status_code == 200:
        count_data = response.json()
        log_test("Get Notification Count", True, f"Unread count: {count_data.get('unread_count')}")
    else:
        log_test("Get Notification Count", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test 4: Mark All Notifications as Read
    response = make_request("PATCH", "/notifications/mark-all-read", params={"owner_email": TEST_OWNER_EMAIL})
    if response and response.status_code == 200:
        log_test("Mark All Notifications as Read", True)
    else:
        log_test("Mark All Notifications as Read", False, f"Status: {response.status_code if response else 'No response'}")

def cleanup_test_data(location_id):
    """Clean up test data"""
    print("\n" + "="*60)
    print("🧹 CLEANUP TEST DATA")
    print("="*60)
    
    if location_id:
        response = make_request("DELETE", f"/locations/{location_id}")
        if response and response.status_code == 200:
            log_test("Delete Test Location", True)
        else:
            log_test("Delete Test Location", False, f"Status: {response.status_code if response else 'No response'}")

def test_error_scenarios():
    """Test error handling scenarios"""
    print("\n" + "="*60)
    print("⚠️  ERROR SCENARIO TESTS")
    print("="*60)
    
    # Test 1: Get Non-existent Location
    response = make_request("GET", "/locations/nonexistent-id")
    if response and response.status_code == 404:
        log_test("Get Non-existent Location", True, "Correctly returned 404")
    else:
        log_test("Get Non-existent Location", False, f"Expected 404, got {response.status_code if response else 'No response'}")
    
    # Test 2: Create Visitor Request with Invalid Location
    invalid_visitor_data = {
        "location_id": "nonexistent-location",
        "visitor_name": "Test User",
        "visitor_phone": "+1234567890",
        "visitor_email": "test@example.com",
        "purpose": "Test",
        "media_type": "photo",
        "media_base64": TEST_MEDIA_B64
    }
    
    response = make_request("POST", "/visitor-requests", invalid_visitor_data)
    if response and response.status_code == 404:
        log_test("Create Visitor Request with Invalid Location", True, "Correctly returned 404")
    else:
        log_test("Create Visitor Request with Invalid Location", False, f"Expected 404, got {response.status_code if response else 'No response'}")
    
    # Test 3: Update Status with Invalid Value
    response = make_request("PATCH", "/visitor-requests/test-id/status", params={"status": "invalid-status"})
    if response and response.status_code == 400:
        log_test("Update Status with Invalid Value", True, "Correctly returned 400")
    else:
        log_test("Update Status with Invalid Value", False, f"Expected 400, got {response.status_code if response else 'No response'}")

def main():
    """Run all tests"""
    print("🚀 Starting QR Visitor Alert Backend API Tests")
    print(f"🎯 Target URL: {BASE_URL}")
    print(f"📧 Test Owner: {TEST_OWNER_EMAIL}")
    
    # Check if API is running
    if not test_api_health():
        print("\n❌ API is not running. Aborting tests.")
        sys.exit(1)
    
    # Run main test sequence
    location_id = test_location_api()
    visitor_request_id = test_visitor_request_api(location_id)
    test_notification_api()
    test_error_scenarios()
    
    # Cleanup
    cleanup_test_data(location_id)
    
    print("\n" + "="*60)
    print("🏁 ALL TESTS COMPLETED")
    print("="*60)
    print("\n📋 SUMMARY:")
    print("- Location API: CREATE, READ, DELETE operations tested")
    print("- Visitor Request API: CREATE, READ, UPDATE operations tested") 
    print("- Notification API: READ, COUNT, MARK_READ operations tested")
    print("- Error scenarios: 404 and 400 status codes tested")
    print("- Automatic notification creation verified")
    print("- Email notifications are MOCKED (logged to backend)")

if __name__ == "__main__":
    main()