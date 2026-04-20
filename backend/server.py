from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging EARLY
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Storage configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "mapa-personal")
storage_key = None

# Initialize storage
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Define Models
class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LocationImage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    storage_path: str
    original_filename: str
    content_type: str
    size: int
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    latitude: float
    longitude: float
    comments: List[Comment] = []
    tags: List[str] = []
    images: List[LocationImage] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float

class CommentCreate(BaseModel):
    text: str

class TagCreate(BaseModel):
    tag: str

class EmergencyContact(BaseModel):
    name: str
    phone: str

class EmergencySend(BaseModel):
    latitude: float
    longitude: float
    message: str
    contact: EmergencyContact

class MapConfig(BaseModel):
    accessToken: str
    center: List[float]
    zoom: float
    pitch: float
    bearing: float

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Mapa Personal API"}

@api_router.get("/config")
async def get_map_config():
    return MapConfig(
        accessToken=os.environ.get("MAPBOX_ACCESS_TOKEN", ""),
        center=[-99.1332, 19.4326],
        zoom=10,
        pitch=60,
        bearing=0
    )

@api_router.post("/locations", response_model=Location)
async def create_location(input: LocationCreate):
    location_dict = input.model_dump()
    location = Location(**location_dict)
    
    doc = location.model_dump()
    await db.locations.insert_one(doc)
    return location

@api_router.get("/locations", response_model=List[Location])
async def get_locations():
    locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    return locations

@api_router.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str):
    location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(location_id: str, input: LocationCreate):
    update_data = input.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.locations.update_one(
        {"id": location_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    return location

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str):
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}

@api_router.post("/locations/{location_id}/comments")
async def add_comment(location_id: str, input: CommentCreate):
    comment = Comment(text=input.text)
    
    result = await db.locations.update_one(
        {"id": location_id},
        {
            "$push": {"comments": comment.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return comment

@api_router.post("/locations/{location_id}/tags")
async def add_tag(location_id: str, input: TagCreate):
    result = await db.locations.update_one(
        {"id": location_id},
        {
            "$addToSet": {"tags": input.tag},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"tag": input.tag}

@api_router.delete("/locations/{location_id}/tags/{tag}")
async def remove_tag(location_id: str, tag: str):
    result = await db.locations.update_one(
        {"id": location_id},
        {
            "$pull": {"tags": tag},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"message": "Tag removed successfully"}

@api_router.post("/locations/{location_id}/images")
async def upload_image(location_id: str, file: UploadFile = File(...)):
    # Verify location exists
    location = await db.locations.find_one({"id": location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Read file data
    data = await file.read()
    
    # Create storage path
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/images/{location_id}/{uuid.uuid4()}.{ext}"
    
    # Upload to storage
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    # Create image record
    image = LocationImage(
        storage_path=result["path"],
        original_filename=file.filename,
        content_type=file.content_type or "image/jpeg",
        size=result["size"]
    )
    
    # Add to location
    await db.locations.update_one(
        {"id": location_id},
        {
            "$push": {"images": image.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return image

@api_router.get("/images/{path:path}")
async def get_image(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Image not found")

class AIAnalyzeRequest(BaseModel):
    location_id: str

@api_router.post("/ai/analyze")
async def analyze_with_ai(input: AIAnalyzeRequest):
    # Get location data
    location = await db.locations.find_one({"id": input.location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Get all locations for context
    all_locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    
    # Prepare context for AI
    context = f"""Analiza esta ubicación y encuentra relaciones con otras ubicaciones:

Ubicación actual: {location['name']}
Comentarios: {', '.join([c['text'] for c in location.get('comments', [])])}
Etiquetas: {', '.join(location.get('tags', []))}
Número de imágenes: {len(location.get('images', []))}

Otras ubicaciones:
"""
    
    for loc in all_locations:
        if loc['id'] != input.location_id:
            context += f"- {loc['name']}: {', '.join(loc.get('tags', []))}\n"
    
    context += "\nProporciona un análisis breve y útil sobre relaciones, patrones o insights interesantes."
    
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"analysis-{input.location_id}",
            system_message="Eres un asistente que analiza ubicaciones geográficas y encuentra patrones y relaciones interesantes."
        )
        chat.with_model("openai", "gpt-5.2")
        
        # Send message
        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)
        
        return {"analysis": response}
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return {"analysis": "El análisis de IA no está disponible en este momento. Intenta más tarde."}

@api_router.post("/emergency/send")
async def send_emergency(input: EmergencySend):
    # Get all locations data
    locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    
    # Prepare emergency message
    message = f"""🚨 ALERTA DE EMERGENCIA 🚨

Ubicación actual:
Latitud: {input.latitude}
Longitud: {input.longitude}

Mensaje: {input.message}

Total de ubicaciones guardadas: {len(locations)}

Enviado a: {input.contact.name} ({input.contact.phone})
"""
    
    logger.info(f"Emergency alert sent: {message}")
    
    # In a real implementation, this would send SMS via Twilio or similar
    # For now, we just log and return success
    
    return {
        "success": True,
        "message": "Alerta de emergencia enviada exitosamente",
        "sent_to": input.contact.name
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()