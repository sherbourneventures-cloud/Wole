from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import math
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Line, Rect, String, Circle
from reportlab.graphics import renderPDF

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'eurocode2_slab_design_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Eurocode 2 Slab Design API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SlabInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    # Project info
    project_name: str
    slab_type: str  # "one_way", "two_way", "flat_slab"
    
    # Geometry
    span_x: float  # mm
    span_y: Optional[float] = None  # mm (for two-way and flat slabs)
    slab_thickness: float  # mm
    
    # Materials
    concrete_grade: str  # e.g., "C25/30"
    steel_grade: str  # e.g., "B500B"
    cover: float  # mm
    
    # Loads
    dead_load: float  # kN/m2
    imposed_load: float  # kN/m2
    
    # Flat slab specific (optional)
    column_width: Optional[float] = None  # mm
    column_depth: Optional[float] = None  # mm
    drop_panel: Optional[bool] = False
    drop_thickness: Optional[float] = None  # mm
    drop_size: Optional[float] = None  # mm

class ProjectCreate(BaseModel):
    input_data: SlabInput

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_id: str
    project_name: str
    slab_type: str
    input_data: dict
    results: Optional[dict] = None
    created_at: str
    updated_at: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== EUROCODE 2 CALCULATIONS ==============

def get_concrete_properties(grade: str) -> dict:
    """Get concrete properties based on grade (EC2 Table 3.1)"""
    grades = {
        "C20/25": {"fck": 20, "fcd": 13.3, "Ecm": 30000, "fctm": 2.2},
        "C25/30": {"fck": 25, "fcd": 16.7, "Ecm": 31000, "fctm": 2.6},
        "C30/37": {"fck": 30, "fcd": 20.0, "Ecm": 33000, "fctm": 2.9},
        "C35/45": {"fck": 35, "fcd": 23.3, "Ecm": 34000, "fctm": 3.2},
        "C40/50": {"fck": 40, "fcd": 26.7, "Ecm": 35000, "fctm": 3.5},
        "C45/55": {"fck": 45, "fcd": 30.0, "Ecm": 36000, "fctm": 3.8},
        "C50/60": {"fck": 50, "fcd": 33.3, "Ecm": 37000, "fctm": 4.1},
    }
    return grades.get(grade, grades["C25/30"])

def get_steel_properties(grade: str) -> dict:
    """Get steel properties based on grade"""
    grades = {
        "B500A": {"fyk": 500, "fyd": 435, "Es": 200000},
        "B500B": {"fyk": 500, "fyd": 435, "Es": 200000},
        "B500C": {"fyk": 500, "fyd": 435, "Es": 200000},
    }
    return grades.get(grade, grades["B500B"])

