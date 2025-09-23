#!/usr/bin/env python3
"""
Test only the NEW VU Auto-Assignment Features
"""

import requests
import sys
import json

class VUAssignmentTester:
    def __init__(self, base_url="https://insurance-portal-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: any = None, params: dict = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}

    def test_vu_internal_id_system(self):
        """Test VU Internal ID System"""
        print("\n🎯 Testing VU Internal ID System...")
        
        # Test 1: Check sample VUs have internal IDs
        status_code, response = self.make_request('GET', 'vus')
        if status_code != 200:
            return self.log_test("VU Internal ID System", False, f"Failed to get VUs: {status_code}")
        
        expected_internal_ids = ["VU-001", "VU-002", "VU-003", "VU-004"]
        found_internal_ids = []
        
        for vu in response:
            internal_id = vu.get('vu_internal_id')
            if internal_id and internal_id in expected_internal_ids:
                found_internal_ids.append(internal_id)
        
        success = len(found_internal_ids) >= 4
        details = f"Found Internal IDs: {found_internal_ids}"
        return self.log_test("VU Internal ID System", success, details)

    def test_vu_matching_logic(self):
        """Test VU Matching Logic"""
        print("\n🎯 Testing VU Matching Logic...")
        
        test_cases = [
            ("Allianz Versicherung AG", "exact_name", "Exact name matching"),
            ("Allianz", "kurzbezeichnung", "Kurzbezeichnung matching"),
            ("Dialog", "kurzbezeichnung", "Partial name matching"),
            ("Alte Leipziger Versicherungsgruppe", "reverse_kurz", "Reverse partial matching"),
            ("Nicht Existierende Versicherung", None, "No match case")
        ]
        
        passed_tests = 0
        
        for gesellschaft, expected_type, description in test_cases:
            params = {"gesellschaft": gesellschaft}
            status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
            
            if expected_type is None:
                # Expecting no match
                success = (status_code == 200 and response.get('match') == False)
            else:
                # Expecting a match
                success = (status_code == 200 and response.get('match') == True and 
                          response.get('match_type') == expected_type)
            
            if success:
                passed_tests += 1
                print(f"  ✅ {description}: {gesellschaft} -> {response.get('match_type', 'No match')}")
            else:
                print(f"  ❌ {description}: {gesellschaft} -> Expected: {expected_type}, Got: {response.get('match_type')}")
        
        success = passed_tests == len(test_cases)
        return self.log_test("VU Matching Logic", success, f"{passed_tests}/{len(test_cases)} test cases passed")

    def test_contract_auto_assignment(self):
        """Test Contract Auto VU Assignment"""
        print("\n🎯 Testing Contract Auto VU Assignment...")
        
        # Create a test customer first
        customer_data = {
            "anrede": "Herr",
            "vorname": "Test",
            "name": "AutoAssignment",
            "strasse": "Teststraße 1",
            "plz": "12345",
            "ort": "Teststadt"
        }
        
        status_code, customer_response = self.make_request('POST', 'kunden', customer_data)
        if status_code != 200:
            return self.log_test("Contract Auto VU Assignment", False, f"Failed to create customer: {status_code}")
        
        kunde_id = customer_response['id']
        
        # Test auto-assignment with different gesellschaften
        test_cases = [
            ("Allianz", "VU-001"),
            ("Dialog AG", "VU-003"),
            ("Alte Leipziger", "VU-002")
        ]
        
        passed_tests = 0
        
        for gesellschaft, expected_internal_id in test_cases:
            contract_data = {
                "vertragsnummer": f"AUTO-{gesellschaft}-001",
                "kunde_id": kunde_id,
                "gesellschaft": gesellschaft,
                "produkt_sparte": "Test Versicherung",
                "beitrag_brutto": 1000.00,
                "vertragsstatus": "aktiv",
                "beginn": "2024-01-01"
            }
            
            status_code, contract_response = self.make_request('POST', 'vertraege', contract_data)
            
            if (status_code == 200 and 
                contract_response.get('vu_internal_id') == expected_internal_id):
                passed_tests += 1
                print(f"  ✅ {gesellschaft} -> {contract_response.get('vu_internal_id')}")
            else:
                print(f"  ❌ {gesellschaft} -> Expected: {expected_internal_id}, Got: {contract_response.get('vu_internal_id')}")
        
        success = passed_tests == len(test_cases)
        return self.log_test("Contract Auto VU Assignment", success, f"{passed_tests}/{len(test_cases)} assignments worked")

    def test_migration_api(self):
        """Test Contract Migration API"""
        print("\n🎯 Testing Contract Migration API...")
        
        status_code, response = self.make_request('POST', 'vertraege/migrate-vu-assignments')
        success = (status_code == 200 and 'total_contracts' in response and 
                  'matched' in response and 'unmatched' in response)
        
        if success:
            details = (f"Total: {response.get('total_contracts')}, "
                      f"Matched: {response.get('matched')}, "
                      f"Unmatched: {response.get('unmatched')}")
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("Contract Migration API", success, details)

    def test_statistics_api(self):
        """Test VU Statistics API"""
        print("\n🎯 Testing VU Statistics API...")
        
        status_code, response = self.make_request('GET', 'vertraege/vu-statistics')
        success = (status_code == 200 and 'total_contracts' in response and 
                  'contracts_with_vu' in response and 'assignment_percentage' in response)
        
        if success:
            details = (f"Total: {response.get('total_contracts')}, "
                      f"With VU: {response.get('contracts_with_vu')}, "
                      f"Percentage: {response.get('assignment_percentage')}%")
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("VU Statistics API", success, details)

    def run_all_tests(self):
        """Run all VU auto-assignment tests"""
        print("🚀 Testing NEW VU Auto-Assignment Features")
        print("=" * 60)
        
        self.test_vu_internal_id_system()
        self.test_vu_matching_logic()
        self.test_contract_auto_assignment()
        self.test_migration_api()
        self.test_statistics_api()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 VU Auto-Assignment Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All VU auto-assignment features working perfectly!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = VUAssignmentTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())