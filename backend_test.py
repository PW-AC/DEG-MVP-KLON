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
    def __init__(self, base_url="https://maklerportal-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customers = []
        self.created_contracts = []
        self.created_vus = []
        self.created_documents = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: any = None, params: Dict = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                # Handle string data for JSON requests
                if isinstance(data, str):
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
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

    def test_create_customer_frontend_payload(self):
        """Test customer creation with exact frontend payload structure"""
        print("\n🔍 Testing Customer Creation (Frontend Payload)...")
        
        # This is the exact payload that frontend sends
        frontend_payload = {
            "anrede": "",
            "titel": "",
            "vorname": "Test",
            "name": "Customer",
            "kunde_id": "",
            "strasse": "Test Str",
            "plz": "12345",
            "ort": "Test City",
            "telefon": { "telefon_privat": "123456", "email": "test@test.com" },
            "persoenliche_daten": { "geburtsdatum": "1990-01-01" },
            "bemerkung": "Test"
        }
        
        status_code, response = self.make_request('POST', 'kunden', frontend_payload)
        
        # Log detailed response for analysis
        print(f"   📋 Frontend Payload Test Details:")
        print(f"   📋 Status Code: {status_code}")
        print(f"   📋 Response: {response}")
        
        if status_code == 422:
            print(f"   ❌ Validation Error (HTTP 422) - Backend expects different structure")
            print(f"   📋 Error Details: {response}")
            
            # Analyze validation errors
            if 'detail' in response and isinstance(response['detail'], list):
                print(f"   📋 Validation Issues Found:")
                for error in response['detail']:
                    field_path = ' -> '.join(str(loc) for loc in error.get('loc', []))
                    error_msg = error.get('msg', 'Unknown error')
                    input_value = error.get('input', 'N/A')
                    print(f"      🔸 Field: {field_path}")
                    print(f"      🔸 Error: {error_msg}")
                    print(f"      🔸 Input: {input_value}")
                    print(f"      🔸 ---")
            
            success = False
            details = f"Status: {status_code} - VALIDATION ERROR. Backend structure mismatch with frontend payload."
        elif status_code == 200 and 'id' in response:
            print(f"   ✅ Customer created successfully with frontend payload")
            self.created_customers.append(response['id'])
            success = True
            details = f"Status: {status_code} - SUCCESS. Frontend payload compatible with backend."
        else:
            print(f"   ❓ Unexpected response")
            success = False
            details = f"Status: {status_code} - UNEXPECTED RESPONSE"
        
        return self.log_test("Create Customer (Frontend Payload)", success, details)

    def test_create_customer_frontend_payload_fixed(self):
        """Test customer creation with frontend payload but with fixed validation issues"""
        print("\n🔍 Testing Customer Creation (Frontend Payload Fixed)...")
        
        # Frontend payload with validation issues fixed
        frontend_payload_fixed = {
            "anrede": "Herr",  # Fixed: was empty string, now valid enum value
            "titel": "",
            "vorname": "Test",
            "name": "Customer",
            "kunde_id": "",
            "strasse": "Test Str",
            "plz": "12345",
            "ort": "Test City",
            "telefon": { "telefon_privat": "123456", "email": "test@test.com" },
            "persoenliche_daten": { "geburtsdatum": "1990-01-01" },
            "bemerkung": "Test"
        }
        
        status_code, response = self.make_request('POST', 'kunden', frontend_payload_fixed)
        
        print(f"   📋 Fixed Frontend Payload Test Details:")
        print(f"   📋 Status Code: {status_code}")
        
        if status_code == 200 and 'id' in response:
            print(f"   ✅ Customer created successfully with fixed frontend payload")
            self.created_customers.append(response['id'])
            success = True
            details = f"Status: {status_code} - SUCCESS. Fixed frontend payload works with backend."
        elif status_code == 422:
            print(f"   ❌ Still validation errors with fixed payload")
            print(f"   📋 Error Details: {response}")
            success = False
            details = f"Status: {status_code} - STILL VALIDATION ERRORS after fix."
        else:
            print(f"   ❓ Unexpected response")
            success = False
            details = f"Status: {status_code} - UNEXPECTED RESPONSE"
        
        return self.log_test("Create Customer (Frontend Payload Fixed)", success, details)

    def test_create_customer_frontend_payload_null_anrede(self):
        """Test customer creation with frontend payload using null for anrede"""
        print("\n🔍 Testing Customer Creation (Frontend Payload with null anrede)...")
        
        # Frontend payload with null anrede (might be more appropriate than empty string)
        frontend_payload_null = {
            "anrede": None,  # Using null instead of empty string
            "titel": "",
            "vorname": "Test",
            "name": "Customer",
            "kunde_id": "",
            "strasse": "Test Str",
            "plz": "12345",
            "ort": "Test City",
            "telefon": { "telefon_privat": "123456", "email": "test@test.com" },
            "persoenliche_daten": { "geburtsdatum": "1990-01-01" },
            "bemerkung": "Test"
        }
        
        status_code, response = self.make_request('POST', 'kunden', frontend_payload_null)
        
        print(f"   📋 Null Anrede Frontend Payload Test Details:")
        print(f"   📋 Status Code: {status_code}")
        
        if status_code == 200 and 'id' in response:
            print(f"   ✅ Customer created successfully with null anrede")
            self.created_customers.append(response['id'])
            success = True
            details = f"Status: {status_code} - SUCCESS. Null anrede works with backend."
        elif status_code == 422:
            print(f"   ❌ Validation errors with null anrede")
            print(f"   📋 Error Details: {response}")
            success = False
            details = f"Status: {status_code} - VALIDATION ERROR with null anrede."
        else:
            print(f"   ❓ Unexpected response")
            success = False
            details = f"Status: {status_code} - UNEXPECTED RESPONSE"
        
        return self.log_test("Create Customer (Frontend Payload with null anrede)", success, details)

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

    def test_vu_internal_id_generation(self):
        """Test VU creation with automatic internal ID generation"""
        print("\n🔍 Testing VU Internal ID Generation...")
        vu_data = {
            "name": "Test VU für Internal ID",
            "kurzbezeichnung": "TESTID",
            "status": "VU"
        }
        
        status_code, response = self.make_request('POST', 'vus', vu_data)
        success = (status_code == 200 and 'id' in response and 
                  'vu_internal_id' in response and 
                  response['vu_internal_id'].startswith('VU-'))
        
        if success:
            self.created_vus.append(response['id'])
            details = f"Status: {status_code}, Internal ID: {response.get('vu_internal_id')}"
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("VU Internal ID Generation", success, details)

    def test_vu_matching_exact_name(self):
        """Test VU matching with exact gesellschaft name"""
        print("\n🔍 Testing VU Matching (Exact Name)...")
        
        # Test with Allianz (should match exactly)
        gesellschaft_data = "Allianz Versicherung AG"
        params = {"gesellschaft": gesellschaft_data}
        status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
        
        success = (status_code == 200 and response.get('match') == True and 
                  'vu' in response and response.get('match_type') == 'exact_name')
        
        details = f"Status: {status_code}, Match: {response.get('match')}, Type: {response.get('match_type')}"
        return self.log_test("VU Matching (Exact Name)", success, details)

    def test_vu_matching_kurzbezeichnung(self):
        """Test VU matching with kurzbezeichnung"""
        print("\n🔍 Testing VU Matching (Kurzbezeichnung)...")
        
        # Test with "Allianz" kurzbezeichnung
        gesellschaft_data = "Allianz"
        params = {"gesellschaft": gesellschaft_data}
        status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
        
        success = (status_code == 200 and response.get('match') == True and 
                  'vu' in response and response.get('match_type') == 'kurzbezeichnung')
        
        details = f"Status: {status_code}, Match: {response.get('match')}, Type: {response.get('match_type')}"
        return self.log_test("VU Matching (Kurzbezeichnung)", success, details)

    def test_vu_matching_partial_name(self):
        """Test VU matching with partial name"""
        print("\n🔍 Testing VU Matching (Partial Name)...")
        
        # Test with "Dialog" (should match Dialog Versicherung AG)
        gesellschaft_data = "Dialog"
        params = {"gesellschaft": gesellschaft_data}
        status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
        
        success = (status_code == 200 and response.get('match') == True and 
                  'vu' in response and response.get('match_type') in ['kurzbezeichnung', 'partial_name'])
        
        details = f"Status: {status_code}, Match: {response.get('match')}, Type: {response.get('match_type')}"
        return self.log_test("VU Matching (Partial Name)", success, details)

    def test_vu_matching_reverse_partial(self):
        """Test VU matching with reverse partial matching"""
        print("\n🔍 Testing VU Matching (Reverse Partial)...")
        
        # Test with "Alte Leipziger Versicherungsgruppe" (should match "Alte Leipziger")
        gesellschaft_data = "Alte Leipziger Versicherungsgruppe"
        params = {"gesellschaft": gesellschaft_data}
        status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
        
        success = (status_code == 200 and response.get('match') == True and 
                  'vu' in response and response.get('match_type') in ['reverse_kurz', 'reverse_partial'])
        
        details = f"Status: {status_code}, Match: {response.get('match')}, Type: {response.get('match_type')}"
        return self.log_test("VU Matching (Reverse Partial)", success, details)

    def test_vu_matching_no_match(self):
        """Test VU matching with no match found"""
        print("\n🔍 Testing VU Matching (No Match)...")
        
        # Test with non-existent gesellschaft
        gesellschaft_data = "Nicht Existierende Versicherung"
        params = {"gesellschaft": gesellschaft_data}
        status_code, response = self.make_request('POST', 'vus/match-gesellschaft', params=params)
        
        success = (status_code == 200 and response.get('match') == False and 
                  response.get('vu') is None)
        
        details = f"Status: {status_code}, Match: {response.get('match')}"
        return self.log_test("VU Matching (No Match)", success, details)

    def test_contract_auto_vu_assignment(self):
        """Test automatic VU assignment during contract creation"""
        if not self.created_customers:
            return self.log_test("Contract Auto VU Assignment", False, "No customers created to test")
        
        print("\n🔍 Testing Contract Auto VU Assignment...")
        contract_data = {
            "vertragsnummer": "V2024AUTO001",
            "kunde_id": self.created_customers[0],
            "gesellschaft": "Allianz",  # Should auto-assign to Allianz VU
            "kfz_kennzeichen": "M-AUTO 123",
            "produkt_sparte": "KFZ-Versicherung",
            "beitrag_brutto": 800.00,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = (status_code == 200 and 'id' in response and 
                  'vu_internal_id' in response and response['vu_internal_id'] is not None)
        
        if success:
            self.created_contracts.append(response['id'])
            details = f"Status: {status_code}, VU Internal ID: {response.get('vu_internal_id')}"
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("Contract Auto VU Assignment", success, details)

    def test_contract_creation_dialog_ag(self):
        """Test contract creation with Dialog AG gesellschaft"""
        if not self.created_customers:
            return self.log_test("Contract Creation (Dialog AG)", False, "No customers created to test")
        
        print("\n🔍 Testing Contract Creation (Dialog AG)...")
        contract_data = {
            "vertragsnummer": "V2024DIALOG001",
            "kunde_id": self.created_customers[0],
            "gesellschaft": "Dialog AG",  # Should match Dialog VU
            "produkt_sparte": "Lebensversicherung",
            "beitrag_brutto": 1500.00,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = (status_code == 200 and 'id' in response and 
                  'vu_internal_id' in response and response['vu_internal_id'] is not None)
        
        if success:
            self.created_contracts.append(response['id'])
            details = f"Status: {status_code}, VU Internal ID: {response.get('vu_internal_id')}"
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("Contract Creation (Dialog AG)", success, details)

    def test_contract_migration_api(self):
        """Test contract migration API for VU assignments"""
        print("\n🔍 Testing Contract Migration API...")
        
        status_code, response = self.make_request('POST', 'vertraege/migrate-vu-assignments')
        success = (status_code == 200 and 'total_contracts' in response and 
                  'matched' in response and 'unmatched' in response)
        
        if success:
            details = (f"Status: {status_code}, Total: {response.get('total_contracts')}, "
                      f"Matched: {response.get('matched')}, Unmatched: {response.get('unmatched')}")
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("Contract Migration API", success, details)

    def test_vu_statistics_api(self):
        """Test VU statistics API"""
        print("\n🔍 Testing VU Statistics API...")
        
        status_code, response = self.make_request('GET', 'vertraege/vu-statistics')
        success = (status_code == 200 and 'total_contracts' in response and 
                  'contracts_with_vu' in response and 'assignment_percentage' in response)
        
        if success:
            details = (f"Status: {status_code}, Total: {response.get('total_contracts')}, "
                      f"With VU: {response.get('contracts_with_vu')}, "
                      f"Percentage: {response.get('assignment_percentage')}%")
        else:
            details = f"Status: {status_code}"
        
        return self.log_test("VU Statistics API", success, details)

    def test_sample_vus_internal_ids(self):
        """Test that sample VUs have proper internal IDs"""
        print("\n🔍 Testing Sample VUs Internal IDs...")
        
        status_code, response = self.make_request('GET', 'vus')
        if status_code != 200 or not isinstance(response, list):
            return self.log_test("Sample VUs Internal IDs", False, f"Failed to get VUs: {status_code}")
        
        expected_internal_ids = ["VU-001", "VU-002", "VU-003", "VU-004"]
        found_internal_ids = []
        
        for vu in response:
            internal_id = vu.get('vu_internal_id')
            if internal_id and internal_id in expected_internal_ids:
                found_internal_ids.append(internal_id)
        
        success = len(found_internal_ids) >= 4
        details = f"Status: {status_code}, Found Internal IDs: {found_internal_ids}"
        return self.log_test("Sample VUs Internal IDs", success, details)

    def test_contract_creation_allianz_vu_assignment(self):
        """Test contract creation with Allianz gesellschaft - should auto-assign VU-001"""
        if not self.created_customers:
            return self.log_test("Contract Creation (Allianz VU Assignment)", False, "No customers created to test")
        
        print("\n🔍 Testing Contract Creation with Allianz VU Assignment...")
        contract_data = {
            "vertragsnummer": "V2024ALLIANZ001",
            "kunde_id": self.created_customers[0],
            "gesellschaft": "Allianz",  # Should auto-assign to VU-001
            "kfz_kennzeichen": "M-ALZ 123",
            "produkt_sparte": "KFZ-Versicherung",
            "tarif": "Vollkasko",
            "zahlungsweise": "monatlich",
            "beitrag_brutto": 950.00,
            "beitrag_netto": 798.32,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01",
            "ablauf": "2024-12-31"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = (status_code == 200 and 'id' in response and 
                  'vu_internal_id' in response and response['vu_internal_id'] == 'VU-001')
        
        if success:
            self.created_contracts.append(response['id'])
            details = f"Status: {status_code}, VU Internal ID: {response.get('vu_internal_id')}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Contract Creation (Allianz VU Assignment)", success, details)

    def test_contract_creation_dialog_vu_assignment(self):
        """Test contract creation with Dialog gesellschaft - should auto-assign VU-003"""
        if not self.created_customers:
            return self.log_test("Contract Creation (Dialog VU Assignment)", False, "No customers created to test")
        
        print("\n🔍 Testing Contract Creation with Dialog VU Assignment...")
        contract_data = {
            "vertragsnummer": "V2024DIALOG002",
            "kunde_id": self.created_customers[0],
            "gesellschaft": "Dialog",  # Should auto-assign to VU-003
            "produkt_sparte": "Lebensversicherung",
            "tarif": "Premium Life",
            "zahlungsweise": "jährlich",
            "beitrag_brutto": 2400.00,
            "beitrag_netto": 2016.81,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01",
            "ablauf": "2044-12-31"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = (status_code == 200 and 'id' in response and 
                  'vu_internal_id' in response and response['vu_internal_id'] == 'VU-003')
        
        if success:
            self.created_contracts.append(response['id'])
            details = f"Status: {status_code}, VU Internal ID: {response.get('vu_internal_id')}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Contract Creation (Dialog VU Assignment)", success, details)

    def test_contract_creation_unknown_company_no_vu(self):
        """Test contract creation with unknown gesellschaft - should create without VU assignment"""
        if not self.created_customers:
            return self.log_test("Contract Creation (Unknown Company)", False, "No customers created to test")
        
        print("\n🔍 Testing Contract Creation with Unknown Company...")
        contract_data = {
            "vertragsnummer": "V2024UNKNOWN001",
            "kunde_id": self.created_customers[0],
            "gesellschaft": "Completely Unknown Insurance XYZ Corp",  # Should not match any VU
            "produkt_sparte": "Hausratversicherung",
            "tarif": "Standard",
            "zahlungsweise": "halbjährlich",
            "beitrag_brutto": 180.00,
            "beitrag_netto": 151.26,
            "vertragsstatus": "aktiv",
            "beginn": "2024-01-01",
            "ablauf": "2024-12-31"
        }
        
        status_code, response = self.make_request('POST', 'vertraege', contract_data)
        success = (status_code == 200 and 'id' in response and 
                  (response.get('vu_internal_id') is None or response.get('vu_internal_id') == ""))
        
        if success:
            self.created_contracts.append(response['id'])
            details = f"Status: {status_code}, No VU assigned (as expected)"
        else:
            details = f"Status: {status_code}, Unexpected VU assignment: {response.get('vu_internal_id')}"
        
        return self.log_test("Contract Creation (Unknown Company)", success, details)

    def test_document_upload_to_contract(self):
        """Test uploading document to specific contract"""
        if not self.created_contracts:
            return self.log_test("Document Upload to Contract", False, "No contracts created to test")
        
        print("\n🔍 Testing Document Upload to Contract...")
        contract_id = self.created_contracts[0]
        
        # Create base64 encoded test PDF content
        test_pdf_content = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNC0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0K"
        
        document_data = {
            "vertrag_id": contract_id,
            "title": "Versicherungsschein Allianz KFZ",
            "filename": "versicherungsschein_allianz.pdf",
            "document_type": "pdf",
            "description": "Hauptversicherungsschein für KFZ-Versicherung",
            "tags": ["versicherungsschein", "kfz", "allianz"],
            "file_content": test_pdf_content
        }
        
        status_code, response = self.make_request('POST', 'documents', document_data)
        success = (status_code == 200 and 'id' in response and 
                  response.get('vertrag_id') == contract_id)
        
        if success:
            self.created_documents.append(response['id'])
            details = f"Status: {status_code}, Document ID: {response.get('id')}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Document Upload to Contract", success, details)

    def test_document_upload_via_upload_endpoint(self):
        """Test document upload via /documents/upload endpoint with vertrag_id"""
        if not self.created_contracts:
            return self.log_test("Document Upload via Upload Endpoint", False, "No contracts created to test")
        
        print("\n🔍 Testing Document Upload via Upload Endpoint...")
        contract_id = self.created_contracts[0]
        
        # Test data for upload endpoint (using form parameters)
        params = {
            "vertrag_id": contract_id,
            "title": "Schadensmeldung Dialog",
            "description": "Schadensmeldung für Lebensversicherung",
            "tags": "schadensmeldung,lebensversicherung,dialog",
            "file_content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
        
        status_code, response = self.make_request('POST', 'documents/upload', params=params)
        success = (status_code == 200 and 'id' in response and 
                  response.get('vertrag_id') == contract_id)
        
        if success:
            self.created_documents.append(response['id'])
            details = f"Status: {status_code}, Document ID: {response.get('id')}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Document Upload via Upload Endpoint", success, details)

    def test_retrieve_contract_documents(self):
        """Test retrieving documents filtered by vertrag_id"""
        if not self.created_contracts:
            return self.log_test("Retrieve Contract Documents", False, "No contracts created to test")
        
        print("\n🔍 Testing Retrieve Contract Documents...")
        contract_id = self.created_contracts[0]
        
        params = {"vertrag_id": contract_id}
        status_code, response = self.make_request('GET', 'documents', params=params)
        
        success = (status_code == 200 and isinstance(response, list))
        
        if success:
            # Verify all returned documents belong to the contract
            all_belong_to_contract = all(doc.get('vertrag_id') == contract_id for doc in response)
            success = success and all_belong_to_contract
            details = f"Status: {status_code}, Documents found: {len(response)}, All belong to contract: {all_belong_to_contract}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Retrieve Contract Documents", success, details)

    def test_document_types_with_contract(self):
        """Test uploading different document types to contracts"""
        if not self.created_contracts:
            return self.log_test("Document Types with Contract", False, "No contracts created to test")
        
        print("\n🔍 Testing Different Document Types with Contract...")
        contract_id = self.created_contracts[-1] if len(self.created_contracts) > 1 else self.created_contracts[0]
        
        # Test different document types
        document_types = [
            {
                "type": "pdf",
                "title": "Vertragsbedingungen PDF",
                "filename": "bedingungen.pdf",
                "content": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK"
            },
            {
                "type": "word",
                "title": "Antrag Word Dokument",
                "filename": "antrag.docx",
                "content": "UEsDBBQAAAAIAAgACAA="
            },
            {
                "type": "excel",
                "title": "Beitragstabelle Excel",
                "filename": "beitraege.xlsx",
                "content": "UEsDBBQAAAAIAAgACAB="
            }
        ]
        
        successful_uploads = 0
        total_types = len(document_types)
        
        for doc_type in document_types:
            document_data = {
                "vertrag_id": contract_id,
                "title": doc_type["title"],
                "filename": doc_type["filename"],
                "document_type": doc_type["type"],
                "description": f"Test {doc_type['type'].upper()} document for contract",
                "tags": [doc_type["type"], "test", "contract"],
                "file_content": doc_type["content"]
            }
            
            status_code, response = self.make_request('POST', 'documents', document_data)
            if status_code == 200 and 'id' in response:
                successful_uploads += 1
                self.created_documents.append(response['id'])
        
        success = successful_uploads == total_types
        details = f"Successfully uploaded {successful_uploads}/{total_types} document types"
        
        return self.log_test("Document Types with Contract", success, details)

    def test_contract_document_relationship_integrity(self):
        """Test that document-contract relationships are maintained correctly"""
        if not self.created_contracts or not self.created_documents:
            return self.log_test("Contract-Document Relationship", False, "No contracts or documents to test")
        
        print("\n🔍 Testing Contract-Document Relationship Integrity...")
        
        # Get documents created in this test session that have vertrag_id
        test_contract_documents = []
        for doc_id in self.created_documents:
            status_code, doc = self.make_request('GET', f'documents/{doc_id}')
            if status_code == 200 and doc.get('vertrag_id') is not None:
                test_contract_documents.append(doc)
        
        if not test_contract_documents:
            return self.log_test("Contract-Document Relationship", False, "No contract documents created in this test")
        
        # Verify each test contract document has a valid contract reference
        valid_relationships = 0
        for doc in test_contract_documents:
            vertrag_id = doc.get('vertrag_id')
            if vertrag_id in self.created_contracts:
                valid_relationships += 1
        
        success = valid_relationships == len(test_contract_documents)
        details = f"Test contract documents: {len(test_contract_documents)}, Valid relationships: {valid_relationships}"
        
        return self.log_test("Contract-Document Relationship", success, details)

    def test_get_contracts_by_kunde(self):
        """Test retrieving contracts by customer ID"""
        if not self.created_customers:
            return self.log_test("Get Contracts by Customer", False, "No customers created to test")
        
        print("\n🔍 Testing Get Contracts by Customer...")
        kunde_id = self.created_customers[0]
        
        status_code, response = self.make_request('GET', f'vertraege/kunde/{kunde_id}')
        success = (status_code == 200 and isinstance(response, list))
        
        if success:
            # Verify all contracts belong to the customer
            all_belong_to_customer = all(contract.get('kunde_id') == kunde_id for contract in response)
            success = success and all_belong_to_customer
            details = f"Status: {status_code}, Contracts found: {len(response)}, All belong to customer: {all_belong_to_customer}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Get Contracts by Customer", success, details)

    def test_document_crud_operations(self):
        """Test complete CRUD operations for documents"""
        if not self.created_documents:
            return self.log_test("Document CRUD Operations", False, "No documents created to test")
        
        print("\n🔍 Testing Document CRUD Operations...")
        document_id = self.created_documents[0]
        
        # Test GET document by ID
        status_code, response = self.make_request('GET', f'documents/{document_id}')
        if status_code != 200:
            return self.log_test("Document CRUD Operations", False, f"Failed to get document: {status_code}")
        
        # Test UPDATE document
        update_data = {
            "title": "Updated Document Title",
            "description": "Updated description for testing",
            "tags": ["updated", "test", "crud"]
        }
        
        status_code, response = self.make_request('PUT', f'documents/{document_id}', update_data)
        if status_code != 200:
            return self.log_test("Document CRUD Operations", False, f"Failed to update document: {status_code}")
        
        # Verify update
        updated_title = response.get('title') == update_data['title']
        updated_description = response.get('description') == update_data['description']
        
        success = updated_title and updated_description
        details = f"Title updated: {updated_title}, Description updated: {updated_description}"
        
        return self.log_test("Document CRUD Operations", success, details)

    def test_document_statistics(self):
        """Test document statistics endpoint"""
        print("\n🔍 Testing Document Statistics...")
        
        status_code, response = self.make_request('GET', 'documents/stats')
        success = (status_code == 200 and 'total_documents' in response and 
                  'by_type' in response and 'recent_documents' in response)
        
        if success:
            total_docs = response.get('total_documents', 0)
            by_type = response.get('by_type', {})
            recent_docs = response.get('recent_documents', [])
            details = f"Status: {status_code}, Total: {total_docs}, Types: {len(by_type)}, Recent: {len(recent_docs)}"
        else:
            details = f"Status: {status_code}, Response: {response}"
        
        return self.log_test("Document Statistics", success, details)

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
        self.test_create_customer_frontend_payload()  # NEW: Test exact frontend payload
        self.test_create_customer_frontend_payload_fixed()  # NEW: Test fixed frontend payload
        self.test_create_customer_frontend_payload_null_anrede()  # NEW: Test null anrede
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
        self.test_sample_vus_internal_ids()  # NEW: Test sample VUs have internal IDs
        self.test_create_vu_with_status()
        self.test_create_vu_with_pool_status()
        self.test_vu_internal_id_generation()  # NEW: Test internal ID generation
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
        
        # NEW VU Auto-Assignment Tests
        print("\n🎯 Testing NEW VU Auto-Assignment Features...")
        self.test_vu_matching_exact_name()
        self.test_vu_matching_kurzbezeichnung()
        self.test_vu_matching_partial_name()
        self.test_vu_matching_reverse_partial()
        self.test_vu_matching_no_match()
        
        # VU validation tests
        self.test_vu_status_enum_validation()
        
        # VU deletion test (at the end)
        self.test_delete_vu()
        
        # Contract tests with auto-assignment
        self.test_contract_auto_vu_assignment()  # NEW: Test auto VU assignment
        self.test_contract_creation_dialog_ag()  # NEW: Test Dialog AG matching
        self.test_create_contract()
        self.test_get_contracts()
        self.test_search_by_kfz_kennzeichen()
        
        # NEW Migration and Statistics APIs
        self.test_contract_migration_api()  # NEW: Test migration API
        self.test_vu_statistics_api()       # NEW: Test statistics API
        
        # NEW CONTRACT CREATION AND DOCUMENT MANAGEMENT TESTS
        print("\n🎯 Testing NEW Contract Creation and Document Management Features...")
        self.test_contract_creation_allianz_vu_assignment()    # Test Allianz -> VU-001
        self.test_contract_creation_dialog_vu_assignment()     # Test Dialog -> VU-003  
        self.test_contract_creation_unknown_company_no_vu()    # Test unknown company -> no VU
        self.test_get_contracts_by_kunde()                     # Test get contracts by customer
        
        # Document Management Tests
        self.test_document_upload_to_contract()                # Test document upload to contract
        self.test_document_upload_via_upload_endpoint()        # Test upload via /documents/upload
        self.test_retrieve_contract_documents()                # Test document retrieval by contract
        self.test_document_types_with_contract()               # Test PDF, DOC, Excel types
        self.test_contract_document_relationship_integrity()   # Test relationship integrity
        self.test_document_crud_operations()                   # Test document CRUD
        self.test_document_statistics()                        # Test document stats
        
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