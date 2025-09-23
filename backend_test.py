#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Insurance Broker Management System
Tests all CRUD operations, data validation, and German character handling
"""

import requests
import sys
import json
from datetime import datetime, date
from typing import Dict, Any, List

class InsuranceBrokerAPITester:
    def __init__(self, base_url="https://insurance-portal-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customers = []
        self.created_contracts = []
        self.created_vus = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}

    def test_api_status(self):
        """Test basic API connectivity"""
        print("\n🔍 Testing API Status...")
        status_code, response = self.make_request('GET', '')
        success = status_code == 200 and 'message' in response
        return self.log_test("API Status Check", success, f"Status: {status_code}")

    def test_create_customer_basic(self):
        """Test basic customer creation"""
        print("\n🔍 Testing Customer Creation (Basic)...")
        customer_data = {
            "anrede": "Herr",
            "vorname": "Max",
            "name": "Mustermann",
            "strasse": "Musterstraße 123",
            "plz": "10115",
            "ort": "Berlin"
        }
        
        status_code, response = self.make_request('POST', 'kunden', customer_data)
        success = status_code == 200 and 'id' in response
        if success:
            self.created_customers.append(response['id'])
        return self.log_test("Create Customer (Basic)", success, f"Status: {status_code}")

    def test_create_customer_comprehensive(self):
        """Test comprehensive customer creation with all fields"""
        print("\n🔍 Testing Customer Creation (Comprehensive)...")
        customer_data = {
            "anrede": "Frau",
            "titel": "Dr.",
            "vorname": "Anna",
            "name": "Schmidt",
            "kunde_id": "K001",
            "strasse": "Maximilianstraße 45",
            "plz": "80539",
            "ort": "München",
            "telefon": {
                "telefon_privat": "+49 89 12345678",
                "email": "anna.schmidt@email.de",
                "mobiltelefon": "+49 170 1234567"
            },
            "persoenliche_daten": {
                "geburtsdatum": "1985-03-15",
                "familienstand": "verheiratet",
                "nationalitaet": "deutsch"
            },
            "bankverbindung": {
                "iban": "DE89370400440532013000",
                "bic": "COBADEFFXXX",
                "bank": "Commerzbank AG"
            },
            "arbeitgeber": {
                "firmenname": "Tech Solutions GmbH",
                "telefon": "+49 89 87654321"
            },
            "bemerkung": "VIP Kunde - besondere Betreuung erforderlich"
        }
        
        status_code, response = self.make_request('POST', 'kunden', customer_data)
        success = status_code == 200 and 'id' in response
        if success:
            self.created_customers.append(response['id'])
        return self.log_test("Create Customer (Comprehensive)", success, f"Status: {status_code}")

    def test_create_customer_german_chars(self):
        """Test customer creation with German special characters"""
        print("\n🔍 Testing Customer Creation (German Characters)...")
        customer_data = {
            "anrede": "Herr",
            "vorname": "Hans",
            "name": "Müller-Weiß",
            "strasse": "Königstraße 42",
            "plz": "20095",
            "ort": "Hamburg",
            "telefon": {
                "email": "hans.müller@größte-versicherung.de"
            },
            "bemerkung": "Spezielle Anforderungen für Straßenverkehr"
        }
        
        status_code, response = self.make_request('POST', 'kunden', customer_data)
        success = status_code == 200 and 'id' in response
        if success:
            self.created_customers.append(response['id'])
        return self.log_test("Create Customer (German Chars)", success, f"Status: {status_code}")

    def test_get_customers(self):
        """Test retrieving all customers"""
        print("\n🔍 Testing Get All Customers...")
        status_code, response = self.make_request('GET', 'kunden')
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Get All Customers", success, f"Status: {status_code}, Count: {len(response) if isinstance(response, list) else 0}")

    def test_get_customer_by_id(self):
        """Test retrieving customer by ID"""
        if not self.created_customers:
            return self.log_test("Get Customer by ID", False, "No customers created to test")
        
        print("\n🔍 Testing Get Customer by ID...")
        customer_id = self.created_customers[0]
        status_code, response = self.make_request('GET', f'kunden/{customer_id}')
        success = status_code == 200 and response.get('id') == customer_id
        return self.log_test("Get Customer by ID", success, f"Status: {status_code}")

    def test_search_customers_by_name(self):
        """Test customer search by name"""
        print("\n🔍 Testing Customer Search (Name)...")
        params = {"name": "Mustermann"}
        status_code, response = self.make_request('GET', 'kunden/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search Customers by Name", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_customers_by_city(self):
        """Test customer search by city"""
        print("\n🔍 Testing Customer Search (City)...")
        params = {"ort": "Berlin"}
        status_code, response = self.make_request('GET', 'kunden/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search Customers by City", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_customers_by_plz(self):
        """Test customer search by postal code"""
        print("\n🔍 Testing Customer Search (PLZ)...")
        params = {"plz": "80539"}
        status_code, response = self.make_request('GET', 'kunden/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search Customers by PLZ", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_customers_empty(self):
        """Test customer search with no parameters"""
        print("\n🔍 Testing Customer Search (Empty)...")
        status_code, response = self.make_request('GET', 'kunden/search')
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search Customers (Empty)", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_vu_sample_data_init(self):
        """Test VU sample data initialization"""
        print("\n🔍 Testing VU Sample Data Initialization...")
        status_code, response = self.make_request('POST', 'vus/init-sample-data')
        success = status_code == 200 and 'message' in response
        details = f"Status: {status_code}"
        if success and 'vus' in response:
            details += f", Created: {len(response['vus'])} VUs"
        return self.log_test("VU Sample Data Init", success, details)

    def test_create_vu_with_status(self):
        """Test VU creation with VU status"""
        print("\n🔍 Testing VU Creation (VU Status)...")
        vu_data = {
            "name": "Test Versicherung AG",
            "kurzbezeichnung": "TEST",
            "status": "VU",
            "strasse": "Teststraße 1",
            "plz": "12345",
            "ort": "Teststadt",
            "telefon": "+49 123 456789",
            "email_zentrale": "info@test.de",
            "ansprechpartner": "Herr Test"
        }
        
        status_code, response = self.make_request('POST', 'vus', vu_data)
        success = status_code == 200 and 'id' in response and response.get('status') == 'VU'
        if success:
            self.created_vus.append(response['id'])
        return self.log_test("Create VU (VU Status)", success, f"Status: {status_code}")

    def test_create_vu_with_pool_status(self):
        """Test VU creation with Pool status"""
        print("\n🔍 Testing VU Creation (Pool Status)...")
        vu_data = {
            "name": "Test Pool Versicherung",
            "kurzbezeichnung": "POOL",
            "status": "Pool",
            "strasse": "Poolstraße 1",
            "plz": "54321",
            "ort": "Poolstadt",
            "telefon": "+49 987 654321",
            "email_zentrale": "info@pool.de",
            "ansprechpartner": "Frau Pool"
        }
        
        status_code, response = self.make_request('POST', 'vus', vu_data)
        success = status_code == 200 and 'id' in response and response.get('status') == 'Pool'
        if success:
            self.created_vus.append(response['id'])
        return self.log_test("Create VU (Pool Status)", success, f"Status: {status_code}")

    def test_get_vus(self):
        """Test retrieving all VUs"""
        print("\n🔍 Testing Get All VUs...")
        status_code, response = self.make_request('GET', 'vus')
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Get All VUs", success, f"Status: {status_code}, Count: {len(response) if isinstance(response, list) else 0}")

    def test_get_vu_by_id(self):
        """Test retrieving VU by ID"""
        if not self.created_vus:
            return self.log_test("Get VU by ID", False, "No VUs created to test")
        
        print("\n🔍 Testing Get VU by ID...")
        vu_id = self.created_vus[0]
        status_code, response = self.make_request('GET', f'vus/{vu_id}')
        success = status_code == 200 and response.get('id') == vu_id
        return self.log_test("Get VU by ID", success, f"Status: {status_code}")

    def test_update_vu(self):
        """Test VU update"""
        if not self.created_vus:
            return self.log_test("Update VU", False, "No VUs created to test")
        
        print("\n🔍 Testing VU Update...")
        vu_id = self.created_vus[0]
        update_data = {
            "name": "Updated Test Versicherung AG",
            "telefon": "+49 123 999888",
            "bemerkung": "Updated via API test"
        }
        
        status_code, response = self.make_request('PUT', f'vus/{vu_id}', update_data)
        success = status_code == 200 and response.get('name') == update_data['name']
        return self.log_test("Update VU", success, f"Status: {status_code}")

    def test_delete_vu(self):
        """Test VU deletion"""
        if not self.created_vus:
            return self.log_test("Delete VU", False, "No VUs created to test")
        
        print("\n🔍 Testing VU Deletion...")
        vu_id = self.created_vus[-1]  # Delete the last created VU
        status_code, response = self.make_request('DELETE', f'vus/{vu_id}')
        success = status_code == 200 and 'message' in response
        if success:
            self.created_vus.remove(vu_id)
        return self.log_test("Delete VU", success, f"Status: {status_code}")

    def test_search_vus_by_name(self):
        """Test VU search by name"""
        print("\n🔍 Testing VU Search (Name)...")
        params = {"name": "Allianz"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Name", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_by_kurzbezeichnung(self):
        """Test VU search by kurzbezeichnung"""
        print("\n🔍 Testing VU Search (Kurzbezeichnung)...")
        params = {"kurzbezeichnung": "Alte"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Kurzbezeichnung", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_by_status(self):
        """Test VU search by status"""
        print("\n🔍 Testing VU Search (Status VU)...")
        params = {"status": "VU"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Status (VU)", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_by_ort(self):
        """Test VU search by ort"""
        print("\n🔍 Testing VU Search (Ort)...")
        params = {"ort": "München"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Ort", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_by_telefon(self):
        """Test VU search by telefon"""
        print("\n🔍 Testing VU Search (Telefon)...")
        params = {"telefon": "089"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Telefon", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_by_email(self):
        """Test VU search by email"""
        print("\n🔍 Testing VU Search (Email)...")
        params = {"email": "allianz"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs by Email", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_search_vus_multiple_filters(self):
        """Test VU search with multiple filters"""
        print("\n🔍 Testing VU Search (Multiple Filters)...")
        params = {"status": "VU", "ort": "München"}
        status_code, response = self.make_request('GET', 'vus/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search VUs (Multiple Filters)", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_vu_status_enum_validation(self):
        """Test VU status enum validation"""
        print("\n🔍 Testing VU Status Enum Validation...")
        invalid_vu = {
            "name": "Invalid Status VU",
            "status": "InvalidStatus"  # Should fail validation
        }
        
        status_code, response = self.make_request('POST', 'vus', invalid_vu)
        success = status_code == 422  # Validation error expected
        return self.log_test("VU Status Enum Validation", success, f"Status: {status_code}")

    def test_verify_sample_data_content(self):
        """Test that sample data contains expected VUs"""
        print("\n🔍 Testing Sample Data Content Verification...")
        status_code, response = self.make_request('GET', 'vus')
        
        if status_code != 200 or not isinstance(response, list):
            return self.log_test("Verify Sample Data Content", False, f"Failed to get VUs: {status_code}")
        
        expected_vus = ["Allianz", "Alte Leipziger", "Dialog", "Itzehoer"]
        found_vus = []
        
        for vu in response:
            vu_name = vu.get('name', '')
            for expected in expected_vus:
                if expected.lower() in vu_name.lower():
                    found_vus.append(expected)
                    break
        
        success = len(found_vus) >= 4  # Should find all 4 expected VUs
        details = f"Status: {status_code}, Found: {found_vus}"
        return self.log_test("Verify Sample Data Content", success, details)

    def test_create_contract(self):
        """Test contract creation"""
        if not self.created_customers or not self.created_vus:
            return self.log_test("Create Contract", False, "No customers or VUs created to test")
        
        print("\n🔍 Testing Contract Creation...")
        contract_data = {
            "vertragsnummer": "V2024001",
            "interne_vertragsnummer": "INT001",
            "kunde_id": self.created_customers[0],
            "vu_id": self.created_vus[0],
            "gesellschaft": "Alte Leipziger",
            "kfz_kennzeichen": "M-AB 1234",
            "produkt_sparte": "KFZ-Versicherung",
            "tarif": "Vollkasko Premium",
            "zahlungsweise": "jährlich",
            "beitrag_brutto": 1200.50,
            "beitrag_netto": 1008.40,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01",
            "ablauf": "2024-12-31"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = status_code == 200 and 'id' in response
        if success:
            self.created_contracts.append(response['id'])
        return self.log_test("Create Contract", success, f"Status: {status_code}")

    def test_get_contracts(self):
        """Test retrieving all contracts"""
        print("\n🔍 Testing Get All Contracts...")
        status_code, response = self.make_request('GET', 'vertraege')
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Get All Contracts", success, f"Status: {status_code}, Count: {len(response) if isinstance(response, list) else 0}")

    def test_search_by_kfz_kennzeichen(self):
        """Test customer search by KFZ license plate"""
        print("\n🔍 Testing Customer Search by KFZ-Kennzeichen...")
        params = {"kfz_kennzeichen": "M-AB"}
        status_code, response = self.make_request('GET', 'kunden/search', params=params)
        success = status_code == 200 and isinstance(response, list)
        return self.log_test("Search by KFZ-Kennzeichen", success, f"Status: {status_code}, Results: {len(response) if isinstance(response, list) else 0}")

    def test_data_validation_errors(self):
        """Test data validation and error handling"""
        print("\n🔍 Testing Data Validation...")
        
        # Test invalid enum value
        invalid_customer = {
            "anrede": "InvalidAnrede",  # Should fail validation
            "name": "Test"
        }
        
        status_code, response = self.make_request('POST', 'kunden', invalid_customer)
        success = status_code == 422  # Validation error expected
        return self.log_test("Data Validation (Invalid Enum)", success, f"Status: {status_code}")

    def test_nonexistent_customer(self):
        """Test retrieving non-existent customer"""
        print("\n🔍 Testing Non-existent Customer...")
        fake_id = "00000000-0000-0000-0000-000000000000"
        status_code, response = self.make_request('GET', f'kunden/{fake_id}')
        success = status_code == 404
        return self.log_test("Get Non-existent Customer", success, f"Status: {status_code}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Insurance Broker Management System API Tests")
        print("=" * 60)
        
        # Basic connectivity
        self.test_api_status()
        
        # Customer tests
        self.test_create_customer_basic()
        self.test_create_customer_comprehensive()
        self.test_create_customer_german_chars()
        self.test_get_customers()
        self.test_get_customer_by_id()
        
        # Search tests
        self.test_search_customers_by_name()
        self.test_search_customers_by_city()
        self.test_search_customers_by_plz()
        self.test_search_customers_empty()
        
        # VU tests - comprehensive testing
        self.test_vu_sample_data_init()
        self.test_verify_sample_data_content()
        self.test_create_vu_with_status()
        self.test_create_vu_with_pool_status()
        self.test_get_vus()
        self.test_get_vu_by_id()
        self.test_update_vu()
        
        # VU search tests
        self.test_search_vus_by_name()
        self.test_search_vus_by_kurzbezeichnung()
        self.test_search_vus_by_status()
        self.test_search_vus_by_ort()
        self.test_search_vus_by_telefon()
        self.test_search_vus_by_email()
        self.test_search_vus_multiple_filters()
        
        # VU validation tests
        self.test_vu_status_enum_validation()
        
        # VU deletion test (at the end)
        self.test_delete_vu()
        
        # Contract tests
        self.test_create_contract()
        self.test_get_contracts()
        self.test_search_by_kfz_kennzeichen()
        
        # Error handling tests
        self.test_data_validation_errors()
        self.test_nonexistent_customer()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = InsuranceBrokerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())