def calculate_one_way_slab(input_data: SlabInput) -> dict:
    """Calculate one-way spanning slab to EC2"""
    concrete = get_concrete_properties(input_data.concrete_grade)
    steel = get_steel_properties(input_data.steel_grade)
    
    # Geometry
    L = input_data.span_x  # mm
    h = input_data.slab_thickness  # mm
    c = input_data.cover  # mm
    d = h - c - 8  # effective depth (assuming 8mm bar radius)
    
    # Loads (kN/m2 to N/mm2)
    g_k = input_data.dead_load + 25 * h / 1000  # including self-weight
    q_k = input_data.imposed_load
    n_ed = 1.35 * g_k + 1.5 * q_k  # design load (kN/m2)
    
    # Bending moment (simply supported)
    M_ed = n_ed * (L/1000)**2 / 8  # kNm per m width
    
    # Flexural design
    K = (M_ed * 1e6) / (1000 * d**2 * concrete["fcd"])
    K_bal = 0.167  # balanced limit
    
    if K > K_bal:
        # Compression reinforcement required
        compression_rebar = True
        z = 0.82 * d
    else:
        compression_rebar = False
        z = d * (0.5 + math.sqrt(0.25 - K/1.134))
        z = min(z, 0.95 * d)
    
    # Tension reinforcement
    As_req = (M_ed * 1e6) / (z * steel["fyd"])  # mm2/m
    
    # Minimum reinforcement (EC2 9.2.1.1)
    As_min = max(0.26 * concrete["fctm"] / steel["fyk"] * 1000 * d, 0.0013 * 1000 * d)
    
    # Maximum reinforcement
    As_max = 0.04 * 1000 * h
    
    As_prov = max(As_req, As_min)
    
    # Select bars
    bar_options = [
        {"dia": 8, "area": 50.3, "spacing": 1000 * 50.3 / As_prov},
        {"dia": 10, "area": 78.5, "spacing": 1000 * 78.5 / As_prov},
        {"dia": 12, "area": 113.1, "spacing": 1000 * 113.1 / As_prov},
        {"dia": 16, "area": 201.1, "spacing": 1000 * 201.1 / As_prov},
    ]
    
    # Choose suitable bar
    selected_bar = None
    for bar in bar_options:
        if 100 <= bar["spacing"] <= 300:
            selected_bar = bar
            break
    if not selected_bar:
        selected_bar = bar_options[-1]
        selected_bar["spacing"] = max(100, min(300, selected_bar["spacing"]))
    
    As_provided = 1000 * selected_bar["area"] / selected_bar["spacing"]
    
    # Shear check (EC2 6.2.2)
    rho_l = min(As_provided / (1000 * d), 0.02)
    k = min(1 + math.sqrt(200/d), 2.0)
    V_Rd_c = 0.12 * k * (100 * rho_l * concrete["fck"])**(1/3) * 1000 * d / 1000  # kN/m
    V_min = 0.035 * k**(3/2) * concrete["fck"]**0.5 * 1000 * d / 1000
    V_Rd_c = max(V_Rd_c, V_min)
    V_Ed = n_ed * L / 2000  # kN/m
    
    shear_ok = V_Ed <= V_Rd_c
    
    # Deflection check (EC2 7.4.2)
    rho = As_provided / (1000 * d)
    rho_0 = math.sqrt(concrete["fck"]) / 1000
    
    if rho <= rho_0:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / rho + 3.2 * math.sqrt(concrete["fck"]) * (rho_0/rho - 1)**(3/2)
    else:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / (rho - rho_0/12)
    
    K_factor = 1.0  # simply supported
    l_d_allowable = K_factor * l_d_basic * (500 * As_provided) / (steel["fyk"] * As_req)
    l_d_allowable = min(l_d_allowable, 40)
    
    l_d_actual = L / d
    deflection_ok = l_d_actual <= l_d_allowable
    
    # Crack width check (EC2 7.3)
    sigma_s = (M_ed * 1e6 * steel["fyd"]) / (As_provided * z * steel["fyk"])
    sigma_s = min(sigma_s, 0.8 * steel["fyk"])
    
    # Maximum bar spacing for crack control (EC2 Table 7.2N)
    if sigma_s <= 160:
        max_spacing = 300
    elif sigma_s <= 200:
        max_spacing = 250
    elif sigma_s <= 240:
        max_spacing = 200
    elif sigma_s <= 280:
        max_spacing = 150
    elif sigma_s <= 320:
        max_spacing = 100
    else:
        max_spacing = 50
    
    crack_ok = selected_bar["spacing"] <= max_spacing
    
    return {
        "calculation_type": "One-Way Slab Design to EC2",
        "geometry": {
            "span": L,
            "thickness": h,
            "effective_depth": round(d, 1),
            "cover": c,
            "unit": "mm"
        },
        "materials": {
            "concrete_grade": input_data.concrete_grade,
            "fck": concrete["fck"],
            "fcd": concrete["fcd"],
            "steel_grade": input_data.steel_grade,
            "fyk": steel["fyk"],
            "fyd": steel["fyd"]
        },
        "loads": {
            "dead_load": round(g_k, 2),
            "imposed_load": q_k,
            "design_load": round(n_ed, 2),
            "unit": "kN/m2"
        },
        "bending": {
            "M_Ed": round(M_ed, 2),
            "K": round(K, 4),
            "K_bal": K_bal,
            "z": round(z, 1),
            "compression_required": compression_rebar,
            "unit_moment": "kNm/m"
        },
        "reinforcement": {
            "As_required": round(As_req, 1),
            "As_minimum": round(As_min, 1),
            "As_maximum": round(As_max, 1),
            "bar_diameter": selected_bar["dia"],
            "bar_spacing": round(selected_bar["spacing"], 0),
            "As_provided": round(As_provided, 1),
            "utilisation": round(As_req / As_provided * 100, 1),
            "unit": "mm2/m"
        },
        "shear": {
            "V_Ed": round(V_Ed, 2),
            "V_Rd_c": round(V_Rd_c, 2),
            "shear_ok": shear_ok,
            "utilisation": round(V_Ed / V_Rd_c * 100, 1),
            "unit": "kN/m"
        },
        "deflection": {
            "L_d_actual": round(l_d_actual, 1),
            "L_d_allowable": round(l_d_allowable, 1),
            "deflection_ok": deflection_ok,
            "utilisation": round(l_d_actual / l_d_allowable * 100, 1)
        },
        "crack_control": {
            "steel_stress": round(sigma_s, 1),
            "max_bar_spacing": max_spacing,
            "actual_spacing": round(selected_bar["spacing"], 0),
            "crack_ok": crack_ok,
            "unit_stress": "MPa"
        },
        "summary": {
            "all_checks_pass": shear_ok and deflection_ok and crack_ok,
            "critical_check": "Deflection" if not deflection_ok else ("Shear" if not shear_ok else ("Crack" if not crack_ok else "All OK"))
        }
    }

