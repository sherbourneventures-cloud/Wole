from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64

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

# ===================== MODELS =====================

class Location(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    owner_email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class LocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_email: str

class VisitorRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    visitor_name: str
    visitor_phone: str
    visitor_email: str
    purpose: str
    media_type: str  # 'photo' or 'video'
    media_base64: str
    status: str = "pending"  # pending, approved, denied
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notification_sent: bool = False

class VisitorRequestCreate(BaseModel):
    location_id: str
    visitor_name: str
    visitor_phone: str
    visitor_email: str
    purpose: str
    media_type: str
    media_base64: str

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_email: str
    visitor_request_id: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ===================== LOCATION ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "QR Visitor Alert API is running"}

@api_router.post("/locations", response_model=Location)
async def create_location(location: LocationCreate):
    location_obj = Location(**location.dict())
    await db.locations.insert_one(location_obj.dict())
    return location_obj

@api_router.get("/locations", response_model=List[Location])
async def get_locations(owner_email: Optional[str] = None):
    query = {}
    if owner_email:
        query["owner_email"] = owner_email
    locations = await db.locations.find(query).to_list(1000)
    return [Location(**loc) for loc in locations]

@api_router.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str):
    location = await db.locations.find_one({"id": location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return Location(**location)

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str):
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}

# ===================== VISITOR REQUEST ENDPOINTS =====================

@api_router.post("/visitor-requests", response_model=VisitorRequest)
async def create_visitor_request(request: VisitorRequestCreate):
    # Verify location exists
    location = await db.locations.find_one({"id": request.location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    visitor_obj = VisitorRequest(**request.dict())
    await db.visitor_requests.insert_one(visitor_obj.dict())
    
    # Create notification for owner
    notification = Notification(
        owner_email=location["owner_email"],
        visitor_request_id=visitor_obj.id,
        message=f"New visitor: {request.visitor_name} wants to enter {location['name']}. Purpose: {request.purpose}"
    )
    await db.notifications.insert_one(notification.dict())
    
    # Mock email notification (log it)
    logger.info(f"📧 MOCK EMAIL to sherbourneventures@gmail.com:")
    logger.info(f"   Subject: New Visitor Request at {location['name']}")
    logger.info(f"   Visitor: {request.visitor_name}")
    logger.info(f"   Phone: {request.visitor_phone}")
    logger.info(f"   Email: {request.visitor_email}")
    logger.info(f"   Purpose: {request.purpose}")
    logger.info(f"   Media Type: {request.media_type}")
    
    return visitor_obj

@api_router.get("/visitor-requests", response_model=List[VisitorRequest])
async def get_visitor_requests(location_id: Optional[str] = None):
    query = {}
    if location_id:
        query["location_id"] = location_id
    requests = await db.visitor_requests.find(query).sort("created_at", -1).to_list(1000)
    return [VisitorRequest(**req) for req in requests]

@api_router.get("/visitor-requests/{request_id}", response_model=VisitorRequest)
async def get_visitor_request(request_id: str):
    request = await db.visitor_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Visitor request not found")
    return VisitorRequest(**request)

@api_router.patch("/visitor-requests/{request_id}/status")
async def update_visitor_status(request_id: str, status: str):
    if status not in ["pending", "approved", "denied"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.visitor_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visitor request not found")
    return {"message": f"Status updated to {status}"}

# ===================== NOTIFICATION ENDPOINTS =====================

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(owner_email: str, unread_only: bool = False):
    query = {"owner_email": owner_email}
    if unread_only:
        query["is_read"] = False
    notifications = await db.notifications.find(query).sort("created_at", -1).to_list(100)
    return [Notification(**n) for n in notifications]

@api_router.get("/notifications/count")
async def get_notification_count(owner_email: str):
    count = await db.notifications.count_documents({"owner_email": owner_email, "is_read": False})
    return {"unread_count": count}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.patch("/notifications/mark-all-read")
async def mark_all_notifications_read(owner_email: str):
    await db.notifications.update_many(
        {"owner_email": owner_email, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
