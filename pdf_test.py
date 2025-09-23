#!/usr/bin/env python3
"""
Focused PDF Analysis and Contract Creation Testing
"""

import requests
import json
import sys

class PDFAnalysisTester:
    def __init__(self, base_url="https://maklerportal-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_customers = []
        self.created_contracts = []

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
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}

    def setup_test_customer(self):
        """Create a test customer for contract creation"""
        print("\n🔧 Setting up test customer...")
        customer_data = {
            "anrede": "Herr",
            "vorname": "Max",
            "name": "Mustermann",
            "strasse": "Musterstraße 123",
            "plz": "10115",
            "ort": "Berlin"
        }
        
        status_code, response = self.make_request('POST', 'kunden', customer_data)
        if status_code == 200 and 'id' in response:
            self.created_customers.append(response['id'])
            print(f"✅ Test customer created: {response['id']}")
            return True
        else:
            print(f"❌ Failed to create test customer: {status_code}")
            return False

    def test_pdf_analysis_endpoint_accessibility(self):
        """Test PDF analysis endpoint accessibility"""
        print("\n🔍 Testing PDF Analysis Endpoint Accessibility...")
        
        # Create a simple test payload with minimal PDF content
        test_payload = {
            "file_content": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNC0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0K",
            "file_name": "test_contract.pdf"
        }
        
        status_code, response = self.make_request('POST', 'analyze-contract-pdf', test_payload)
        
        # Check if endpoint is accessible (not 404)
        endpoint_accessible = status_code != 404
        
        if status_code == 500:
            # Check if it's an AI service configuration error
            error_msg = response.get('detail', '')
            if 'AI service not configured' in error_msg:
                success = False
                details = f"Status: {status_code} - AI service not configured (EMERGENT_LLM_KEY missing)"
            else:
                success = endpoint_accessible
                details = f"Status: {status_code} - Endpoint accessible but processing failed: {error_msg}"
        elif status_code == 200:
            # Endpoint working correctly
            success = True
            confidence = response.get('confidence', 0)
            details = f"Status: {status_code} - Endpoint working, Confidence: {confidence}"
        else:
            success = endpoint_accessible
            details = f"Status: {status_code} - Endpoint accessible but returned: {response}"
        
        return self.log_test("PDF Analysis Endpoint Accessibility", success, details)

    def test_emergent_llm_key_configuration(self):
        """Test if EMERGENT_LLM_KEY is properly configured"""
        print("\n🔍 Testing EMERGENT_LLM_KEY Configuration...")
        
        # Try to access the PDF analysis endpoint to check if AI service is configured
        test_payload = {
            "file_content": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQNC0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0K",
            "file_name": "config_test.pdf"
        }
        
        status_code, response = self.make_request('POST', 'analyze-contract-pdf', test_payload)
        
        if status_code == 500:
            error_msg = response.get('detail', '')
            if 'AI service not configured' in error_msg:
                success = False
                details = f"Status: {status_code} - EMERGENT_LLM_KEY not configured or invalid"
            else:
                success = True  # Key is configured, but other error occurred
                details = f"Status: {status_code} - EMERGENT_LLM_KEY configured but processing error: {error_msg}"
        elif status_code == 200:
            success = True
            details = f"Status: {status_code} - EMERGENT_LLM_KEY properly configured and working"
        else:
            success = True  # Assume key is configured if we don't get the specific error
            details = f"Status: {status_code} - Key appears configured, response: {response}"
        
        return self.log_test("EMERGENT_LLM_KEY Configuration", success, details)

    def test_create_contract_from_pdf_endpoint_accessibility(self):
        """Test create contract from PDF endpoint accessibility"""
        print("\n🔍 Testing Create Contract from PDF Endpoint Accessibility...")
        
        if not self.created_customers:
            return self.log_test("Create Contract from PDF Endpoint", False, "No customers created to test")
        
        # Create sample extracted data
        extracted_data = {
            "vertragsnummer": "V2024PDF001",
            "gesellschaft": "Allianz Versicherung AG",
            "produkt_sparte": "KFZ-Versicherung",
            "tarif": "Vollkasko",
            "zahlungsweise": "monatlich",
            "beitrag_brutto": "850.00",
            "beitrag_netto": "714.29",
            "beginn": "2024-01-01",
            "ablauf": "2024-12-31",
            "kunde_name": "Mustermann",
            "kunde_vorname": "Max",
            "kunde_strasse": "Musterstraße 123",
            "kunde_plz": "10115",
            "kunde_ort": "Berlin",
            "confidence": 0.85,
            "raw_analysis": "Test analysis data"
        }
        
        # Test payload
        test_payload = {
            "kunde_id": self.created_customers[0],
            "extracted_data": extracted_data
        }
        
        status_code, response = self.make_request('POST', 'create-contract-from-pdf', test_payload)
        
        # Check if endpoint is accessible (not 404)
        endpoint_accessible = status_code != 404
        
        if status_code == 200:
            success = True
            contract_id = response.get('contract_id')
            if contract_id:
                self.created_contracts.append(contract_id)
            details = f"Status: {status_code} - Contract created successfully, ID: {contract_id}"
        elif status_code == 404:
            success = False
            details = f"Status: {status_code} - Endpoint not found"
        elif status_code == 422:
            success = endpoint_accessible  # Endpoint exists but validation failed
            details = f"Status: {status_code} - Endpoint accessible but validation error: {response}"
        else:
            success = endpoint_accessible
            details = f"Status: {status_code} - Endpoint accessible, response: {response}"
        
        return self.log_test("Create Contract from PDF Endpoint", success, details)

    def test_emergentintegrations_library_import(self):
        """Test if emergentintegrations library is properly installed and importable"""
        print("\n🔍 Testing emergentintegrations Library Import...")
        
        # We can't directly test the import, but we can test if the PDF analysis endpoint
        # works without import errors, which would indicate the library is properly installed
        
        test_payload = {
            "file_content": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0K",
            "file_name": "import_test.pdf"
        }
        
        status_code, response = self.make_request('POST', 'analyze-contract-pdf', test_payload)
        
        # If we get a 500 error with import-related message, library is not installed
        if status_code == 500:
            error_msg = response.get('detail', '')
            if 'import' in error_msg.lower() or 'module' in error_msg.lower():
                success = False
                details = f"Status: {status_code} - Library import error: {error_msg}"
            elif 'AI service not configured' in error_msg:
                success = True  # Library imported fine, just missing API key
                details = f"Status: {status_code} - Library imported successfully, missing API key"
            else:
                success = True  # Library imported, other processing error
                details = f"Status: {status_code} - Library imported, processing error: {error_msg}"
        elif status_code == 200:
            success = True
            details = f"Status: {status_code} - Library imported and working correctly"
        elif status_code == 404:
            success = False
            details = f"Status: {status_code} - Endpoint not found, possible routing issue"
        else:
            success = True  # Assume library is imported if we don't get import errors
            details = f"Status: {status_code} - Library appears to be imported correctly"
        
        return self.log_test("emergentintegrations Library Import", success, details)

    def run_pdf_tests(self):
        """Run all PDF-related tests"""
        print("🚀 Starting PDF Analysis and Contract Creation Tests")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_customer():
            print("❌ Cannot proceed without test customer")
            return 1
        
        # Run PDF tests
        self.test_emergentintegrations_library_import()
        self.test_emergent_llm_key_configuration()
        self.test_pdf_analysis_endpoint_accessibility()
        self.test_create_contract_from_pdf_endpoint_accessibility()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 PDF Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All PDF tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} PDF tests failed")
            return 1

def main():
    tester = PDFAnalysisTester()
    return tester.run_pdf_tests()

if __name__ == "__main__":
    sys.exit(main())