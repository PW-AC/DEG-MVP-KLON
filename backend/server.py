from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
from enum import Enum
import random
import base64
from typing import Union
import tempfile
import aiofiles
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums for specific fields
class Anrede(str, Enum):
    HERR = "Herr"
    FRAU = "Frau"
    FIRMA = "Firma"


class Familienstand(str, Enum):
    LEDIG = "ledig"
    VERHEIRATET = "verheiratet"
    GESCHIEDEN = "geschieden"
    VERWITWET = "verwitwet"


class Vertragsstatus(str, Enum):
    AKTIV = "aktiv"
    GEKÜNDIGT = "gekündigt"
    RUHEND = "ruhend"
    STORNIERT = "storniert"


class VUStatus(str, Enum):
    VU = "VU"
    POOL = "Pool"


class DocumentType(str, Enum):
    PDF = "pdf"
    EMAIL = "email"
    WORD = "word"
    EXCEL = "excel"
    IMAGE = "image"
    OTHER = "other"


# Document Management Models
class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kunde_id: Optional[str] = None
    vertrag_id: Optional[str] = None
    title: str
    filename: str
    document_type: DocumentType
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    file_content: Optional[str] = None  # Base64 encoded file content
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentCreate(BaseModel):
    kunde_id: Optional[str] = None
    vertrag_id: Optional[str] = None
    title: str
    filename: str
    document_type: DocumentType
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    file_content: Optional[str] = None  # Base64 encoded file content


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


# Customer (Kunde) Models
class KundeBankverbindung(BaseModel):
    iban: Optional[str] = None
    bic: Optional[str] = None
    bank: Optional[str] = None
    kontoinhaber: Optional[str] = None
    betreuendes_buero: Optional[str] = None


class KundeTelefon(BaseModel):
    telefon_privat: Optional[str] = None
    telefax_privat: Optional[str] = None
    telefon_geschaeftlich: Optional[str] = None
    telefax_geschaeftlich: Optional[str] = None
    mobiltelefon: Optional[str] = None
    ansprechpartner: Optional[str] = None
    email: Optional[str] = None
    internet_adresse: Optional[str] = None


class KundePersoenlich(BaseModel):
    geburtsdatum: Optional[date] = None
    geburtsname: Optional[str] = None
    geburtsort: Optional[str] = None
    familienstand: Optional[Familienstand] = None
    nationalitaet: Optional[str] = None


class KundeArbeitgeber(BaseModel):
    firmenname: Optional[str] = None
    telefon: Optional[str] = None
    telefax: Optional[str] = None
    personalnummer: Optional[str] = None


