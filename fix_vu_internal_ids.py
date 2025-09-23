#!/usr/bin/env python3
"""
Fix VU Internal IDs for existing VUs
"""

import requests
import json

def fix_vu_internal_ids():
    base_url = "https://insurance-portal-10.preview.emergentagent.com/api"
    
    # Get all VUs
    response = requests.get(f"{base_url}/vus")
    if response.status_code != 200:
        print(f"Failed to get VUs: {response.status_code}")
        return
    
    vus = response.json()
    print(f"Found {len(vus)} VUs")
    
    # Expected internal IDs for sample VUs
    expected_mappings = {
        "Allianz Versicherung AG": "VU-001",
        "Alte Leipziger Lebensversicherung AG": "VU-002", 
        "Dialog Versicherung AG": "VU-003",
        "Itzehoer Versicherung": "VU-004"
    }
    
    updated_count = 0
    
    for vu in vus:
        vu_name = vu.get('name', '')
        vu_id = vu.get('id')
        current_internal_id = vu.get('vu_internal_id')
        
        # Skip if already has internal ID
        if current_internal_id:
            print(f"✅ {vu_name} already has internal ID: {current_internal_id}")
            continue
            
        # Check if this is a sample VU that needs a specific internal ID
        expected_internal_id = expected_mappings.get(vu_name)
        if expected_internal_id:
            # Update the VU with the expected internal ID
            update_data = {
                "name": vu_name,
                "kurzbezeichnung": vu.get('kurzbezeichnung'),
                "status": vu.get('status'),
                "strasse": vu.get('strasse'),
                "plz": vu.get('plz'),
                "ort": vu.get('ort'),
                "telefon": vu.get('telefon'),
                "telefax": vu.get('telefax'),
                "email_zentrale": vu.get('email_zentrale'),
                "email_schaden": vu.get('email_schaden'),
                "internet_adresse": vu.get('internet_adresse'),
                "ansprechpartner": vu.get('ansprechpartner'),
                "acencia_vermittlernummer": vu.get('acencia_vermittlernummer'),
                "vu_id": vu.get('vu_id'),
                "bemerkung": vu.get('bemerkung')
            }
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            update_response = requests.put(
                f"{base_url}/vus/{vu_id}",
                json=update_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if update_response.status_code == 200:
                print(f"✅ Updated {vu_name} with internal ID: {expected_internal_id}")
                updated_count += 1
            else:
                print(f"❌ Failed to update {vu_name}: {update_response.status_code}")
                print(f"   Response: {update_response.text}")
        else:
            print(f"⚠️  {vu_name} is not a sample VU, skipping")
    
    print(f"\n📊 Updated {updated_count} VUs with internal IDs")

if __name__ == "__main__":
    fix_vu_internal_ids()