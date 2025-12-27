from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

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

# ==================== MODELS ====================

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: Literal["income", "expense"]
    color: str = "#10B981"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: Optional[str] = "#10B981"

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    type: Literal["income", "expense"]
    category_id: str
    category_name: Optional[str] = None
    date: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: Literal["income", "expense"]
    category_id: str
    date: str
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["income", "expense"]] = None
    category_id: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None

class BudgetGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    target_amount: float
    current_amount: float = 0
    type: Literal["income", "expense", "savings"]
    category_id: Optional[str] = None
    period: Literal["monthly", "yearly"]
    start_date: str
    end_date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetGoalCreate(BaseModel):
    name: str
    target_amount: float
    type: Literal["income", "expense", "savings"]
    category_id: Optional[str] = None
    period: Literal["monthly", "yearly"]
    start_date: str
    end_date: str

class BudgetGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    type: Optional[Literal["income", "expense", "savings"]] = None
    category_id: Optional[str] = None
    period: Optional[Literal["monthly", "yearly"]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category_obj = Category(**input.model_dump())
    doc = category_obj.model_dump()
    await db.categories.insert_one(doc)
    return category_obj

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryCreate):
    existing = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    update_data = input.model_dump()
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return Category(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== TRANSACTION ENDPOINTS ====================

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    if type:
        query["type"] = type
    if category_id:
        query["category_id"] = category_id
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    # Enrich with category names
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    cat_map = {c["id"]: c["name"] for c in categories}
    
    for t in transactions:
        t["category_name"] = cat_map.get(t.get("category_id"), "Unknown")
    
    return transactions

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    # Verify category exists
    category = await db.categories.find_one({"id": input.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    transaction_obj = Transaction(**input.model_dump(), category_name=category["name"])
    doc = transaction_obj.model_dump()
    await db.transactions.insert_one(doc)
    return transaction_obj

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    existing = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if "category_id" in update_data:
        category = await db.categories.find_one({"id": update_data["category_id"]}, {"_id": 0})
        if category:
            update_data["category_name"] = category["name"]
    
    await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return Transaction(**updated)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# ==================== BUDGET GOAL ENDPOINTS ====================

@api_router.get("/budget-goals", response_model=List[BudgetGoal])
async def get_budget_goals():
    goals = await db.budget_goals.find({}, {"_id": 0}).to_list(1000)
    
    # Fetch all transactions once to avoid N+1 queries
    all_transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate current amounts for each goal
    for goal in goals:
        relevant_transactions = [
            t for t in all_transactions
            if goal["start_date"] <= t["date"] <= goal["end_date"]
            and (goal["type"] not in ["income", "expense"] or t["type"] == goal["type"])
            and (not goal.get("category_id") or t["category_id"] == goal["category_id"])
        ]
        
        if goal["type"] == "savings":
            income = sum(t["amount"] for t in relevant_transactions if t["type"] == "income")
            expense = sum(t["amount"] for t in relevant_transactions if t["type"] == "expense")
            goal["current_amount"] = income - expense
        else:
            goal["current_amount"] = sum(t["amount"] for t in relevant_transactions)
    
    return goals

@api_router.post("/budget-goals", response_model=BudgetGoal)
async def create_budget_goal(input: BudgetGoalCreate):
    goal_obj = BudgetGoal(**input.model_dump())
    doc = goal_obj.model_dump()
    await db.budget_goals.insert_one(doc)
    return goal_obj

@api_router.put("/budget-goals/{goal_id}", response_model=BudgetGoal)
async def update_budget_goal(goal_id: str, input: BudgetGoalUpdate):
    existing = await db.budget_goals.find_one({"id": goal_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Budget goal not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    await db.budget_goals.update_one({"id": goal_id}, {"$set": update_data})
    updated = await db.budget_goals.find_one({"id": goal_id}, {"_id": 0})
    return BudgetGoal(**updated)

@api_router.delete("/budget-goals/{goal_id}")
async def delete_budget_goal(goal_id: str):
    result = await db.budget_goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget goal not found")
    return {"message": "Budget goal deleted"}

# ==================== DASHBOARD ENDPOINT ====================

@api_router.get("/dashboard")
async def get_dashboard():
    # Get all transactions
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate totals
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expense
    
    # Monthly breakdown (last 12 months)
    from collections import defaultdict
    monthly_data = defaultdict(lambda: {"income": 0, "expense": 0})
    
    for t in transactions:
        month_key = t["date"][:7]  # YYYY-MM
        monthly_data[month_key][t["type"]] += t["amount"]
    
    # Sort by month and get last 12
    sorted_months = sorted(monthly_data.items())[-12:]
    monthly_chart = [
        {"month": m, "income": d["income"], "expense": d["expense"]}
        for m, d in sorted_months
    ]
    
    # Category breakdown
    category_totals = defaultdict(lambda: {"income": 0, "expense": 0, "name": "", "color": "#10B981"})
    cat_map = {c["id"]: c for c in categories}
    
    for t in transactions:
        cat_id = t.get("category_id", "unknown")
        cat = cat_map.get(cat_id, {"name": "Unknown", "color": "#888888"})
        category_totals[cat_id]["name"] = cat["name"]
        category_totals[cat_id]["color"] = cat.get("color", "#10B981")
        category_totals[cat_id][t["type"]] += t["amount"]
    
    expense_by_category = [
        {"name": v["name"], "value": v["expense"], "color": v["color"]}
        for k, v in category_totals.items() if v["expense"] > 0
    ]
    
    income_by_category = [
        {"name": v["name"], "value": v["income"], "color": v["color"]}
        for k, v in category_totals.items() if v["income"] > 0
    ]
    
    # Recent transactions (last 5)
    recent = sorted(transactions, key=lambda x: x["date"], reverse=True)[:5]
    for t in recent:
        cat = cat_map.get(t.get("category_id"), {"name": "Unknown"})
        t["category_name"] = cat["name"]
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "transaction_count": len(transactions),
        "monthly_chart": monthly_chart,
        "expense_by_category": expense_by_category,
        "income_by_category": income_by_category,
        "recent_transactions": recent
    }

# ==================== SEED DATA ENDPOINT ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial categories for demo purposes"""
    default_categories = [
        {"name": "Sales Revenue", "type": "income", "color": "#10B981"},
        {"name": "Service Income", "type": "income", "color": "#3B82F6"},
        {"name": "Interest Income", "type": "income", "color": "#8B5CF6"},
        {"name": "Other Income", "type": "income", "color": "#06B6D4"},
        {"name": "Salaries", "type": "expense", "color": "#EF4444"},
        {"name": "Office Rent", "type": "expense", "color": "#F97316"},
        {"name": "Utilities", "type": "expense", "color": "#F59E0B"},
        {"name": "Marketing", "type": "expense", "color": "#EC4899"},
        {"name": "Software & Tools", "type": "expense", "color": "#6366F1"},
        {"name": "Travel", "type": "expense", "color": "#14B8A6"},
        {"name": "Equipment", "type": "expense", "color": "#84CC16"},
        {"name": "Miscellaneous", "type": "expense", "color": "#64748B"},
    ]
    
    existing = await db.categories.count_documents({})
    if existing == 0:
        for cat in default_categories:
            cat_obj = Category(**cat)
            await db.categories.insert_one(cat_obj.model_dump())
        return {"message": f"Seeded {len(default_categories)} categories"}
    return {"message": "Categories already exist"}

@api_router.get("/")
async def root():
    return {"message": "Budget Tracker API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
