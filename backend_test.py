#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class BudgetTrackerAPITester:
    def __init__(self, base_url="https://heuristic-chatelet.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_ids = {
            'categories': [],
            'transactions': [],
            'budget_goals': []
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success and response.text:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            return success, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding default categories"""
        print("\n🌱 Testing Seed Data...")
        success, response = self.run_test(
            "Seed default categories",
            "POST",
            "seed",
            200
        )
        return success

    def test_categories_crud(self):
        """Test Categories CRUD operations"""
        print("\n📂 Testing Categories CRUD...")
        
        # Test GET categories (should have seeded data)
        success, categories = self.run_test(
            "Get all categories",
            "GET", 
            "categories",
            200
        )
        
        if success and isinstance(categories, list):
            print(f"   Found {len(categories)} categories")
        
        # Test CREATE category
        test_category = {
            "name": "Test Category",
            "type": "expense",
            "color": "#FF5733"
        }
        
        success, created_cat = self.run_test(
            "Create new category",
            "POST",
            "categories",
            200,
            data=test_category
        )
        
        if success and 'id' in created_cat:
            cat_id = created_cat['id']
            self.created_ids['categories'].append(cat_id)
            
            # Test UPDATE category
            updated_data = {
                "name": "Updated Test Category",
                "type": "income",
                "color": "#33FF57"
            }
            
            success, updated_cat = self.run_test(
                "Update category",
                "PUT",
                f"categories/{cat_id}",
                200,
                data=updated_data
            )
            
            # Test DELETE category
            success, _ = self.run_test(
                "Delete category",
                "DELETE",
                f"categories/{cat_id}",
                200
            )
            
            if success:
                self.created_ids['categories'].remove(cat_id)

    def test_transactions_crud(self):
        """Test Transactions CRUD operations"""
        print("\n💰 Testing Transactions CRUD...")
        
        # First get categories to use valid category_id
        success, categories = self.run_test(
            "Get categories for transaction test",
            "GET",
            "categories", 
            200
        )
        
        if not success or not categories:
            print("   ⚠️  No categories available for transaction test")
            return
            
        category_id = categories[0]['id']
        
        # Test GET transactions
        success, transactions = self.run_test(
            "Get all transactions",
            "GET",
            "transactions",
            200
        )
        
        # Test CREATE transaction
        test_transaction = {
            "description": "Test Transaction",
            "amount": 100.50,
            "type": "expense",
            "category_id": category_id,
            "date": "2024-01-15",
            "notes": "Test notes"
        }
        
        success, created_trans = self.run_test(
            "Create new transaction",
            "POST",
            "transactions",
            200,
            data=test_transaction
        )
        
        if success and 'id' in created_trans:
            trans_id = created_trans['id']
            self.created_ids['transactions'].append(trans_id)
            
            # Test UPDATE transaction
            updated_data = {
                "description": "Updated Test Transaction",
                "amount": 200.75,
                "type": "income"
            }
            
            success, updated_trans = self.run_test(
                "Update transaction",
                "PUT",
                f"transactions/{trans_id}",
                200,
                data=updated_data
            )
            
            # Test GET with filters
            success, filtered = self.run_test(
                "Get transactions with type filter",
                "GET",
                "transactions",
                200,
                params={"type": "income"}
            )
            
            # Test DELETE transaction
            success, _ = self.run_test(
                "Delete transaction",
                "DELETE",
                f"transactions/{trans_id}",
                200
            )
            
            if success:
                self.created_ids['transactions'].remove(trans_id)

    def test_budget_goals_crud(self):
        """Test Budget Goals CRUD operations"""
        print("\n🎯 Testing Budget Goals CRUD...")
        
        # Test GET budget goals
        success, goals = self.run_test(
            "Get all budget goals",
            "GET",
            "budget-goals",
            200
        )
        
        # Test CREATE budget goal
        test_goal = {
            "name": "Test Budget Goal",
            "target_amount": 5000.00,
            "type": "expense",
            "period": "monthly",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        }
        
        success, created_goal = self.run_test(
            "Create new budget goal",
            "POST",
            "budget-goals",
            200,
            data=test_goal
        )
        
        if success and 'id' in created_goal:
            goal_id = created_goal['id']
            self.created_ids['budget_goals'].append(goal_id)
            
            # Test UPDATE budget goal
            updated_data = {
                "name": "Updated Test Goal",
                "target_amount": 7500.00,
                "type": "income"
            }
            
            success, updated_goal = self.run_test(
                "Update budget goal",
                "PUT",
                f"budget-goals/{goal_id}",
                200,
                data=updated_data
            )
            
            # Test DELETE budget goal
            success, _ = self.run_test(
                "Delete budget goal",
                "DELETE",
                f"budget-goals/{goal_id}",
                200
            )
            
            if success:
                self.created_ids['budget_goals'].remove(goal_id)

    def test_dashboard(self):
        """Test Dashboard endpoint"""
        print("\n📊 Testing Dashboard...")
        
        success, dashboard_data = self.run_test(
            "Get dashboard data",
            "GET",
            "dashboard",
            200
        )
        
        if success and isinstance(dashboard_data, dict):
            required_fields = [
                'total_income', 'total_expense', 'balance', 
                'transaction_count', 'monthly_chart', 
                'expense_by_category', 'income_by_category', 
                'recent_transactions'
            ]
            
            for field in required_fields:
                if field in dashboard_data:
                    self.log_test(f"Dashboard has {field}", True)
                else:
                    self.log_test(f"Dashboard missing {field}", False)

    def test_error_cases(self):
        """Test error handling"""
        print("\n🚨 Testing Error Cases...")
        
        # Test invalid category creation
        success, _ = self.run_test(
            "Create category without name (should fail)",
            "POST",
            "categories",
            422,
            data={"type": "expense", "color": "#FF0000"}
        )
        
        # Test invalid transaction creation
        success, _ = self.run_test(
            "Create transaction with invalid category (should fail)",
            "POST",
            "transactions",
            400,
            data={
                "description": "Test",
                "amount": 100,
                "type": "expense",
                "category_id": "invalid-id",
                "date": "2024-01-01"
            }
        )
        
        # Test non-existent resource
        success, _ = self.run_test(
            "Get non-existent category (should fail)",
            "DELETE",
            "categories/non-existent-id",
            404
        )

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Clean up transactions
        for trans_id in self.created_ids['transactions']:
            requests.delete(f"{self.api_url}/transactions/{trans_id}")
            
        # Clean up budget goals
        for goal_id in self.created_ids['budget_goals']:
            requests.delete(f"{self.api_url}/budget-goals/{goal_id}")
            
        # Clean up categories
        for cat_id in self.created_ids['categories']:
            requests.delete(f"{self.api_url}/categories/{cat_id}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Budget Tracker API Tests")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test basic connectivity
            success, _ = self.run_test(
                "API connectivity",
                "GET",
                "",
                200
            )
            
            if not success:
                print("❌ Cannot connect to API. Stopping tests.")
                return False
            
            # Run all test suites
            self.test_seed_data()
            self.test_categories_crud()
            self.test_transactions_crud()
            self.test_budget_goals_crud()
            self.test_dashboard()
            self.test_error_cases()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            return False
        finally:
            self.cleanup()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BudgetTrackerAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())