def calculate_two_way_slab(input_data: SlabInput) -> dict:
    """Calculate two-way spanning slab to EC2"""
    concrete = get_concrete_properties(input_data.concrete_grade)
    steel = get_steel_properties(input_data.steel_grade)
    
    # Geometry
    Lx = input_data.span_x  # shorter span (mm)
    Ly = input_data.span_y  # longer span (mm)
    if Ly < Lx:
        Lx, Ly = Ly, Lx
    
    h = input_data.slab_thickness
    c = input_data.cover
    d = h - c - 8
    
    # Check if truly two-way
    ratio = Ly / Lx
    if ratio > 2:
        return calculate_one_way_slab(input_data)
    
    # Loads
    g_k = input_data.dead_load + 25 * h / 1000
    q_k = input_data.imposed_load
    n_ed = 1.35 * g_k + 1.5 * q_k
    
    # Moment coefficients (simply supported edges)
    # Using Pigeaud coefficients
    alpha_sx = 0.047 * (1 - (ratio - 1)**2 / 4)
    alpha_sy = 0.047 * (1 - 1/(4 * ratio**2))
    
    # Bending moments
    M_ed_x = alpha_sx * n_ed * (Lx/1000)**2
    M_ed_y = alpha_sy * n_ed * (Ly/1000)**2
    
    # Reinforcement calculation for both directions
    def calc_reinforcement(M_ed, d_eff):
        K = (M_ed * 1e6) / (1000 * d_eff**2 * concrete["fcd"])
        if K > 0.167:
            z = 0.82 * d_eff
        else:
            z = d_eff * (0.5 + math.sqrt(0.25 - K/1.134))
            z = min(z, 0.95 * d_eff)
        As_req = (M_ed * 1e6) / (z * steel["fyd"])
        return As_req, K, z
    
    As_req_x, K_x, z_x = calc_reinforcement(M_ed_x, d)
    As_req_y, K_y, z_y = calc_reinforcement(M_ed_y, d - 12)  # second layer
    
    As_min = max(0.26 * concrete["fctm"] / steel["fyk"] * 1000 * d, 0.0013 * 1000 * d)
    
    As_x = max(As_req_x, As_min)
    As_y = max(As_req_y, As_min)
    
    # Select bars for both directions
    def select_bars(As_req):
        bar_options = [
            {"dia": 8, "area": 50.3},
            {"dia": 10, "area": 78.5},
            {"dia": 12, "area": 113.1},
            {"dia": 16, "area": 201.1},
        ]
        for bar in bar_options:
            spacing = 1000 * bar["area"] / As_req
            if 100 <= spacing <= 300:
                return {"dia": bar["dia"], "spacing": round(spacing), "As_prov": 1000 * bar["area"] / spacing}
        bar = bar_options[-1]
        return {"dia": bar["dia"], "spacing": 150, "As_prov": 1000 * bar["area"] / 150}
    
    rebar_x = select_bars(As_x)
    rebar_y = select_bars(As_y)
    
    # Punching shear at corners (simplified)
    V_Ed = n_ed * Lx * Ly / (4 * 1e6)  # kN at corner
    
    # Deflection check
    rho = rebar_x["As_prov"] / (1000 * d)
    rho_0 = math.sqrt(concrete["fck"]) / 1000
    if rho <= rho_0:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / rho
    else:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / (rho - rho_0/12)
    
    K_factor = 1.3  # two-way spanning
    l_d_allowable = min(K_factor * l_d_basic, 40)
    l_d_actual = Lx / d
    deflection_ok = l_d_actual <= l_d_allowable
    
    return {
        "calculation_type": "Two-Way Slab Design to EC2",
        "geometry": {
            "span_x": Lx,
            "span_y": Ly,
            "aspect_ratio": round(ratio, 2),
            "thickness": h,
            "effective_depth": round(d, 1),
            "cover": c,
            "unit": "mm"
        },
        "materials": {
            "concrete_grade": input_data.concrete_grade,
            "fck": concrete["fck"],
            "fcd": concrete["fcd"],
            "steel_grade": input_data.steel_grade,
            "fyk": steel["fyk"],
            "fyd": steel["fyd"]
        },
        "loads": {
            "dead_load": round(g_k, 2),
            "imposed_load": q_k,
            "design_load": round(n_ed, 2),
            "unit": "kN/m2"
        },
        "bending_x": {
            "alpha": round(alpha_sx, 4),
            "M_Ed": round(M_ed_x, 2),
            "K": round(K_x, 4),
            "z": round(z_x, 1),
            "unit": "kNm/m"
        },
        "bending_y": {
            "alpha": round(alpha_sy, 4),
            "M_Ed": round(M_ed_y, 2),
            "K": round(K_y, 4),
            "z": round(z_y, 1),
            "unit": "kNm/m"
        },
        "reinforcement_x": {
            "As_required": round(As_req_x, 1),
            "As_minimum": round(As_min, 1),
            "bar_diameter": rebar_x["dia"],
            "bar_spacing": rebar_x["spacing"],
            "As_provided": round(rebar_x["As_prov"], 1),
            "utilisation": round(As_req_x / rebar_x["As_prov"] * 100, 1),
            "unit": "mm2/m"
        },
        "reinforcement_y": {
            "As_required": round(As_req_y, 1),
            "bar_diameter": rebar_y["dia"],
            "bar_spacing": rebar_y["spacing"],
            "As_provided": round(rebar_y["As_prov"], 1),
            "utilisation": round(As_req_y / rebar_y["As_prov"] * 100, 1),
            "unit": "mm2/m"
        },
        "deflection": {
            "L_d_actual": round(l_d_actual, 1),
            "L_d_allowable": round(l_d_allowable, 1),
            "deflection_ok": deflection_ok,
            "utilisation": round(l_d_actual / l_d_allowable * 100, 1)
        },
        "summary": {
            "all_checks_pass": deflection_ok,
            "critical_check": "Deflection" if not deflection_ok else "All OK"
        }
    }

