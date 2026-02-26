from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'sla-engineering-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Resend setup (optional)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', '')

if RESEND_API_KEY:
    import resend
    resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI(title="Segun Labiran & Associates API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class InquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: Optional[str] = None
    service: str
    message: str

class Inquiry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    company: Optional[str] = None
    service: str
    message: str
    status: str = "new"  # new, contacted, closed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectCreate(BaseModel):
    title: str
    category: str  # structural, geotechnical, project_management, construction_supervision
    description: str
    location: str
    year: str
    client: Optional[str] = None
    image_url: Optional[str] = None
    featured: bool = False

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    description: str
    location: str
    year: str
    client: Optional[str] = None
    image_url: Optional[str] = None
    featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BlogPostCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    author: str
    image_url: Optional[str] = None
    tags: List[str] = []

class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str = ""
    excerpt: str
    content: str
    author: str
    image_url: Optional[str] = None
    tags: List[str] = []
    published: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TestimonialCreate(BaseModel):
    name: str
    position: str
    company: str
    content: str
    image_url: Optional[str] = None

class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    company: str
    content: str
    image_url: Optional[str] = None
    featured: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeamMemberCreate(BaseModel):
    name: str
    position: str
    bio: str
    image_url: Optional[str] = None
    qualifications: List[str] = []
    order: int = 0

class TeamMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    bio: str
    image_url: Optional[str] = None
    qualifications: List[str] = []
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== PUBLIC ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Segun Labiran & Associates API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Contact/Inquiry
@api_router.post("/inquiries", response_model=Inquiry)
async def create_inquiry(data: InquiryCreate):
    inquiry = Inquiry(**data.model_dump())
    doc = inquiry.model_dump()
    await db.inquiries.insert_one(doc)
    
    # Send email notification if Resend is configured
    if RESEND_API_KEY and NOTIFICATION_EMAIL:
        try:
            params = {
                "from": SENDER_EMAIL,
                "to": [NOTIFICATION_EMAIL],
                "subject": f"New Inquiry from {data.name} - {data.service}",
                "html": f"""
                <h2>New Inquiry Received</h2>
                <p><strong>Name:</strong> {data.name}</p>
                <p><strong>Email:</strong> {data.email}</p>
                <p><strong>Phone:</strong> {data.phone}</p>
                <p><strong>Company:</strong> {data.company or 'N/A'}</p>
                <p><strong>Service:</strong> {data.service}</p>
                <p><strong>Message:</strong></p>
                <p>{data.message}</p>
                """
            }
            await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email notification sent for inquiry from {data.email}")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    
    return inquiry

# Public Projects
@api_router.get("/projects", response_model=List[Project])
async def get_projects(category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Public Blog
@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(tag: Optional[str] = None):
    query = {"published": True}
    if tag:
        query["tags"] = tag
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.get("/blog/{post_id}", response_model=BlogPost)
async def get_blog_post(post_id: str):
    post = await db.blog_posts.find_one({"id": post_id, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

# Public Testimonials
@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials(featured: Optional[bool] = None):
    query = {}
    if featured is not None:
        query["featured"] = featured
    testimonials = await db.testimonials.find(query, {"_id": 0}).to_list(50)
    return testimonials

# Public Team
@api_router.get("/team", response_model=List[TeamMember])
async def get_team_members():
    members = await db.team_members.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return members

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_admin(data: AdminCreate):
    # Check if any admin exists (only allow first registration)
    existing = await db.admins.find_one({}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists. Contact system administrator.")
    
    admin = Admin(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password)
    )
    doc = admin.model_dump()
    await db.admins.insert_one(doc)
    
    token = create_token(admin.id, admin.email)
    return TokenResponse(
        access_token=token,
        admin={"id": admin.id, "email": admin.email, "name": admin.name}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin["id"], admin["email"])
    return TokenResponse(
        access_token=token,
        admin={"id": admin["id"], "email": admin["email"], "name": admin["name"]}
    )

@api_router.get("/auth/me")
async def get_me(admin: dict = Depends(get_current_admin)):
    return {"id": admin["id"], "email": admin["email"], "name": admin["name"]}

# ===================== ADMIN ROUTES =====================

# Admin Inquiries
@api_router.get("/admin/inquiries", response_model=List[Inquiry])
async def admin_get_inquiries(status: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if status:
        query["status"] = status
    inquiries = await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return inquiries

@api_router.put("/admin/inquiries/{inquiry_id}")
async def admin_update_inquiry(inquiry_id: str, status: str, admin: dict = Depends(get_current_admin)):
    result = await db.inquiries.update_one({"id": inquiry_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Inquiry updated"}

@api_router.delete("/admin/inquiries/{inquiry_id}")
async def admin_delete_inquiry(inquiry_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.inquiries.delete_one({"id": inquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Inquiry deleted"}

# Admin Projects
@api_router.post("/admin/projects", response_model=Project)
async def admin_create_project(data: ProjectCreate, admin: dict = Depends(get_current_admin)):
    project = Project(**data.model_dump())
    doc = project.model_dump()
    await db.projects.insert_one(doc)
    return project

@api_router.put("/admin/projects/{project_id}", response_model=Project)
async def admin_update_project(project_id: str, data: ProjectCreate, admin: dict = Depends(get_current_admin)):
    update_data = data.model_dump()
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return project

@api_router.delete("/admin/projects/{project_id}")
async def admin_delete_project(project_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# Admin Blog
@api_router.post("/admin/blog", response_model=BlogPost)
async def admin_create_blog(data: BlogPostCreate, admin: dict = Depends(get_current_admin)):
    slug = data.title.lower().replace(" ", "-").replace("'", "")[:50]
    post = BlogPost(**data.model_dump(), slug=slug)
    doc = post.model_dump()
    await db.blog_posts.insert_one(doc)
    return post

@api_router.put("/admin/blog/{post_id}", response_model=BlogPost)
async def admin_update_blog(post_id: str, data: BlogPostCreate, admin: dict = Depends(get_current_admin)):
    update_data = data.model_dump()
    update_data["slug"] = data.title.lower().replace(" ", "-").replace("'", "")[:50]
    result = await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return post

@api_router.put("/admin/blog/{post_id}/publish")
async def admin_toggle_publish(post_id: str, published: bool, admin: dict = Depends(get_current_admin)):
    result = await db.blog_posts.update_one({"id": post_id}, {"$set": {"published": published}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post updated"}

@api_router.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}

# Admin Testimonials
@api_router.post("/admin/testimonials", response_model=Testimonial)
async def admin_create_testimonial(data: TestimonialCreate, admin: dict = Depends(get_current_admin)):
    testimonial = Testimonial(**data.model_dump())
    doc = testimonial.model_dump()
    await db.testimonials.insert_one(doc)
    return testimonial

@api_router.put("/admin/testimonials/{testimonial_id}", response_model=Testimonial)
async def admin_update_testimonial(testimonial_id: str, data: TestimonialCreate, admin: dict = Depends(get_current_admin)):
    update_data = data.model_dump()
    result = await db.testimonials.update_one({"id": testimonial_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    testimonial = await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    return testimonial

@api_router.delete("/admin/testimonials/{testimonial_id}")
async def admin_delete_testimonial(testimonial_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}

# Admin Team
@api_router.post("/admin/team", response_model=TeamMember)
async def admin_create_team_member(data: TeamMemberCreate, admin: dict = Depends(get_current_admin)):
    member = TeamMember(**data.model_dump())
    doc = member.model_dump()
    await db.team_members.insert_one(doc)
    return member

@api_router.put("/admin/team/{member_id}", response_model=TeamMember)
async def admin_update_team_member(member_id: str, data: TeamMemberCreate, admin: dict = Depends(get_current_admin)):
    update_data = data.model_dump()
    result = await db.team_members.update_one({"id": member_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    member = await db.team_members.find_one({"id": member_id}, {"_id": 0})
    return member

@api_router.delete("/admin/team/{member_id}")
async def admin_delete_team_member(member_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.team_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted"}

# Admin Dashboard Stats
@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(get_current_admin)):
    inquiries_count = await db.inquiries.count_documents({})
    new_inquiries = await db.inquiries.count_documents({"status": "new"})
    projects_count = await db.projects.count_documents({})
    blog_count = await db.blog_posts.count_documents({})
    testimonials_count = await db.testimonials.count_documents({})
    team_count = await db.team_members.count_documents({})
    
    return {
        "inquiries": {"total": inquiries_count, "new": new_inquiries},
        "projects": projects_count,
        "blog_posts": blog_count,
        "testimonials": testimonials_count,
        "team_members": team_count
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
