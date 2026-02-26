#!/usr/bin/env python3
"""
Backend API Testing for Segun Labiran & Associates Website
Tests all public and admin endpoints using the public URL
"""

import requests
import json
import sys
from datetime import datetime

class SLAAPITester:
    def __init__(self):
        # Use the public backend URL from frontend/.env
        self.base_url = "https://struct-request.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        
        # Test data
        self.test_admin = {
            "email": f"test_admin_{datetime.now().strftime('%H%M%S')}@slaengineering.com",
            "password": "TestAdmin123!",
            "name": "Test Administrator"
        }

    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
            if details:
                print(f"   Details: {details}")
        
        self.results.append({
            "test_name": test_name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=False):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.admin_token:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 0
                
            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
                
            return success, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, data, status = self.make_request("GET", "/", expected_status=200)
        self.log_result("Root endpoint", success, 
                       expected_status=200, actual_status=status)
        
        # Test health endpoint
        success, data, status = self.make_request("GET", "/health", expected_status=200)
        self.log_result("Health endpoint", success,
                       expected_status=200, actual_status=status)

    def test_public_endpoints(self):
        """Test public API endpoints (no auth required)"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test GET /api/projects
        success, data, status = self.make_request("GET", "/projects", expected_status=200)
        self.log_result("GET /api/projects", success,
                       f"Returned {len(data) if isinstance(data, list) else 'non-list'} projects",
                       expected_status=200, actual_status=status)
        
        # Test GET /api/testimonials
        success, data, status = self.make_request("GET", "/testimonials", expected_status=200)
        self.log_result("GET /api/testimonials", success,
                       f"Returned {len(data) if isinstance(data, list) else 'non-list'} testimonials",
                       expected_status=200, actual_status=status)
        
        # Test GET /api/team
        success, data, status = self.make_request("GET", "/team", expected_status=200)
        self.log_result("GET /api/team", success,
                       f"Returned {len(data) if isinstance(data, list) else 'non-list'} team members",
                       expected_status=200, actual_status=status)
        
        # Test GET /api/blog
        success, data, status = self.make_request("GET", "/blog", expected_status=200)
        self.log_result("GET /api/blog", success,
                       f"Returned {len(data) if isinstance(data, list) else 'non-list'} blog posts",
                       expected_status=200, actual_status=status)

    def test_contact_inquiry(self):
        """Test contact form submission"""
        print("\n🔍 Testing Contact Inquiry...")
        
        inquiry_data = {
            "name": "John Test",
            "email": "john.test@example.com",
            "phone": "+234 801 234 5678",
            "company": "Test Company",
            "service": "structural",
            "message": "This is a test inquiry for structural engineering services."
        }
        
        success, data, status = self.make_request("POST", "/inquiries", data=inquiry_data, expected_status=200)
        self.log_result("POST /api/inquiries", success,
                       f"Inquiry ID: {data.get('id', 'N/A') if success else 'Failed'}",
                       expected_status=200, actual_status=status)
        
        return data.get('id') if success else None

    def test_admin_registration(self):
        """Test admin registration (first admin only)"""
        print("\n🔍 Testing Admin Registration...")
        
        success, data, status = self.make_request("POST", "/auth/register", 
                                                data=self.test_admin, expected_status=200)
        
        if success and data.get('access_token'):
            self.admin_token = data['access_token']
            self.log_result("POST /api/auth/register", True,
                           f"Admin registered: {data.get('admin', {}).get('name', 'N/A')}")
            return True
        else:
            # Check if admin already exists
            if status == 400 and "Admin already exists" in str(data):
                self.log_result("POST /api/auth/register", True,
                               "Admin already exists (expected for subsequent tests)")
                return False  # Need to login instead
            else:
                self.log_result("POST /api/auth/register", False,
                               f"Registration failed: {data.get('detail', 'Unknown error')}",
                               expected_status=200, actual_status=status)
                return False

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Login...")
        
        # First try to register, if that fails, try with a default admin
        if not self.test_admin_registration():
            # Try default admin credentials
            login_data = {
                "email": "admin@slaengineering.com",
                "password": "admin123"
            }
        else:
            login_data = {
                "email": self.test_admin["email"],
                "password": self.test_admin["password"]
            }
        
        success, data, status = self.make_request("POST", "/auth/login", 
                                                data=login_data, expected_status=200)
        
        if success and data.get('access_token'):
            self.admin_token = data['access_token']
            self.log_result("POST /api/auth/login", True,
                           f"Admin logged in: {data.get('admin', {}).get('name', 'N/A')}")
            return True
        else:
            self.log_result("POST /api/auth/login", False,
                           f"Login failed: {data.get('detail', 'Unknown error')}",
                           expected_status=200, actual_status=status)
            return False

    def test_admin_protected_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            print("⚠️ Skipping admin tests - no valid token")
            return
        
        print("\n🔍 Testing Admin Protected Endpoints...")
        
        # Test GET /api/admin/stats
        success, data, status = self.make_request("GET", "/admin/stats", 
                                                expected_status=200, auth_required=True)
        self.log_result("GET /api/admin/stats", success,
                       f"Stats: {json.dumps(data) if success else 'Failed'}",
                       expected_status=200, actual_status=status)
        
        # Test GET /api/admin/inquiries
        success, data, status = self.make_request("GET", "/admin/inquiries", 
                                                expected_status=200, auth_required=True)
        self.log_result("GET /api/admin/inquiries", success,
                       f"Found {len(data) if isinstance(data, list) else 'non-list'} inquiries",
                       expected_status=200, actual_status=status)

    def test_admin_crud_operations(self):
        """Test admin CRUD operations"""
        if not self.admin_token:
            print("⚠️ Skipping CRUD tests - no valid token")
            return
        
        print("\n🔍 Testing Admin CRUD Operations...")
        
        # Test creating a project
        project_data = {
            "title": "Test Project",
            "category": "structural",
            "description": "A test structural engineering project",
            "location": "Lagos, Nigeria",
            "year": "2024",
            "client": "Test Client",
            "featured": True
        }
        
        success, data, status = self.make_request("POST", "/admin/projects", 
                                                data=project_data, expected_status=200, auth_required=True)
        project_id = data.get('id') if success else None
        self.log_result("POST /api/admin/projects", success,
                       f"Project created: {project_id}" if success else "Failed",
                       expected_status=200, actual_status=status)
        
        # Test creating a testimonial
        testimonial_data = {
            "name": "Test Client",
            "position": "CEO",
            "company": "Test Company Ltd",
            "content": "Excellent engineering services provided by SL&A team."
        }
        
        success, data, status = self.make_request("POST", "/admin/testimonials", 
                                                data=testimonial_data, expected_status=200, auth_required=True)
        testimonial_id = data.get('id') if success else None
        self.log_result("POST /api/admin/testimonials", success,
                       f"Testimonial created: {testimonial_id}" if success else "Failed",
                       expected_status=200, actual_status=status)
        
        # Test creating a team member
        team_data = {
            "name": "Test Engineer",
            "position": "Senior Structural Engineer",
            "bio": "Experienced engineer with 10+ years in structural design.",
            "qualifications": ["B.Eng Civil Engineering", "COREN Registered"],
            "order": 1
        }
        
        success, data, status = self.make_request("POST", "/admin/team", 
                                                data=team_data, expected_status=200, auth_required=True)
        team_id = data.get('id') if success else None
        self.log_result("POST /api/admin/team", success,
                       f"Team member created: {team_id}" if success else "Failed",
                       expected_status=200, actual_status=status)
        
        # Test creating a blog post
        blog_data = {
            "title": "Test Blog Post",
            "excerpt": "A test blog post about engineering excellence",
            "content": "This is the full content of our test blog post about engineering practices.",
            "author": "Test Author",
            "tags": ["engineering", "construction"]
        }
        
        success, data, status = self.make_request("POST", "/admin/blog", 
                                                data=blog_data, expected_status=200, auth_required=True)
        blog_id = data.get('id') if success else None
        self.log_result("POST /api/admin/blog", success,
                       f"Blog post created: {blog_id}" if success else "Failed",
                       expected_status=200, actual_status=status)

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"\n🚀 Starting SL&A Backend API Testing")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        self.test_health_endpoints()
        self.test_public_endpoints()
        self.test_contact_inquiry()
        
        # Admin tests
        if self.test_admin_login():
            self.test_admin_protected_endpoints()
            self.test_admin_crud_operations()
        
        # Final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate < 50:
            print("❌ CRITICAL: More than 50% of tests failed")
            return False
        elif success_rate < 80:
            print("⚠️ WARNING: Some tests failed")
            return True
        else:
            print("✅ SUCCESS: Most tests passed")
            return True

def main():
    """Main test execution"""
    tester = SLAAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())