def calculate_flat_slab(input_data: SlabInput) -> dict:
    """Calculate flat slab to EC2"""
    concrete = get_concrete_properties(input_data.concrete_grade)
    steel = get_steel_properties(input_data.steel_grade)
    
    # Geometry
    Lx = input_data.span_x
    Ly = input_data.span_y
    h = input_data.slab_thickness
    c = input_data.cover
    d = h - c - 10  # larger bars typically used
    
    col_b = input_data.column_width or 400
    col_h = input_data.column_depth or 400
    
    has_drop = input_data.drop_panel or False
    drop_h = input_data.drop_thickness or 0
    drop_size = input_data.drop_size or 0
    
    # Effective depth at drop (if applicable)
    d_drop = h + drop_h - c - 10 if has_drop else d
    
    # Loads
    g_k = input_data.dead_load + 25 * h / 1000
    if has_drop:
        g_k += 25 * drop_h * (drop_size/1000)**2 / (Lx/1000 * Ly/1000) / 1000
    q_k = input_data.imposed_load
    n_ed = 1.35 * g_k + 1.5 * q_k
    
    # Total panel moment (simplified equivalent frame)
    L0 = Lx - col_b  # clear span
    M_0 = n_ed * (Lx/1000) * (L0/1000)**2 / 8  # total moment per panel width
    
    # Moment distribution (EC2 I.1)
    M_neg = 0.75 * M_0  # negative moment at support
    M_pos = 0.55 * M_0  # positive moment at midspan
    
    # Column strip width (EC2 5.3.2)
    col_strip_width = min(Lx, Ly) / 2
    middle_strip_width = Ly - col_strip_width
    
    # Moment allocation to strips
    M_neg_col_strip = 0.75 * M_neg  # 75% to column strip
    M_neg_mid_strip = 0.25 * M_neg
    M_pos_col_strip = 0.55 * M_pos
    M_pos_mid_strip = 0.45 * M_pos
    
    # Design moments per meter width
    m_neg_col = M_neg_col_strip * 1000 / col_strip_width
    m_neg_mid = M_neg_mid_strip * 1000 / middle_strip_width
    m_pos_col = M_pos_col_strip * 1000 / col_strip_width
    m_pos_mid = M_pos_mid_strip * 1000 / middle_strip_width
    
    # Reinforcement calculation
    def calc_rebar(m_ed, d_eff):
        K = (m_ed * 1e6) / (1000 * d_eff**2 * concrete["fcd"])
        z = d_eff * (0.5 + math.sqrt(0.25 - min(K, 0.167)/1.134))
        z = min(z, 0.95 * d_eff)
        As_req = (m_ed * 1e6) / (z * steel["fyd"])
        As_min = max(0.26 * concrete["fctm"] / steel["fyk"] * 1000 * d_eff, 0.0013 * 1000 * d_eff)
        As = max(As_req, As_min)
        return {"As_req": round(As, 1), "K": round(K, 4), "z": round(z, 1)}
    
    rebar_neg_col = calc_rebar(m_neg_col, d_drop if has_drop else d)
    rebar_neg_mid = calc_rebar(m_neg_mid, d)
    rebar_pos_col = calc_rebar(m_pos_col, d)
    rebar_pos_mid = calc_rebar(m_pos_mid, d)
    
    # Punching shear (EC2 6.4)
    # Control perimeter at 2d from column face
    u_0 = 2 * (col_b + col_h)  # column perimeter
    u_1 = u_0 + 4 * math.pi * d  # basic control perimeter
    
    V_Ed = n_ed * (Lx/1000) * (Ly/1000) - n_ed * (col_b/1000) * (col_h/1000)  # reaction minus direct load
    
    # Shear stress
    v_Ed = V_Ed * 1000 / (u_1 * d)  # N/mm2
    
    # Punching shear resistance (EC2 6.4.4)
    rho_l = min(rebar_neg_col["As_req"] / (1000 * d), 0.02)
    k = min(1 + math.sqrt(200/d), 2.0)
    v_Rd_c = 0.12 * k * (100 * rho_l * concrete["fck"])**(1/3)
    v_min = 0.035 * k**(3/2) * concrete["fck"]**0.5
    v_Rd_c = max(v_Rd_c, v_min)
    
    punching_ok = v_Ed <= v_Rd_c
    
    # Deflection check
    rho = rebar_pos_col["As_req"] / (1000 * d)
    rho_0 = math.sqrt(concrete["fck"]) / 1000
    if rho <= rho_0:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / rho
    else:
        l_d_basic = 11 + 1.5 * math.sqrt(concrete["fck"]) * rho_0 / (rho - rho_0/12)
    
    K_factor = 1.2  # flat slab
    l_d_allowable = min(K_factor * l_d_basic, 35)
    l_d_actual = max(Lx, Ly) / d
    deflection_ok = l_d_actual <= l_d_allowable
    
    return {
        "calculation_type": "Flat Slab Design to EC2",
        "geometry": {
            "span_x": Lx,
            "span_y": Ly,
            "thickness": h,
            "effective_depth": round(d, 1),
            "cover": c,
            "column_width": col_b,
            "column_depth": col_h,
            "has_drop_panel": has_drop,
            "drop_thickness": drop_h if has_drop else None,
            "drop_size": drop_size if has_drop else None,
            "column_strip_width": round(col_strip_width, 0),
            "middle_strip_width": round(middle_strip_width, 0),
            "unit": "mm"
        },
        "materials": {
            "concrete_grade": input_data.concrete_grade,
            "fck": concrete["fck"],
            "fcd": concrete["fcd"],
            "steel_grade": input_data.steel_grade,
            "fyk": steel["fyk"],
            "fyd": steel["fyd"]
        },
        "loads": {
            "dead_load": round(g_k, 2),
            "imposed_load": q_k,
            "design_load": round(n_ed, 2),
            "unit": "kN/m2"
        },
        "panel_moments": {
            "M_0_total": round(M_0, 2),
            "M_negative": round(M_neg, 2),
            "M_positive": round(M_pos, 2),
            "unit": "kNm"
        },
        "reinforcement": {
            "column_strip_negative": {
                "moment": round(m_neg_col, 2),
                **rebar_neg_col,
                "unit": "kNm/m, mm2/m"
            },
            "column_strip_positive": {
                "moment": round(m_pos_col, 2),
                **rebar_pos_col,
                "unit": "kNm/m, mm2/m"
            },
            "middle_strip_negative": {
                "moment": round(m_neg_mid, 2),
                **rebar_neg_mid,
                "unit": "kNm/m, mm2/m"
            },
            "middle_strip_positive": {
                "moment": round(m_pos_mid, 2),
                **rebar_pos_mid,
                "unit": "kNm/m, mm2/m"
            }
        },
        "punching_shear": {
            "V_Ed": round(V_Ed, 2),
            "control_perimeter": round(u_1, 0),
            "v_Ed": round(v_Ed, 3),
            "v_Rd_c": round(v_Rd_c, 3),
            "punching_ok": punching_ok,
            "utilisation": round(v_Ed / v_Rd_c * 100, 1),
            "unit": "kN, mm, N/mm2"
        },
        "deflection": {
            "L_d_actual": round(l_d_actual, 1),
            "L_d_allowable": round(l_d_allowable, 1),
            "deflection_ok": deflection_ok,
            "utilisation": round(l_d_actual / l_d_allowable * 100, 1)
        },
        "summary": {
            "all_checks_pass": punching_ok and deflection_ok,
            "critical_check": "Punching" if not punching_ok else ("Deflection" if not deflection_ok else "All OK")
        }
    }

