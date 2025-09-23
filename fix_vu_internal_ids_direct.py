#!/usr/bin/env python3
"""
Fix VU Internal IDs directly in database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def fix_vu_internal_ids():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Expected internal IDs for sample VUs
    expected_mappings = {
        "Allianz Versicherung AG": "VU-001",
        "Alte Leipziger Lebensversicherung AG": "VU-002", 
        "Dialog Versicherung AG": "VU-003",
        "Itzehoer Versicherung": "VU-004"
    }
    
    updated_count = 0
    
    for vu_name, internal_id in expected_mappings.items():
        result = await db.vus.update_one(
            {"name": vu_name, "vu_internal_id": {"$exists": False}},
            {"$set": {"vu_internal_id": internal_id}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Updated {vu_name} with internal ID: {internal_id}")
            updated_count += 1
        else:
            # Check if it already has the internal ID
            existing = await db.vus.find_one({"name": vu_name})
            if existing and existing.get('vu_internal_id'):
                print(f"✅ {vu_name} already has internal ID: {existing['vu_internal_id']}")
            else:
                print(f"⚠️  Could not find VU: {vu_name}")
    
    print(f"\n📊 Updated {updated_count} VUs with internal IDs")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_vu_internal_ids())