class Kunde(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Stammdaten
    status: Optional[str] = None
    anrede: Optional[Anrede] = None
    titel: Optional[str] = None
    vorname: Optional[str] = None
    name: Optional[str] = None
    kunde_id: Optional[str] = None
    zusatz: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    postfach_plz: Optional[str] = None
    postfach_nr: Optional[str] = None
    gewerbliche_adresse: bool = False
    dokumentenmappe_nr: Optional[str] = None
    
    # Betreuer / Verwaltung
    betreuer: Optional[str] = None
    betreuer_name: Optional[str] = None
    betreuer_firma: Optional[str] = None
    bemerkung: Optional[str] = None
    selektion: Optional[str] = None
    
    # Nested objects
    bankverbindung: Optional[KundeBankverbindung] = None
    telefon: Optional[KundeTelefon] = None
    persoenliche_daten: Optional[KundePersoenlich] = None
    arbeitgeber: Optional[KundeArbeitgeber] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class KundeCreate(BaseModel):
    # Stammdaten
    status: Optional[str] = None
    anrede: Optional[Anrede] = None
    titel: Optional[str] = None
    vorname: Optional[str] = None
    name: Optional[str] = None
    kunde_id: Optional[str] = None
    zusatz: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    postfach_plz: Optional[str] = None
    postfach_nr: Optional[str] = None
    gewerbliche_adresse: bool = False
    dokumentenmappe_nr: Optional[str] = None
    
    # Betreuer / Verwaltung
    betreuer: Optional[str] = None
    betreuer_name: Optional[str] = None
    betreuer_firma: Optional[str] = None
    bemerkung: Optional[str] = None
    selektion: Optional[str] = None
    
    # Nested objects
    bankverbindung: Optional[KundeBankverbindung] = None
    telefon: Optional[KundeTelefon] = None
    persoenliche_daten: Optional[KundePersoenlich] = None
    arbeitgeber: Optional[KundeArbeitgeber] = None


# Contract (Vertrag) Models
class Vertrag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vertragsnummer: Optional[str] = None
    interne_vertragsnummer: Optional[str] = None  # AiN
    kunde_id: Optional[str] = None  # Reference to Kunde
    vu_id: Optional[str] = None  # Reference to VU (UUID)
    vu_internal_id: Optional[str] = None  # Internal VU ID for relations (VU-001, etc.)
    gesellschaft: Optional[str] = None
    kfz_kennzeichen: Optional[str] = None
    produkt_sparte: Optional[str] = None
    tarif: Optional[str] = None
    zahlungsweise: Optional[str] = None
    beitrag_brutto: Optional[float] = None
    beitrag_netto: Optional[float] = None
    vertragsstatus: Optional[Vertragsstatus] = None
    beginn: Optional[date] = None
    ablauf: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VertragCreate(BaseModel):
    vertragsnummer: Optional[str] = None
    interne_vertragsnummer: Optional[str] = None
    kunde_id: Optional[str] = None
    vu_id: Optional[str] = None
    vu_internal_id: Optional[str] = None
    gesellschaft: Optional[str] = None
    kfz_kennzeichen: Optional[str] = None
    produkt_sparte: Optional[str] = None
    tarif: Optional[str] = None
    zahlungsweise: Optional[str] = None
    beitrag_brutto: Optional[float] = None
    beitrag_netto: Optional[float] = None
    vertragsstatus: Optional[Vertragsstatus] = None
    beginn: Optional[date] = None
    ablauf: Optional[date] = None


# VU (Versicherungsunternehmen) Models
class VU(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vu_internal_id: Optional[str] = None  # Interne ID für Relation (VU-001, VU-002, etc.)
    name: str  # z.B. "Alte Leipziger Sachversicherung"
    kurzbezeichnung: Optional[str] = None  # z.B. "ALS"
    status: Optional[VUStatus] = VUStatus.VU  # VU oder Pool
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    telefax: Optional[str] = None
    email_zentrale: Optional[str] = None
    email_schaden: Optional[str] = None
    internet_adresse: Optional[str] = None
    ansprechpartner: Optional[str] = None
    acencia_vermittlernummer: Optional[str] = None
    vu_id: Optional[str] = None
    bemerkung: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VUCreate(BaseModel):
    name: str
    kurzbezeichnung: Optional[str] = None
    status: Optional[VUStatus] = VUStatus.VU
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    telefax: Optional[str] = None
    email_zentrale: Optional[str] = None
    email_schaden: Optional[str] = None
    internet_adresse: Optional[str] = None
    ansprechpartner: Optional[str] = None
    acencia_vermittlernummer: Optional[str] = None
    vu_id: Optional[str] = None
    bemerkung: Optional[str] = None


# Helper functions for VU ID generation
def generate_vu_internal_id():
    """Generate internal VU ID in format VU-XXX (e.g., VU-001, VU-002)"""
    import asyncio
    # This will be called in async context, so we need to handle it properly
    return f"VU-{str(random.randint(1000, 9999))}"


async def get_next_vu_internal_id():
    """Get next sequential VU internal ID"""
    # Get highest existing internal VU ID
    existing_vus = await db.vus.find({}, {"vu_internal_id": 1}).to_list(length=None)
    max_id = 0
    for vu in existing_vus:
        if vu.get('vu_internal_id') and vu['vu_internal_id'].startswith('VU-'):
            try:
                num = int(vu['vu_internal_id'][3:])  # Extract number after 'VU-'
                max_id = max(max_id, num)
            except ValueError:
                continue
    
    next_id = max_id + 1
    return f"VU-{str(next_id).zfill(3)}"


async def find_matching_vu(gesellschaft_name: str):
    """
    Find matching VU based on gesellschaft name.
    Returns (vu_object, match_type) or (None, None) if no match found.
    """
    if not gesellschaft_name:
        return None, None
    
    gesellschaft_lower = gesellschaft_name.lower().strip()
    
    # 1. Try exact name match
    exact_match = await db.vus.find_one({"name": {"$regex": f"^{gesellschaft_name}$", "$options": "i"}})
    if exact_match:
        return VU(**parse_from_mongo(exact_match)), "exact_name"
    
    # 2. Try kurzbezeichnung match
    kurz_match = await db.vus.find_one({"kurzbezeichnung": {"$regex": f"^{gesellschaft_name}$", "$options": "i"}})
    if kurz_match:
        return VU(**parse_from_mongo(kurz_match)), "kurzbezeichnung"
    
    # 3. Try partial name match (contains)
    partial_matches = await db.vus.find({"name": {"$regex": gesellschaft_name, "$options": "i"}}).to_list(length=None)
    if partial_matches:
        # Return first partial match
        return VU(**parse_from_mongo(partial_matches[0])), "partial_name"
    
    # 4. Try reverse partial match (gesellschaft contains VU name)
    all_vus = await db.vus.find({}).to_list(length=None)
    for vu in all_vus:
        vu_name_lower = vu.get('name', '').lower()
        vu_kurz_lower = vu.get('kurzbezeichnung', '').lower()
        
        if vu_name_lower and vu_name_lower in gesellschaft_lower:
            return VU(**parse_from_mongo(vu)), "reverse_partial"
        if vu_kurz_lower and vu_kurz_lower in gesellschaft_lower:
            return VU(**parse_from_mongo(vu)), "reverse_kurz"
    
    return None, None


async def auto_assign_vu_to_contract(vertrag_data: dict):
    """
    Automatically assign VU to contract based on gesellschaft field.
    Returns updated vertrag_data with vu_id and vu_internal_id if match found.
    """
    gesellschaft = vertrag_data.get('gesellschaft')
    if not gesellschaft:
        return vertrag_data, None
    
    matching_vu, match_type = await find_matching_vu(gesellschaft)
    if matching_vu:
        vertrag_data['vu_id'] = matching_vu.id
        vertrag_data['vu_internal_id'] = matching_vu.vu_internal_id
        return vertrag_data, {"vu": matching_vu, "match_type": match_type}
    
    return vertrag_data, None


# Helper functions for MongoDB serialization
def generate_kunde_id():
    """Generate customer ID in format XX-XXX-XXX (e.g., 12-345-678)"""
    part1 = str(random.randint(10, 99))
    part2 = str(random.randint(100, 999))
    part3 = str(random.randint(100, 999))
    return f"{part1}-{part2}-{part3}"


def prepare_for_mongo(data):
    """Convert date objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, date):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
    return data


def parse_from_mongo(item):
    """Parse date strings back to date objects from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key in ['geburtsdatum', 'beginn', 'ablauf'] and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value).date()
                except:
                    pass
            elif isinstance(value, dict):
                item[key] = parse_from_mongo(value)
    return item


# Customer endpoints
@api_router.post("/kunden", response_model=Kunde)
async def create_kunde(kunde: KundeCreate):
    kunde_dict = prepare_for_mongo(kunde.dict())
    
    # Auto-generate kunde_id if not provided
    if not kunde_dict.get('kunde_id'):
        # Ensure unique kunde_id
        while True:
            new_id = generate_kunde_id()
            existing = await db.kunden.find_one({"kunde_id": new_id})
            if not existing:
                kunde_dict['kunde_id'] = new_id
                break
    
    kunde_obj = Kunde(**kunde_dict)
    result = await db.kunden.insert_one(prepare_for_mongo(kunde_obj.dict()))
    return kunde_obj


@api_router.get("/kunden", response_model=List[Kunde])
async def get_kunden(skip: int = 0, limit: int = 60):
    kunden = await db.kunden.find().skip(skip).limit(limit).to_list(length=None)
    return [Kunde(**parse_from_mongo(kunde)) for kunde in kunden]


@api_router.get("/kunden/search")
async def search_kunden(
    vorname: Optional[str] = None,
    name: Optional[str] = None,
    strasse: Optional[str] = None,
    plz: Optional[str] = None,
    ort: Optional[str] = None,
    kunde_id: Optional[str] = None,
    geburtsdatum: Optional[str] = None,
    kfz_kennzeichen: Optional[str] = None,
    limit: int = 60
):
    query = {}
    
    if vorname:
        query["vorname"] = {"$regex": vorname, "$options": "i"}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if strasse:
        query["strasse"] = {"$regex": strasse, "$options": "i"}
    if plz:
        query["plz"] = {"$regex": plz, "$options": "i"}
    if ort:
        query["ort"] = {"$regex": ort, "$options": "i"}
    if kunde_id:
        query["kunde_id"] = {"$regex": kunde_id, "$options": "i"}
    if geburtsdatum:
        query["persoenliche_daten.geburtsdatum"] = geburtsdatum
    
    # Search in related contracts for KFZ-Kennzeichen
    if kfz_kennzeichen:
        # First find contracts with the license plate
        contracts = await db.vertraege.find(
            {"kfz_kennzeichen": {"$regex": kfz_kennzeichen, "$options": "i"}}
        ).to_list(length=None)
        if contracts:
            kunde_ids = [contract.get("kunde_id") for contract in contracts]
            query["id"] = {"$in": kunde_ids}
    
    kunden = await db.kunden.find(query).limit(limit).to_list(length=None)
    return [Kunde(**parse_from_mongo(kunde)) for kunde in kunden]


@api_router.get("/kunden/{kunde_id}", response_model=Kunde)
async def get_kunde(kunde_id: str):
    kunde = await db.kunden.find_one({"id": kunde_id})
    if kunde is None:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return Kunde(**parse_from_mongo(kunde))


@api_router.put("/kunden/{kunde_id}", response_model=Kunde)
async def update_kunde(kunde_id: str, kunde_update: KundeCreate):
    kunde_dict = prepare_for_mongo(kunde_update.dict(exclude_unset=True))
    kunde_dict["updated_at"] = datetime.utcnow()
    
    result = await db.kunden.update_one(
        {"id": kunde_id}, 
        {"$set": kunde_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    updated_kunde = await db.kunden.find_one({"id": kunde_id})
    return Kunde(**parse_from_mongo(updated_kunde))


@api_router.delete("/kunden/{kunde_id}")
async def delete_kunde(kunde_id: str):
    result = await db.kunden.delete_one({"id": kunde_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return {"message": "Kunde erfolgreich gelöscht"}


# Contract endpoints
@api_router.post("/vertraege", response_model=Vertrag)
async def create_vertrag(vertrag: VertragCreate):
    vertrag_dict = prepare_for_mongo(vertrag.dict())
    
    # Auto-assign VU based on gesellschaft if not already assigned
    if not vertrag_dict.get('vu_id') and vertrag_dict.get('gesellschaft'):
        vertrag_dict, match_info = await auto_assign_vu_to_contract(vertrag_dict)
        # Note: match_info could be used for logging or user feedback
    
    vertrag_obj = Vertrag(**vertrag_dict)
    result = await db.vertraege.insert_one(prepare_for_mongo(vertrag_obj.dict()))
    return vertrag_obj


@api_router.get("/vertraege", response_model=List[Vertrag])
async def get_vertraege(skip: int = 0, limit: int = 100):
    vertraege = await db.vertraege.find().skip(skip).limit(limit).to_list(length=None)
    return [Vertrag(**parse_from_mongo(vertrag)) for vertrag in vertraege]


@api_router.get("/vertraege/kunde/{kunde_id}", response_model=List[Vertrag])
async def get_vertraege_by_kunde(kunde_id: str):
    vertraege = await db.vertraege.find({"kunde_id": kunde_id}).to_list(length=None)
    return [Vertrag(**parse_from_mongo(vertrag)) for vertrag in vertraege]


@api_router.get("/vertraege/{vertrag_id}", response_model=Vertrag)
async def get_vertrag(vertrag_id: str):
    vertrag = await db.vertraege.find_one({"id": vertrag_id})
    if vertrag is None:
        raise HTTPException(status_code=404, detail="Vertrag nicht gefunden")
    return Vertrag(**parse_from_mongo(vertrag))


@api_router.put("/vertraege/{vertrag_id}", response_model=Vertrag)
async def update_vertrag(vertrag_id: str, vertrag_update: VertragCreate):
    vertrag_dict = prepare_for_mongo(vertrag_update.dict(exclude_unset=True))
    vertrag_dict["updated_at"] = datetime.utcnow()
    
    result = await db.vertraege.update_one(
        {"id": vertrag_id}, 
        {"$set": vertrag_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vertrag nicht gefunden")
    
    updated_vertrag = await db.vertraege.find_one({"id": vertrag_id})
    return Vertrag(**parse_from_mongo(updated_vertrag))


# VU endpoints
@api_router.post("/vus", response_model=VU)
async def create_vu(vu: VUCreate):
    vu_dict = prepare_for_mongo(vu.dict())
    
    # Generate internal VU ID if not provided
    if not vu_dict.get('vu_internal_id'):
        vu_dict['vu_internal_id'] = await get_next_vu_internal_id()
    
    vu_obj = VU(**vu_dict)
    result = await db.vus.insert_one(prepare_for_mongo(vu_obj.dict()))
    return vu_obj


@api_router.get("/vus", response_model=List[VU])
async def get_vus(skip: int = 0, limit: int = 100):
    vus = await db.vus.find().skip(skip).limit(limit).to_list(length=None)
    return [VU(**parse_from_mongo(vu)) for vu in vus]


@api_router.get("/vus/search")
async def search_vus(
    name: Optional[str] = None,
    kurzbezeichnung: Optional[str] = None,
    status: Optional[VUStatus] = None,
    ort: Optional[str] = None,
    telefon: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = 100
):
    query = {}
    
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if kurzbezeichnung:
        query["kurzbezeichnung"] = {"$regex": kurzbezeichnung, "$options": "i"}
    if status:
        query["status"] = status.value
    if ort:
        query["ort"] = {"$regex": ort, "$options": "i"}
    if telefon:
        query["telefon"] = {"$regex": telefon, "$options": "i"}
    if email:
        # Search in both email fields
        query["$or"] = [
            {"email_zentrale": {"$regex": email, "$options": "i"}},
            {"email_schaden": {"$regex": email, "$options": "i"}}
        ]
    
    vus = await db.vus.find(query).limit(limit).to_list(length=None)
    return [VU(**parse_from_mongo(vu)) for vu in vus]


@api_router.get("/vus/{vu_id}", response_model=VU)
async def get_vu(vu_id: str):
    vu = await db.vus.find_one({"id": vu_id})
    if vu is None:
        raise HTTPException(status_code=404, detail="VU nicht gefunden")
    return VU(**parse_from_mongo(vu))


@api_router.put("/vus/{vu_id}", response_model=VU)
async def update_vu(vu_id: str, vu_update: VUCreate):
    vu_dict = prepare_for_mongo(vu_update.dict(exclude_unset=True))
    vu_dict["updated_at"] = datetime.utcnow()
    
    result = await db.vus.update_one(
        {"id": vu_id}, 
        {"$set": vu_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="VU nicht gefunden")
    
    updated_vu = await db.vus.find_one({"id": vu_id})
    return VU(**parse_from_mongo(updated_vu))


@api_router.delete("/vus/{vu_id}")
async def delete_vu(vu_id: str):
    result = await db.vus.delete_one({"id": vu_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="VU nicht gefunden")
    return {"message": "VU erfolgreich gelöscht"}


# VU Matching and Migration endpoints
@api_router.post("/vus/match-gesellschaft")
async def match_gesellschaft_to_vu(gesellschaft: str):
    """
    Find matching VU for a given gesellschaft name.
    Used by frontend to check VU assignment before creating contracts.
    """
    if not gesellschaft:
        return {"match": False, "vu": None, "match_type": None}
    
    matching_vu, match_type = await find_matching_vu(gesellschaft)
    if matching_vu:
        return {
            "match": True, 
            "vu": matching_vu.dict(), 
            "match_type": match_type,
            "message": f"VU gefunden: {matching_vu.name} (via {match_type})"
        }
    
    return {
        "match": False, 
        "vu": None, 
        "match_type": None,
        "message": f"Keine VU gefunden für: {gesellschaft}"
    }


@api_router.post("/vertraege/migrate-vu-assignments")
async def migrate_existing_contracts():
    """
    Migrate existing contracts to assign VU IDs based on gesellschaft field.
    """
    # Get all contracts without vu_internal_id
    contracts_without_vu = await db.vertraege.find({"vu_internal_id": {"$exists": False}}).to_list(length=None)
    
    migration_results = {
        "total_contracts": len(contracts_without_vu),
        "matched": 0,
        "unmatched": 0,
        "updated": 0,
        "matches": [],
        "unmatched_gesellschaften": []
    }
    
    for contract in contracts_without_vu:
        gesellschaft = contract.get('gesellschaft')
        if gesellschaft:
            matching_vu, match_type = await find_matching_vu(gesellschaft)
            if matching_vu:
                # Update contract with VU assignment
                update_result = await db.vertraege.update_one(
                    {"id": contract["id"]},
                    {"$set": {
                        "vu_id": matching_vu.id,
                        "vu_internal_id": matching_vu.vu_internal_id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                if update_result.modified_count > 0:
                    migration_results["updated"] += 1
                    migration_results["matched"] += 1
                    migration_results["matches"].append({
                        "vertrag_id": contract["id"],
                        "gesellschaft": gesellschaft,
                        "vu_name": matching_vu.name,
                        "vu_internal_id": matching_vu.vu_internal_id,
                        "match_type": match_type
                    })
            else:
                migration_results["unmatched"] += 1
                if gesellschaft not in migration_results["unmatched_gesellschaften"]:
                    migration_results["unmatched_gesellschaften"].append(gesellschaft)
    
    return migration_results


@api_router.get("/vertraege/vu-statistics")
async def get_contract_vu_statistics():
    """
    Get statistics about VU assignments in contracts.
    """
    total_contracts = await db.vertraege.count_documents({})
    contracts_with_vu = await db.vertraege.count_documents({"vu_internal_id": {"$exists": True, "$ne": None}})
    contracts_without_vu = total_contracts - contracts_with_vu
    
    # Get gesellschaften without VU assignment
    unassigned_contracts = await db.vertraege.find(
        {"vu_internal_id": {"$exists": False}}, 
        {"gesellschaft": 1}
    ).to_list(length=None)
    
    unique_gesellschaften = list(set([
        c.get('gesellschaft') for c in unassigned_contracts 
        if c.get('gesellschaft')
    ]))
    
    return {
        "total_contracts": total_contracts,
        "contracts_with_vu": contracts_with_vu,
        "contracts_without_vu": contracts_without_vu,
        "assignment_percentage": round((contracts_with_vu / total_contracts * 100) if total_contracts > 0 else 0, 2),
        "unique_unassigned_gesellschaften": unique_gesellschaften
    }


# Initialize sample VU data
@api_router.post("/vus/init-sample-data")
async def init_sample_vu_data():
    # Check if sample data already exists
    existing_count = await db.vus.count_documents({})
    if existing_count > 0:
        return {"message": f"Sample data bereits vorhanden ({existing_count} VUs gefunden)"}
    
    sample_vus = [
        {
            "name": "Allianz Versicherung AG",
            "kurzbezeichnung": "Allianz",
            "vu_internal_id": "VU-001",
            "status": "VU",
            "strasse": "Königinstr. 28",
            "plz": "80802",
            "ort": "München",
            "telefon": "089 3800-0",
            "telefax": "089 3800-3425",
            "email_zentrale": "service@allianz.de",
            "email_schaden": "schaden@allianz.de",
            "internet_adresse": "www.allianz.de",
            "ansprechpartner": "Herr Müller",
            "acencia_vermittlernummer": "12345",
            "vu_id": "ALZ001"
        },
        {
            "name": "Alte Leipziger Lebensversicherung AG",
            "kurzbezeichnung": "Alte Leipziger",
            "vu_internal_id": "VU-002",
            "status": "VU",
            "strasse": "Alte-Leipziger-Platz 1",
            "plz": "61440",
            "ort": "Oberursel",
            "telefon": "06171 3090-0",
            "telefax": "06171 3090-1500",
            "email_zentrale": "info@alte-leipziger.de",
            "email_schaden": "schaden@alte-leipziger.de",
            "internet_adresse": "www.alte-leipziger.de",
            "ansprechpartner": "Frau Schmidt",
            "acencia_vermittlernummer": "23456",
            "vu_id": "ALD002"
        },
        {
            "name": "Dialog Versicherung AG",
            "kurzbezeichnung": "Dialog",
            "vu_internal_id": "VU-003",
            "status": "VU",
            "strasse": "Adenauerring 9",
            "plz": "81737",
            "ort": "München",
            "telefon": "089 746824-0",
            "telefax": "089 746824-99",
            "email_zentrale": "info@dialog.de",
            "email_schaden": "schaden@dialog.de",
            "internet_adresse": "www.dialog.de",
            "ansprechpartner": "Herr Weber",
            "acencia_vermittlernummer": "34567",
            "vu_id": "DLG003"
        },
        {
            "name": "Itzehoer Versicherung",
            "kurzbezeichnung": "Itzehoer",
            "vu_internal_id": "VU-004",
            "status": "VU",
            "strasse": "Schützenstraße 19",
            "plz": "25524",
            "ort": "Itzehoe",
            "telefon": "04821 773-0",
            "telefax": "04821 773-900",
            "email_zentrale": "info@itzehoer.de",
            "email_schaden": "schaden@itzehoer.de",
            "internet_adresse": "www.itzehoer.de",
            "ansprechpartner": "Frau Klein",
            "acencia_vermittlernummer": "45678",
            "vu_id": "ITZ004"
        }
    ]
    
    created_vus = []
    for vu_data in sample_vus:
        vu_obj = VU(**vu_data)
        await db.vus.insert_one(prepare_for_mongo(vu_obj.dict()))
        created_vus.append(vu_obj)
    
    return {
        "message": f"{len(created_vus)} Sample VUs erfolgreich erstellt",
        "vus": created_vus
    }


# Document Management endpoints
@api_router.post("/documents", response_model=Document)
async def create_document(document: DocumentCreate):
    document_dict = prepare_for_mongo(document.dict())
    document_obj = Document(**document_dict)
    result = await db.documents.insert_one(prepare_for_mongo(document_obj.dict()))
    return document_obj


@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    kunde_id: Optional[str] = None,
    vertrag_id: Optional[str] = None,
    document_type: Optional[DocumentType] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if kunde_id:
        query["kunde_id"] = kunde_id
    if vertrag_id:
        query["vertrag_id"] = vertrag_id
    if document_type:
        query["document_type"] = document_type.value
        
    documents = await db.documents.find(query).skip(skip).limit(limit).to_list(length=None)
    return [Document(**parse_from_mongo(doc)) for doc in documents]


# Get document statistics for dashboard
@api_router.get("/documents/stats")
async def get_document_stats():
    total_docs = await db.documents.count_documents({})
    
    # Count by document type
    pipeline = [
        {"$group": {"_id": "$document_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.documents.aggregate(pipeline).to_list(length=None)
    
    # Recent documents
    recent_docs = await db.documents.find().sort("created_at", -1).limit(5).to_list(length=None)
    
    return {
        "total_documents": total_docs,
        "by_type": {item["_id"]: item["count"] for item in type_counts},
        "recent_documents": [Document(**parse_from_mongo(doc)) for doc in recent_docs]
    }


@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if document is None:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    return Document(**parse_from_mongo(document))


@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, document_update: DocumentUpdate):
    update_dict = prepare_for_mongo(document_update.dict(exclude_unset=True))
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.documents.update_one(
        {"id": document_id}, 
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    
    updated_document = await db.documents.find_one({"id": document_id})
    return Document(**parse_from_mongo(updated_document))


@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    return {"message": "Dokument erfolgreich gelöscht"}


@api_router.get("/kunden/{kunde_id}/documents", response_model=List[Document])
async def get_customer_documents(kunde_id: str):
    documents = await db.documents.find({"kunde_id": kunde_id}).to_list(length=None)
    return [Document(**parse_from_mongo(doc)) for doc in documents]


@api_router.post("/documents/upload")
async def upload_document_file(
    kunde_id: Optional[str] = None,
    vertrag_id: Optional[str] = None,
    title: str = "Uploaded Document",
    description: Optional[str] = None,
    tags: str = "",  # Comma separated tags
    file_content: str = ""  # Base64 encoded file
):
    """
    Upload a document via multipart form or base64 content
    """
    try:
        # Determine document type from filename or content
        document_type = DocumentType.PDF  # Default
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create document
        document_create = DocumentCreate(
            kunde_id=kunde_id,
            vertrag_id=vertrag_id,
            title=title,
            filename=f"{title}.pdf",
            document_type=document_type,
            description=description,
            tags=tag_list,
            file_content=file_content
        )
        
        return await create_document(document_create)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Hochladen: {str(e)}")





# Data cleanup endpoints for development/testing
@api_router.post("/admin/cleanup-duplicates")
async def cleanup_duplicate_data():
    """
    Clean up duplicate customers and VUs created during testing.
    Keep only essential data and remove test duplicates.
    """
    cleanup_results = {
        "customers_deleted": 0,
        "vus_deleted": 0,
        "customers_kept": [],
        "vus_kept": []
    }
    
    # Define customers to keep (only Dr. Max Mustermann)
    customers_to_keep = [
        {"name": "Mustermann", "vorname": "Dr. Max", "kunde_id": "00-00-07"}
    ]
    
    # Define VUs to keep (original 4 sample VUs)
    vus_to_keep = [
        {"name": "Allianz Versicherung AG", "vu_internal_id": "VU-001"},
        {"name": "Alte Leipziger Lebensversicherung AG", "vu_internal_id": "VU-002"}, 
        {"name": "Dialog Versicherung AG", "vu_internal_id": "VU-003"},
        {"name": "Itzehoer Versicherung", "vu_internal_id": "VU-004"}
    ]
    
    # Get all customers
    all_customers = await db.kunden.find().to_list(length=None)
    
    # Delete all customers except Dr. Max Mustermann
    for customer in all_customers:
        should_keep = False
        for keep_customer in customers_to_keep:
            if (customer.get('name') == keep_customer['name'] and 
                customer.get('vorname') == keep_customer['vorname']):
                should_keep = True
                cleanup_results["customers_kept"].append({
                    "name": customer.get('name'),
                    "vorname": customer.get('vorname'),
                    "kunde_id": customer.get('kunde_id')
                })
                break
        
        if not should_keep:
            await db.kunden.delete_one({"id": customer["id"]})
            cleanup_results["customers_deleted"] += 1
    
    # Get all VUs
    all_vus = await db.vus.find().to_list(length=None)
    
    # Delete duplicate VUs
    kept_vu_names = set()
    for vu in all_vus:
        should_keep = False
        vu_name = vu.get('name', '')
        
        # Check if this VU should be kept and hasn't been kept yet
        for keep_vu in vus_to_keep:
            if (vu_name == keep_vu['name'] and 
                vu_name not in kept_vu_names):
                should_keep = True
                kept_vu_names.add(vu_name)
                cleanup_results["vus_kept"].append({
                    "name": vu.get('name'),
                    "kurzbezeichnung": vu.get('kurzbezeichnung'),
                    "vu_internal_id": vu.get('vu_internal_id')
                })
                break
        
        if not should_keep:
            await db.vus.delete_one({"id": vu["id"]})
            cleanup_results["vus_deleted"] += 1
    
    return cleanup_results


@api_router.get("/admin/data-statistics")
async def get_data_statistics():
    """
    Get current data statistics for monitoring.
    """
    customer_count = await db.kunden.count_documents({})
    vu_count = await db.vus.count_documents({})
    contract_count = await db.vertraege.count_documents({})
    document_count = await db.documents.count_documents({})
    
    # Get sample data
    sample_customers = await db.kunden.find({}, {"name": 1, "vorname": 1, "kunde_id": 1}).limit(5).to_list(length=None)
    sample_vus = await db.vus.find({}, {"name": 1, "kurzbezeichnung": 1, "vu_internal_id": 1}).limit(10).to_list(length=None)
    
    return {
        "totals": {
            "customers": customer_count,
            "vus": vu_count,
            "contracts": contract_count,
            "documents": document_count
        },
        "sample_customers": sample_customers,
        "sample_vus": sample_vus
    }


# PDF Analysis Models
class PDFAnalysisRequest(BaseModel):
    file_content: str  # Base64 encoded PDF content
    file_name: str

class ExtractedContractData(BaseModel):
    vertragsnummer: Optional[str] = None
    gesellschaft: Optional[str] = None
    produkt_sparte: Optional[str] = None
    tarif: Optional[str] = None
    zahlungsweise: Optional[str] = None
    beitrag_brutto: Optional[str] = None
    beitrag_netto: Optional[str] = None
    beginn: Optional[str] = None
    ablauf: Optional[str] = None
    kunde_name: Optional[str] = None
    kunde_vorname: Optional[str] = None
    kunde_strasse: Optional[str] = None
    kunde_plz: Optional[str] = None
    kunde_ort: Optional[str] = None
    confidence: float = 0.0
    raw_analysis: str = ""

@api_router.post("/analyze-contract-pdf", response_model=ExtractedContractData)
async def analyze_contract_pdf(request: PDFAnalysisRequest):
    """
    Analyze PDF document and extract contract data using AI
    """
    try:
        # Decode base64 content
        pdf_content = base64.b64decode(request.file_content)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name
        
        try:
            # Initialize LLM chat with Gemini for file support
            emergent_key = os.environ.get('EMERGENT_LLM_KEY')
            if not emergent_key:
                raise HTTPException(status_code=500, detail="AI service not configured")
            
            chat = LlmChat(
                api_key=emergent_key,
                session_id=f"contract-analysis-{uuid.uuid4()}",
                system_message="Du bist ein spezialisierter AI-Assistent für die Analyse von Versicherungsverträgen. Extrahiere relevante Vertragsdaten aus PDF-Dokumenten."
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Create file attachment
            pdf_file = FileContentWithMimeType(
                file_path=temp_file_path,
                mime_type="application/pdf"
            )
            
            # Create analysis prompt
            analysis_prompt = """
Analysiere dieses PDF-Dokument eines Versicherungsvertrags und extrahiere die folgenden Informationen:

**Vertragsdaten:**
- Vertragsnummer
- Gesellschaft (Versicherungsunternehmen)
- Produkt/Sparte (z.B. KFZ, Haftpflicht, etc.)
- Tarif
- Zahlungsweise (monatlich, jährlich, etc.)
- Beitrag brutto (mit Währung)
- Beitrag netto (mit Währung)
- Vertragsbeginn (Datum)
- Vertragsablauf (Datum)

**Kundendaten:**
- Name (Nachname)
- Vorname
- Straße und Hausnummer
- Postleitzahl
- Ort

Gib die Antwort im folgenden JSON-Format zurück:
```json
{
  "vertragsnummer": "...",
  "gesellschaft": "...",
  "produkt_sparte": "...",
  "tarif": "...",
  "zahlungsweise": "...",
  "beitrag_brutto": "...",
  "beitrag_netto": "...",
  "beginn": "YYYY-MM-DD",
  "ablauf": "YYYY-MM-DD",
  "kunde_name": "...",
  "kunde_vorname": "...",
  "kunde_strasse": "...",
  "kunde_plz": "...",
  "kunde_ort": "...",
  "confidence": 0.85
}
```

Wenn bestimmte Informationen nicht gefunden werden, setze den Wert auf null. 
Gib bei confidence einen Wert zwischen 0 und 1 an, der deine Sicherheit bei der Extraktion widerspiegelt.
Verwende für Datumsangaben das Format YYYY-MM-DD.
"""
            
            # Send message with file attachment
            user_message = UserMessage(
                text=analysis_prompt,
                file_contents=[pdf_file]
            )
            
            response = await chat.send_message(user_message)
            
            # Parse the response (assuming it returns JSON)
            import json
            try:
                # Try to extract JSON from response
                response_text = str(response)
                # Find JSON content in response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_content = response_text[json_start:json_end]
                    extracted_data = json.loads(json_content)
                    
                    # Create response with extracted data
                    return ExtractedContractData(
                        vertragsnummer=extracted_data.get('vertragsnummer'),
                        gesellschaft=extracted_data.get('gesellschaft'),
                        produkt_sparte=extracted_data.get('produkt_sparte'),
                        tarif=extracted_data.get('tarif'),
                        zahlungsweise=extracted_data.get('zahlungsweise'),
                        beitrag_brutto=extracted_data.get('beitrag_brutto'),
                        beitrag_netto=extracted_data.get('beitrag_netto'),
                        beginn=extracted_data.get('beginn'),
                        ablauf=extracted_data.get('ablauf'),
                        kunde_name=extracted_data.get('kunde_name'),
                        kunde_vorname=extracted_data.get('kunde_vorname'),
                        kunde_strasse=extracted_data.get('kunde_strasse'),
                        kunde_plz=extracted_data.get('kunde_plz'),
                        kunde_ort=extracted_data.get('kunde_ort'),
                        confidence=extracted_data.get('confidence', 0.5),
                        raw_analysis=response_text
                    )
                else:
                    raise ValueError("No valid JSON found in response")
                    
            except (json.JSONDecodeError, ValueError) as e:
                # If JSON parsing fails, return raw response with low confidence
                logger.warning(f"Failed to parse AI response as JSON: {e}")
                return ExtractedContractData(
                    confidence=0.1,
                    raw_analysis=str(response)
                )
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
    except Exception as e:
        logger.error(f"Error analyzing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing PDF: {str(e)}")

# Auto-create contract with PDF data and upload document
@api_router.post("/create-contract-from-pdf")
async def create_contract_from_pdf(
    kunde_id: str,
    extracted_data: ExtractedContractData
):
    """
    Create a contract automatically from extracted PDF data
    """
    try:
        # Check if customer exists
        customer = await db.kunden.find_one({"id": kunde_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
        
        # Create contract with extracted data
        contract_data = {
            "id": str(uuid.uuid4()),
            "kunde_id": kunde_id,
            "vertragsnummer": extracted_data.vertragsnummer or "",
            "interne_vertragsnummer": "",
            "gesellschaft": extracted_data.gesellschaft or "",
            "kfz_kennzeichen": "",
            "produkt_sparte": extracted_data.produkt_sparte or "",
            "tarif": extracted_data.tarif or "",
            "zahlungsweise": extracted_data.zahlungsweise or "",
            "beitrag_brutto": extracted_data.beitrag_brutto or "",
            "beitrag_netto": extracted_data.beitrag_netto or "",
            "vertragsstatus": "aktiv",
            "beginn": extracted_data.beginn or "",
            "ablauf": extracted_data.ablauf or "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Auto-assign VU if gesellschaft is found
        if extracted_data.gesellschaft:
            # Use existing VU matching logic
            matching_vu, match_type = await find_matching_vu(extracted_data.gesellschaft)
            if matching_vu:
                contract_data["vu_id"] = matching_vu.id
                contract_data["vu_internal_id"] = matching_vu.vu_internal_id
        
        # Insert contract
        await db.vertraege.insert_one(contract_data)
        
        return {
            "success": True,
            "contract_id": contract_data["id"],
            "message": "Vertrag erfolgreich aus PDF erstellt",
            "extracted_data": extracted_data
        }
        
    except Exception as e:
        logger.error(f"Error creating contract from PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating contract: {str(e)}")

# Basic status endpoint
@api_router.get("/")
async def root():
    return {"message": "Versicherungsmakler Verwaltungssystem API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()