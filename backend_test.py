#!/usr/bin/env python3
"""
Backend API Testing for Prestressed Beam Design Application
Tests all API endpoints using the public URL
"""

import requests
import json
import sys
from datetime import datetime

class BeamForgeAPITester:
    def __init__(self, base_url="https://beam-prestress-calc.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1

    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data.get('status', 'N/A')}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False

    def test_beam_analysis(self):
        """Test beam analysis endpoint with valid data"""
        try:
            # Test data for rectangular beam analysis
            test_data = {
                "project_name": "Test Project",
                "beam_name": "Test Beam",
                "span": 20.0,
                "section_type": "rectangular",
                "width": 400,
                "height": 800,
                "concrete": {
                    "fck": 40,
                    "creep_coefficient": 2.0,
                    "shrinkage_strain": 0.0003,
                    "density": 25.0
                },
                "steel": {
                    "fp01k": 1640,
                    "fpk": 1860,
                    "Ep": 195,
                    "strand_area": 140,
                    "num_strands": 12,
                    "relaxation_class": 2
                },
                "prestress_type": "post_tensioned",
                "jacking_stress": 1400,
                "tendon_profile": "parabolic",
                "e_end": 0,
                "e_mid": 300,
                "friction_coefficient": 0.19,
                "wobble_coefficient": 0.008,
                "include_self_weight": True,
                "imposed_udl": 15,
                "permanent_udl": 5
            }

            response = requests.post(
                f"{self.base_url}/api/design/analyze",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )

            success = response.status_code == 200
            details = f"Status: {response.status_code}"

            if success:
                data = response.json()
                if 'results' in data:
                    results = data['results']
                    # Store project ID for later tests
                    if 'id' in data:
                        self.project_id = data.get('input_id')
                    details += f", Overall Status: {results.get('overall_status', 'N/A')}"
                    
                    # Check key result components
                    checks = []
                    if 'flexure' in results:
                        checks.append(f"Flexure: {results['flexure'].get('status', 'N/A')}")
                    if 'shear' in results:
                        checks.append(f"Shear: {results['shear'].get('status', 'N/A')}")
                    if 'deflection' in results:
                        checks.append(f"Deflection: {results['deflection'].get('status', 'N/A')}")
                    
                    if checks:
                        details += f", Checks: {', '.join(checks)}"
                else:
                    success = False
                    details += ", No results in response"
            else:
                try:
                    error = response.json()
                    details += f", Error: {error.get('detail', 'Unknown error')}"
                except:
                    details += f", Raw response: {response.text[:100]}"

            self.log_test("Beam Analysis", success, details)
            return success

        except Exception as e:
            self.log_test("Beam Analysis", False, f"Exception: {str(e)}")
            return False

    def test_section_types(self):
        """Test analysis with different section types"""
        section_types = [
            {
                "name": "T-Beam",
                "data": {
                    "project_name": "T-Beam Test",
                    "beam_name": "T-Beam",
                    "span": 15.0,
                    "section_type": "t_beam",
                    "bw": 300,
                    "bf": 1000,
                    "hf": 150,
                    "height": 800,
                    "concrete": {"fck": 35},
                    "steel": {"fp01k": 1640, "fpk": 1860, "Ep": 195, "strand_area": 140, "num_strands": 8, "relaxation_class": 2},
                    "prestress_type": "post_tensioned",
                    "jacking_stress": 1300,
                    "tendon_profile": "parabolic",
                    "e_end": 0,
                    "e_mid": 250,
                    "friction_coefficient": 0.19,
                    "wobble_coefficient": 0.008,
                    "include_self_weight": True,
                    "imposed_udl": 10,
                    "permanent_udl": 3
                }
            },
            {
                "name": "I-Beam",
                "data": {
                    "project_name": "I-Beam Test",
                    "beam_name": "I-Beam",
                    "span": 25.0,
                    "section_type": "i_beam",
                    "bw": 200,
                    "bf_top": 600,
                    "bf_bot": 600,
                    "hf_top": 150,
                    "hf_bot": 200,
                    "height": 1000,
                    "concrete": {"fck": 45},
                    "steel": {"fp01k": 1640, "fpk": 1860, "Ep": 195, "strand_area": 140, "num_strands": 16, "relaxation_class": 2},
                    "prestress_type": "post_tensioned",
                    "jacking_stress": 1400,
                    "tendon_profile": "straight",
                    "eccentricity": 350,
                    "friction_coefficient": 0.19,
                    "wobble_coefficient": 0.008,
                    "include_self_weight": True,
                    "imposed_udl": 20,
                    "permanent_udl": 5
                }
            }
        ]

        success_count = 0
        for section in section_types:
            try:
                response = requests.post(
                    f"{self.base_url}/api/design/analyze",
                    json=section["data"],
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                success = response.status_code == 200
                if success:
                    success_count += 1
                    data = response.json()
                    status = data.get('results', {}).get('overall_status', 'UNKNOWN')
                    details = f"Status: {status}"
                else:
                    try:
                        error = response.json()
                        details = f"Error: {error.get('detail', 'Unknown')}"
                    except:
                        details = f"Status: {response.status_code}"
                
                self.log_test(f"Section Type - {section['name']}", success, details)
                
            except Exception as e:
                self.log_test(f"Section Type - {section['name']}", False, f"Exception: {str(e)}")

        return success_count == len(section_types)

    def test_tendon_profiles(self):
        """Test different tendon profiles"""
        profiles = [
            {
                "name": "Straight Profile",
                "tendon_profile": "straight",
                "params": {"eccentricity": 300}
            },
            {
                "name": "Parabolic Profile", 
                "tendon_profile": "parabolic",
                "params": {"e_end": 0, "e_mid": 350}
            },
            {
                "name": "Harped Profile",
                "tendon_profile": "harped",
                "params": {"e_support": 0, "e_drape": 400, "drape_position": 0.4}
            },
            {
                "name": "Multi-Parabolic Profile",
                "tendon_profile": "multi_parabolic", 
                "params": {"e_end": 50, "e_mid": 300}
            }
        ]

        success_count = 0
        base_data = {
            "project_name": "Profile Test",
            "beam_name": "Test Beam",
            "span": 18.0,
            "section_type": "rectangular",
            "width": 400,
            "height": 800,
            "concrete": {"fck": 40},
            "steel": {"fp01k": 1640, "fpk": 1860, "Ep": 195, "strand_area": 140, "num_strands": 10, "relaxation_class": 2},
            "prestress_type": "post_tensioned",
            "jacking_stress": 1350,
            "friction_coefficient": 0.19,
            "wobble_coefficient": 0.008,
            "include_self_weight": True,
            "imposed_udl": 12,
            "permanent_udl": 4
        }

        for profile in profiles:
            try:
                test_data = base_data.copy()
                test_data["tendon_profile"] = profile["tendon_profile"]
                test_data.update(profile["params"])

                response = requests.post(
                    f"{self.base_url}/api/design/analyze",
                    json=test_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                success = response.status_code == 200
                if success:
                    success_count += 1
                    data = response.json()
                    status = data.get('results', {}).get('overall_status', 'UNKNOWN')
                    details = f"Status: {status}"
                else:
                    try:
                        error = response.json()
                        details = f"Error: {error.get('detail', 'Unknown')}"
                    except:
                        details = f"Status: {response.status_code}"
                
                self.log_test(profile["name"], success, details)
                
            except Exception as e:
                self.log_test(profile["name"], False, f"Exception: {str(e)}")

        return success_count == len(profiles)

    def test_pdf_generation(self):
        """Test PDF report generation"""
        try:
            test_data = {
                "project_name": "PDF Test Project",
                "beam_name": "PDF Test Beam",
                "span": 20.0,
                "section_type": "rectangular",
                "width": 400,
                "height": 800,
                "concrete": {"fck": 40},
                "steel": {"fp01k": 1640, "fpk": 1860, "Ep": 195, "strand_area": 140, "num_strands": 12, "relaxation_class": 2},
                "prestress_type": "post_tensioned",
                "jacking_stress": 1400,
                "tendon_profile": "parabolic",
                "e_end": 0,
                "e_mid": 300,
                "friction_coefficient": 0.19,
                "wobble_coefficient": 0.008,
                "include_self_weight": True,
                "imposed_udl": 15,
                "permanent_udl": 5
            }

            response = requests.post(
                f"{self.base_url}/api/design/generate-pdf",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=45
            )

            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                details += f", Content-Type: {content_type}, Size: {content_length} bytes"
                success = 'pdf' in content_type.lower() and content_length > 1000
                if not success:
                    details += " (Invalid PDF content)"
            else:
                try:
                    error = response.json()
                    details += f", Error: {error.get('detail', 'Unknown error')}"
                except:
                    details += f", Raw response: {response.text[:100]}"

            self.log_test("PDF Generation", success, details)
            return success

        except Exception as e:
            self.log_test("PDF Generation", False, f"Exception: {str(e)}")
            return False

    def test_projects_crud(self):
        """Test project CRUD operations"""
        try:
            # Test GET projects
            response = requests.get(f"{self.base_url}/api/projects", timeout=10)
            success = response.status_code == 200
            details = f"GET Status: {response.status_code}"
            
            if success:
                projects = response.json()
                details += f", Found {len(projects)} projects"
                
                # Test individual project retrieval if we have a project ID
                if self.project_id and projects:
                    # Try to find our test project or use the first one
                    test_id = self.project_id
                    for project in projects:
                        if project.get('id') == self.project_id:
                            test_id = project['id']
                            break
                    else:
                        test_id = projects[0].get('id')
                    
                    if test_id:
                        detail_response = requests.get(f"{self.base_url}/api/projects/{test_id}", timeout=10)
                        if detail_response.status_code == 200:
                            details += f", Individual project fetch: SUCCESS"
                        else:
                            details += f", Individual project fetch: FAILED ({detail_response.status_code})"
                            success = False

            self.log_test("Projects CRUD", success, details)
            return success

        except Exception as e:
            self.log_test("Projects CRUD", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🧪 BACKEND API TESTING - Prestressed Beam Design")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()

        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Basic Analysis", self.test_beam_analysis),
            ("Section Types", self.test_section_types), 
            ("Tendon Profiles", self.test_tendon_profiles),
            ("PDF Generation", self.test_pdf_generation),
            ("Projects CRUD", self.test_projects_crud),
        ]

        print("Running tests...")
        print("-" * 40)

        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
            print()

        # Summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("✅ ALL TESTS PASSED!")
            return 0
        else:
            print("❌ SOME TESTS FAILED!")
            return 1

def main():
    tester = BeamForgeAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())