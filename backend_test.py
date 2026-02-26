#!/usr/bin/env python3
"""
Backend API Testing for Eurocode 2 Slab Design Application
Tests all endpoints, authentication, calculation engines, and PDF generation
"""

import requests
import json
import sys
import time
from datetime import datetime

class EC2SlabAPITester:
    def __init__(self, base_url="https://eurocode-slab-pdf.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name, success, response_data=None, error_msg=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "passed": success,
            "timestamp": datetime.now().isoformat(),
            "response": response_data if success else None,
            "error": error_msg if not success else None
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if error_msg and not success:
            print(f"    Error: {error_msg}")
        return success

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self.log_test("API Health Check", True, data)
            else:
                return self.log_test("API Health Check", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("API Health Check", False, error_msg=str(e))

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.user_email = f"test_{timestamp}@example.com"
        user_data = {
            "name": f"Test User {timestamp}",
            "email": self.user_email,
            "password": "TestPass123!"
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/register", json=user_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                return self.log_test("User Registration", True, {"user_id": self.user_id})
            else:
                return self.log_test("User Registration", False, error_msg=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("User Registration", False, error_msg=str(e))

    def test_user_login(self):
        """Test user login with created credentials"""
        if not hasattr(self, 'user_email'):
            # Use the email from registration
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.user_email = f"test_{timestamp}@example.com"
        
        login_data = {
            "email": self.user_email,
            "password": "TestPass123!"
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                return self.log_test("User Login", True, {"token_received": bool(self.token)})
            else:
                return self.log_test("User Login", False, error_msg=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("User Login", False, error_msg=str(e))

    def test_auth_me(self):
        """Test authenticated user profile endpoint"""
        if not self.token:
            return self.log_test("Get User Profile", False, error_msg="No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self.log_test("Get User Profile", True, data)
            else:
                return self.log_test("Get User Profile", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get User Profile", False, error_msg=str(e))

    def test_one_way_slab_calculation(self):
        """Test one-way slab calculation"""
        if not self.token:
            return self.log_test("One-Way Slab Calculation", False, error_msg="No token available")
        
        project_data = {
            "input_data": {
                "project_name": "Test One-Way Slab",
                "slab_type": "one_way",
                "span_x": 6000,
                "slab_thickness": 200,
                "concrete_grade": "C30/37",
                "steel_grade": "B500B",
                "cover": 25,
                "dead_load": 1.5,
                "imposed_load": 2.5
            }
        }
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        try:
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", {})
                # Store project ID for later tests
                self.one_way_project_id = data.get("id")
                
                # Verify calculation results
                bending = results.get("bending", {})
                reinforcement = results.get("reinforcement", {})
                success = (
                    bending.get("M_Ed") is not None and
                    reinforcement.get("As_required") is not None and
                    reinforcement.get("bar_diameter") is not None
                )
                
                return self.log_test("One-Way Slab Calculation", success, {
                    "project_id": self.one_way_project_id,
                    "M_Ed": bending.get("M_Ed"),
                    "As_required": reinforcement.get("As_required"),
                    "bar_size": f"T{reinforcement.get('bar_diameter')}@{reinforcement.get('bar_spacing')}"
                })
            else:
                return self.log_test("One-Way Slab Calculation", False, error_msg=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("One-Way Slab Calculation", False, error_msg=str(e))

    def test_two_way_slab_calculation(self):
        """Test two-way slab calculation"""
        if not self.token:
            return self.log_test("Two-Way Slab Calculation", False, error_msg="No token available")
        
        project_data = {
            "input_data": {
                "project_name": "Test Two-Way Slab",
                "slab_type": "two_way",
                "span_x": 5000,
                "span_y": 6000,
                "slab_thickness": 200,
                "concrete_grade": "C30/37",
                "steel_grade": "B500B",
                "cover": 25,
                "dead_load": 1.5,
                "imposed_load": 2.5
            }
        }
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        try:
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", {})
                self.two_way_project_id = data.get("id")
                
                # Verify two-way slab specific results
                bending_x = results.get("bending_x", {})
                bending_y = results.get("bending_y", {})
                reinforcement_x = results.get("reinforcement_x", {})
                success = (
                    bending_x.get("M_Ed") is not None and
                    bending_y.get("M_Ed") is not None and
                    reinforcement_x.get("As_required") is not None
                )
                
                return self.log_test("Two-Way Slab Calculation", success, {
                    "project_id": self.two_way_project_id,
                    "M_Ed_x": bending_x.get("M_Ed"),
                    "M_Ed_y": bending_y.get("M_Ed"),
                    "aspect_ratio": results.get("geometry", {}).get("aspect_ratio")
                })
            else:
                return self.log_test("Two-Way Slab Calculation", False, error_msg=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Two-Way Slab Calculation", False, error_msg=str(e))

    def test_flat_slab_calculation(self):
        """Test flat slab calculation"""
        if not self.token:
            return self.log_test("Flat Slab Calculation", False, error_msg="No token available")
        
        project_data = {
            "input_data": {
                "project_name": "Test Flat Slab",
                "slab_type": "flat_slab",
                "span_x": 7000,
                "span_y": 7000,
                "slab_thickness": 250,
                "concrete_grade": "C30/37",
                "steel_grade": "B500B",
                "cover": 25,
                "dead_load": 2.0,
                "imposed_load": 3.0,
                "column_width": 400,
                "column_depth": 400,
                "drop_panel": True,
                "drop_thickness": 100,
                "drop_size": 2000
            }
        }
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        try:
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", {})
                self.flat_slab_project_id = data.get("id")
                
                # Verify flat slab specific results
                punching_shear = results.get("punching_shear", {})
                reinforcement = results.get("reinforcement", {})
                success = (
                    punching_shear.get("V_Ed") is not None and
                    reinforcement.get("column_strip_negative") is not None
                )
                
                return self.log_test("Flat Slab Calculation", success, {
                    "project_id": self.flat_slab_project_id,
                    "V_Ed": punching_shear.get("V_Ed"),
                    "punching_ok": punching_shear.get("punching_ok"),
                    "has_drop_panel": results.get("geometry", {}).get("has_drop_panel")
                })
            else:
                return self.log_test("Flat Slab Calculation", False, error_msg=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Flat Slab Calculation", False, error_msg=str(e))

    def test_get_projects(self):
        """Test retrieving user projects"""
        if not self.token:
            return self.log_test("Get Projects List", False, error_msg="No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.api_url}/projects", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                project_count = len(data)
                return self.log_test("Get Projects List", True, {"project_count": project_count})
            else:
                return self.log_test("Get Projects List", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Projects List", False, error_msg=str(e))

    def test_get_project_details(self):
        """Test retrieving specific project details"""
        if not self.token or not hasattr(self, 'one_way_project_id'):
            return self.log_test("Get Project Details", False, error_msg="No token or project ID available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.api_url}/projects/{self.one_way_project_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                has_results = "results" in data and "input_data" in data
                return self.log_test("Get Project Details", has_results, {
                    "project_name": data.get("project_name"),
                    "has_results": has_results
                })
            else:
                return self.log_test("Get Project Details", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Get Project Details", False, error_msg=str(e))

    def test_update_project(self):
        """Test updating project"""
        if not self.token or not hasattr(self, 'one_way_project_id'):
            return self.log_test("Update Project", False, error_msg="No token or project ID available")
        
        updated_data = {
            "input_data": {
                "project_name": "Updated Test One-Way Slab",
                "slab_type": "one_way",
                "span_x": 7000,  # Changed from 6000
                "slab_thickness": 220,  # Changed from 200
                "concrete_grade": "C35/45",  # Changed grade
                "steel_grade": "B500B",
                "cover": 30,  # Changed from 25
                "dead_load": 2.0,  # Changed from 1.5
                "imposed_load": 3.0   # Changed from 2.5
            }
        }
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        try:
            response = requests.put(f"{self.api_url}/projects/{self.one_way_project_id}", 
                                  json=updated_data, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                updated_span = data.get("input_data", {}).get("span_x")
                success = updated_span == 7000
                return self.log_test("Update Project", success, {
                    "updated_span": updated_span,
                    "project_name": data.get("project_name")
                })
            else:
                return self.log_test("Update Project", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Update Project", False, error_msg=str(e))

    def test_pdf_generation(self):
        """Test PDF report generation"""
        if not self.token or not hasattr(self, 'one_way_project_id'):
            return self.log_test("PDF Generation", False, error_msg="No token or project ID available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.get(f"{self.api_url}/projects/{self.one_way_project_id}/pdf", 
                                  headers=headers, timeout=20)
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                is_pdf = 'application/pdf' in content_type
                pdf_size = len(response.content)
                return self.log_test("PDF Generation", is_pdf and pdf_size > 1000, {
                    "content_type": content_type,
                    "pdf_size_bytes": pdf_size
                })
            else:
                return self.log_test("PDF Generation", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("PDF Generation", False, error_msg=str(e))

    def test_delete_project(self):
        """Test deleting project"""
        if not self.token or not hasattr(self, 'two_way_project_id'):
            return self.log_test("Delete Project", False, error_msg="No token or project ID available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            response = requests.delete(f"{self.api_url}/projects/{self.two_way_project_id}", 
                                     headers=headers, timeout=10)
            if response.status_code == 200:
                return self.log_test("Delete Project", True, {"deleted_project": self.two_way_project_id})
            else:
                return self.log_test("Delete Project", False, error_msg=f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Delete Project", False, error_msg=str(e))

    def test_invalid_token(self):
        """Test API with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 401
            return self.log_test("Invalid Token Handling", success, {"status_code": response.status_code})
        except Exception as e:
            return self.log_test("Invalid Token Handling", False, error_msg=str(e))

    def test_invalid_slab_type(self):
        """Test calculation with invalid slab type"""
        if not self.token:
            return self.log_test("Invalid Slab Type", False, error_msg="No token available")
        
        project_data = {
            "input_data": {
                "project_name": "Invalid Slab Test",
                "slab_type": "invalid_type",
                "span_x": 5000,
                "slab_thickness": 200,
                "concrete_grade": "C30/37",
                "steel_grade": "B500B",
                "cover": 25,
                "dead_load": 1.5,
                "imposed_load": 2.5
            }
        }
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        try:
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=10)
            success = response.status_code == 400
            return self.log_test("Invalid Slab Type", success, {"status_code": response.status_code})
        except Exception as e:
            return self.log_test("Invalid Slab Type", False, error_msg=str(e))

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Eurocode 2 Slab Design API Tests")
        print("=" * 60)
        
        # Basic API tests
        self.test_health_check()
        
        # Authentication tests
        self.test_user_registration()
        self.test_auth_me()
        
        # Calculation engine tests
        self.test_one_way_slab_calculation()
        self.test_two_way_slab_calculation() 
        self.test_flat_slab_calculation()
        
        # CRUD operations
        self.test_get_projects()
        self.test_get_project_details()
        self.test_update_project()
        
        # PDF generation
        self.test_pdf_generation()
        
        # Error handling tests
        self.test_invalid_token()
        self.test_invalid_slab_type()
        
        # Cleanup
        self.test_delete_project()
        
        # Print results
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests PASSED!")
            return 0
        else:
            failed_tests = [r["test"] for r in self.test_results if not r["passed"]]
            print(f"❌ Failed tests: {', '.join(failed_tests)}")
            return 1

def main():
    """Run the test suite"""
    tester = EC2SlabAPITester()
    exit_code = tester.run_all_tests()
    
    # Save test results
    with open("/tmp/backend_test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())