def run_calculation(input_data: SlabInput) -> dict:
    """Run appropriate calculation based on slab type"""
    if input_data.slab_type == "one_way":
        return calculate_one_way_slab(input_data)
    elif input_data.slab_type == "two_way":
        return calculate_two_way_slab(input_data)
    elif input_data.slab_type == "flat_slab":
        return calculate_flat_slab(input_data)
    else:
        raise ValueError(f"Unknown slab type: {input_data.slab_type}")

# ============== PDF GENERATION ==============

def generate_pdf_report(project: dict) -> BytesIO:
    """Generate detailed PDF report for slab design"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Title2', parent=styles['Title'], fontSize=18, spaceAfter=12))
    styles.add(ParagraphStyle(name='Heading3', parent=styles['Heading2'], fontSize=12, spaceAfter=6))
    styles.add(ParagraphStyle(name='SmallBody', parent=styles['Normal'], fontSize=9))
    
    story = []
    results = project.get("results", {})
    input_data = project.get("input_data", {})
    
    # Title
    story.append(Paragraph(f"STRUCTURAL DESIGN REPORT", styles['Title']))
    story.append(Paragraph(f"Slab Design to Eurocode 2", styles['Title2']))
    story.append(Spacer(1, 10*mm))
    
    # Project Info
    story.append(Paragraph("PROJECT INFORMATION", styles['Heading2']))
    project_info = [
        ["Project Name:", project.get("project_name", "N/A")],
        ["Calculation Type:", results.get("calculation_type", "N/A")],
        ["Date:", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")],
    ]
    t = Table(project_info, colWidths=[50*mm, 100*mm])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(Spacer(1, 8*mm))
    
    # Geometry
    if "geometry" in results:
        story.append(Paragraph("1. GEOMETRY", styles['Heading2']))
        geo = results["geometry"]
        geo_data = []
        for key, value in geo.items():
            if key != "unit" and value is not None:
                label = key.replace("_", " ").title()
                geo_data.append([f"{label}:", f"{value} {'mm' if 'mm' in str(geo.get('unit', '')) else ''}"])
        if geo_data:
            t = Table(geo_data, colWidths=[60*mm, 50*mm])
            t.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Materials
    if "materials" in results:
        story.append(Paragraph("2. MATERIAL PROPERTIES", styles['Heading2']))
        mat = results["materials"]
        mat_data = [
            ["Concrete Grade:", mat.get("concrete_grade", "N/A")],
            ["fck:", f"{mat.get('fck', 'N/A')} MPa"],
            ["fcd:", f"{mat.get('fcd', 'N/A')} MPa"],
            ["Steel Grade:", mat.get("steel_grade", "N/A")],
            ["fyk:", f"{mat.get('fyk', 'N/A')} MPa"],
            ["fyd:", f"{mat.get('fyd', 'N/A')} MPa"],
        ]
        t = Table(mat_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Loads
    if "loads" in results:
        story.append(Paragraph("3. LOADING", styles['Heading2']))
        loads = results["loads"]
        loads_data = [
            ["Dead Load (incl. self-weight):", f"{loads.get('dead_load', 'N/A')} kN/m²"],
            ["Imposed Load:", f"{loads.get('imposed_load', 'N/A')} kN/m²"],
            ["Design Load (ULS):", f"{loads.get('design_load', 'N/A')} kN/m²"],
        ]
        t = Table(loads_data, colWidths=[60*mm, 40*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t)
        story.append(Paragraph("Load Combination: 1.35Gk + 1.50Qk (EC2 Exp. 6.10)", styles['SmallBody']))
        story.append(Spacer(1, 6*mm))
    
    # Bending Design
    story.append(Paragraph("4. FLEXURAL DESIGN", styles['Heading2']))
    
    if "bending" in results:
        bend = results["bending"]
        story.append(Paragraph("Design Moment and Reinforcement:", styles['Heading3']))
        bend_data = [
            ["Design Moment M_Ed:", f"{bend.get('M_Ed', 'N/A')} kNm/m"],
            ["K factor:", f"{bend.get('K', 'N/A')}"],
            ["K balanced:", f"{bend.get('K_bal', 'N/A')}"],
            ["Lever arm z:", f"{bend.get('z', 'N/A')} mm"],
            ["Compression steel:", "Required" if bend.get('compression_required') else "Not Required"],
        ]
        t = Table(bend_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
        story.append(t)
    
    if "bending_x" in results and "bending_y" in results:
        story.append(Paragraph("X-Direction:", styles['Heading3']))
        bx = results["bending_x"]
        bend_x_data = [
            ["Moment coefficient:", f"{bx.get('alpha', 'N/A')}"],
            ["M_Ed,x:", f"{bx.get('M_Ed', 'N/A')} kNm/m"],
        ]
        t = Table(bend_x_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
        story.append(t)
        
        story.append(Paragraph("Y-Direction:", styles['Heading3']))
        by = results["bending_y"]
        bend_y_data = [
            ["Moment coefficient:", f"{by.get('alpha', 'N/A')}"],
            ["M_Ed,y:", f"{by.get('M_Ed', 'N/A')} kNm/m"],
        ]
        t = Table(bend_y_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
        story.append(t)
    
    story.append(Spacer(1, 6*mm))
    
    # Reinforcement
    story.append(Paragraph("5. REINFORCEMENT DESIGN", styles['Heading2']))
    
    if "reinforcement" in results:
        rebar = results["reinforcement"]
        if "bar_diameter" in rebar:  # One-way slab
            rebar_data = [
                ["As required:", f"{rebar.get('As_required', 'N/A')} mm²/m"],
                ["As minimum:", f"{rebar.get('As_minimum', 'N/A')} mm²/m"],
                ["Bar diameter:", f"T{rebar.get('bar_diameter', 'N/A')}"],
                ["Bar spacing:", f"{rebar.get('bar_spacing', 'N/A')} mm"],
                ["As provided:", f"{rebar.get('As_provided', 'N/A')} mm²/m"],
                ["Utilisation:", f"{rebar.get('utilisation', 'N/A')}%"],
            ]
            t = Table(rebar_data, colWidths=[50*mm, 40*mm])
            t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
            story.append(t)
        else:  # Flat slab
            for strip_name, strip_data in rebar.items():
                story.append(Paragraph(strip_name.replace("_", " ").title() + ":", styles['Heading3']))
                strip_table = [
                    ["Moment:", f"{strip_data.get('moment', 'N/A')} kNm/m"],
                    ["As required:", f"{strip_data.get('As_req', 'N/A')} mm²/m"],
                ]
                t = Table(strip_table, colWidths=[50*mm, 40*mm])
                t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
                story.append(t)
    
    if "reinforcement_x" in results:
        story.append(Paragraph("X-Direction Reinforcement:", styles['Heading3']))
        rx = results["reinforcement_x"]
        rx_data = [
            ["As required:", f"{rx.get('As_required', 'N/A')} mm²/m"],
            ["Bar:", f"T{rx.get('bar_diameter', 'N/A')} @ {rx.get('bar_spacing', 'N/A')} mm"],
            ["As provided:", f"{rx.get('As_provided', 'N/A')} mm²/m"],
        ]
        t = Table(rx_data, colWidths=[50*mm, 50*mm])
        t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
        story.append(t)
        
    if "reinforcement_y" in results:
        story.append(Paragraph("Y-Direction Reinforcement:", styles['Heading3']))
        ry = results["reinforcement_y"]
        ry_data = [
            ["As required:", f"{ry.get('As_required', 'N/A')} mm²/m"],
            ["Bar:", f"T{ry.get('bar_diameter', 'N/A')} @ {ry.get('bar_spacing', 'N/A')} mm"],
            ["As provided:", f"{ry.get('As_provided', 'N/A')} mm²/m"],
        ]
        t = Table(ry_data, colWidths=[50*mm, 50*mm])
        t.setStyle(TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9)]))
        story.append(t)
    
    story.append(Spacer(1, 6*mm))
    
    # Shear Check
    if "shear" in results:
        story.append(Paragraph("6. SHEAR VERIFICATION (EC2 6.2)", styles['Heading2']))
        shear = results["shear"]
        shear_data = [
            ["V_Ed:", f"{shear.get('V_Ed', 'N/A')} kN/m"],
            ["V_Rd,c:", f"{shear.get('V_Rd_c', 'N/A')} kN/m"],
            ["Utilisation:", f"{shear.get('utilisation', 'N/A')}%"],
            ["Status:", "PASS" if shear.get('shear_ok') else "FAIL"],
        ]
        t = Table(shear_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (-1, -1), (-1, -1), colors.green if shear.get('shear_ok') else colors.red),
        ]))
        story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Punching Shear
    if "punching_shear" in results:
        story.append(Paragraph("6. PUNCHING SHEAR (EC2 6.4)", styles['Heading2']))
        punch = results["punching_shear"]
        punch_data = [
            ["Reaction V_Ed:", f"{punch.get('V_Ed', 'N/A')} kN"],
            ["Control perimeter u1:", f"{punch.get('control_perimeter', 'N/A')} mm"],
            ["v_Ed:", f"{punch.get('v_Ed', 'N/A')} N/mm²"],
            ["v_Rd,c:", f"{punch.get('v_Rd_c', 'N/A')} N/mm²"],
            ["Utilisation:", f"{punch.get('utilisation', 'N/A')}%"],
            ["Status:", "PASS" if punch.get('punching_ok') else "FAIL"],
        ]
        t = Table(punch_data, colWidths=[50*mm, 50*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (-1, -1), (-1, -1), colors.green if punch.get('punching_ok') else colors.red),
        ]))
        story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Deflection Check
    if "deflection" in results:
        story.append(Paragraph("7. DEFLECTION CHECK (EC2 7.4)", styles['Heading2']))
        defl = results["deflection"]
        defl_data = [
            ["L/d actual:", f"{defl.get('L_d_actual', 'N/A')}"],
            ["L/d allowable:", f"{defl.get('L_d_allowable', 'N/A')}"],
            ["Utilisation:", f"{defl.get('utilisation', 'N/A')}%"],
            ["Status:", "PASS" if defl.get('deflection_ok') else "FAIL"],
        ]
        t = Table(defl_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (-1, -1), (-1, -1), colors.green if defl.get('deflection_ok') else colors.red),
        ]))
        story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Crack Control
    if "crack_control" in results:
        story.append(Paragraph("8. CRACK WIDTH CONTROL (EC2 7.3)", styles['Heading2']))
        crack = results["crack_control"]
        crack_data = [
            ["Steel stress σ_s:", f"{crack.get('steel_stress', 'N/A')} MPa"],
            ["Max bar spacing:", f"{crack.get('max_bar_spacing', 'N/A')} mm"],
            ["Actual spacing:", f"{crack.get('actual_spacing', 'N/A')} mm"],
            ["Status:", "PASS" if crack.get('crack_ok') else "FAIL"],
        ]
        t = Table(crack_data, colWidths=[50*mm, 40*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (-1, -1), (-1, -1), colors.green if crack.get('crack_ok') else colors.red),
        ]))
        story.append(t)
        story.append(Spacer(1, 6*mm))
    
    # Summary
    story.append(Paragraph("DESIGN SUMMARY", styles['Heading2']))
    summary = results.get("summary", {})
    status = "ALL CHECKS PASS" if summary.get("all_checks_pass") else f"CRITICAL: {summary.get('critical_check', 'Review Required')}"
    status_color = colors.green if summary.get("all_checks_pass") else colors.red
    
    summary_data = [
        ["Overall Status:", status],
    ]
    t = Table(summary_data, colWidths=[50*mm, 80*mm])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 0), (1, 0), status_color),
    ]))
    story.append(t)
    
    # Footer
    story.append(Spacer(1, 15*mm))
    story.append(Paragraph("This calculation has been prepared in accordance with Eurocode 2 (BS EN 1992-1-1).", styles['SmallBody']))
    story.append(Paragraph("All results should be verified by a qualified structural engineer.", styles['SmallBody']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Eurocode 2 Slab Design API", "version": "1.0.0"}

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed = hash_password(user.password)
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hashed,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name, created_at=user_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# Project routes
@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    input_data = project.input_data
    
    # Run calculations
    try:
        results = run_calculation(input_data)
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")
    
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "project_name": input_data.project_name,
        "slab_type": input_data.slab_type,
        "input_data": input_data.model_dump(),
        "results": results,
        "created_at": now,
        "updated_at": now
    }
    
    await db.projects.insert_one(project_doc)
    
    return ProjectResponse(**{k: v for k, v in project_doc.items() if k != "_id"})

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return [ProjectResponse(**p) for p in projects]

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**project)

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    input_data = project.input_data
    
    try:
        results = run_calculation(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "project_name": input_data.project_name,
            "slab_type": input_data.slab_type,
            "input_data": input_data.model_dump(),
            "results": results,
            "updated_at": now
        }}
    )
    
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return ProjectResponse(**updated)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# PDF Generation
@api_router.get("/projects/{project_id}/pdf")
async def download_pdf(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        pdf_buffer = generate_pdf_report(project)
        filename = f"{project['project_name'].replace(' ', '_')}_design_report.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

# Include router
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
