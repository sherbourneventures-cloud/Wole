"""
BeamForge - Prestressed Beam Design API
FastAPI backend for Eurocode 2 compliant prestressed beam design
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from models import (
    BeamDesignInput, BeamDesignOutput, AnalysisResults, ProjectSummary,
    BeamSection, RectangularSection, TBeamSection, IBeamSection, BoxGirderSection,
    ConcreteProperties, PrestressingSteel, PrestressInput, TendonGeometry, LoadCase,
    SectionProperties, MagnelDiagram
)
from calculations import (
    calculate_concrete_properties, calculate_section_properties,
    perform_full_analysis, get_section_height
)
from pdf_generator import generate_pdf_report


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(
    title="BeamForge API",
    description="Prestressed Beam Design API per Eurocode 2",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Request/Response Models
class ConcreteInput(BaseModel):
    fck: float = Field(..., description="Characteristic cylinder strength (MPa)")
    creep_coefficient: float = Field(default=2.0)
    shrinkage_strain: float = Field(default=0.0003)
    density: float = Field(default=25.0)


class SteelInput(BaseModel):
    fp01k: float = Field(default=1640, description="0.1% proof stress (MPa)")
    fpk: float = Field(default=1860, description="Tensile strength (MPa)")
    Ep: float = Field(default=195, description="Modulus of elasticity (GPa)")
    strand_area: float = Field(default=140, description="Area per strand (mm²)")
    num_strands: int = Field(default=12)
    relaxation_class: int = Field(default=2)


class DesignRequest(BaseModel):
    project_name: str = Field(default="Untitled Project")
    beam_name: str = Field(default="Beam 1")
    
    # Geometry
    span: float = Field(..., description="Beam span (m)")
    section_type: str = Field(..., description="rectangular, t_beam, i_beam, box_girder")
    
    # Section dimensions
    width: Optional[float] = Field(None, description="Width for rectangular (mm)")
    height: Optional[float] = Field(None, description="Height (mm)")
    bw: Optional[float] = Field(None, description="Web width (mm)")
    bf: Optional[float] = Field(None, description="Flange width (mm)")
    hf: Optional[float] = Field(None, description="Flange thickness (mm)")
    bf_top: Optional[float] = Field(None)
    bf_bot: Optional[float] = Field(None)
    hf_top: Optional[float] = Field(None)
    hf_bot: Optional[float] = Field(None)
    b_top: Optional[float] = Field(None)
    b_bot: Optional[float] = Field(None)
    b_int: Optional[float] = Field(None)
    t_top: Optional[float] = Field(None)
    t_bot: Optional[float] = Field(None)
    t_web: Optional[float] = Field(None)
    
    # Materials
    concrete: ConcreteInput
    steel: SteelInput
    
    # Prestress
    prestress_type: str = Field(default="post_tensioned")
    jacking_stress: float = Field(default=1400)
    tendon_profile: str = Field(default="parabolic")
    eccentricity: Optional[float] = Field(None)
    e_end: Optional[float] = Field(None)
    e_mid: Optional[float] = Field(None)
    e_support: Optional[float] = Field(None)
    e_drape: Optional[float] = Field(None)
    drape_position: Optional[float] = Field(None)
    friction_coefficient: float = Field(default=0.19)
    wobble_coefficient: float = Field(default=0.008)
    
    # Loads
    include_self_weight: bool = Field(default=True)
    imposed_udl: float = Field(default=0, description="Imposed UDL (kN/m)")
    permanent_udl: float = Field(default=0, description="Additional permanent UDL (kN/m)")


class QuickCalcRequest(BaseModel):
    """Quick calculation request for section properties"""
    section_type: str
    width: Optional[float] = None
    height: Optional[float] = None
    bw: Optional[float] = None
    bf: Optional[float] = None
    hf: Optional[float] = None
    bf_top: Optional[float] = None
    bf_bot: Optional[float] = None
    hf_top: Optional[float] = None
    hf_bot: Optional[float] = None
    b_top: Optional[float] = None
    b_bot: Optional[float] = None
    b_int: Optional[float] = None
    t_top: Optional[float] = None
    t_bot: Optional[float] = None
    t_web: Optional[float] = None


class MagnelCalcRequest(BaseModel):
    """Request for Magnel diagram calculation"""
    span: float
    section_type: str
    fck: float
    jacking_stress: float
    num_strands: int
    strand_area: float
    self_weight_udl: float
    imposed_udl: float
    
    # Section dimensions
    width: Optional[float] = None
    height: Optional[float] = None
    bw: Optional[float] = None
    bf: Optional[float] = None
    hf: Optional[float] = None
    bf_top: Optional[float] = None
    bf_bot: Optional[float] = None
    hf_top: Optional[float] = None
    hf_bot: Optional[float] = None
    b_top: Optional[float] = None
    b_bot: Optional[float] = None
    b_int: Optional[float] = None
    t_top: Optional[float] = None
    t_bot: Optional[float] = None
    t_web: Optional[float] = None


# Helper functions
def build_section(data: dict) -> BeamSection:
    """Build BeamSection from request data"""
    section_type = data.get('section_type', 'rectangular')
    
    if section_type == "rectangular":
        return BeamSection(
            section_type="rectangular",
            rectangular=RectangularSection(
                width=data.get('width', 400),
                height=data.get('height', 800)
            )
        )
    elif section_type == "t_beam":
        return BeamSection(
            section_type="t_beam",
            t_beam=TBeamSection(
                bw=data.get('bw', 300),
                bf=data.get('bf', 1000),
                hf=data.get('hf', 150),
                h=data.get('height', 800)
            )
        )
    elif section_type == "i_beam":
        return BeamSection(
            section_type="i_beam",
            i_beam=IBeamSection(
                bw=data.get('bw', 200),
                bf_top=data.get('bf_top', 600),
                bf_bot=data.get('bf_bot', 600),
                hf_top=data.get('hf_top', 150),
                hf_bot=data.get('hf_bot', 200),
                h=data.get('height', 1000)
            )
        )
    elif section_type == "box_girder":
        return BeamSection(
            section_type="box_girder",
            box_girder=BoxGirderSection(
                b_top=data.get('b_top', 2000),
                b_bot=data.get('b_bot', 1200),
                b_int=data.get('b_int', 1000),
                t_top=data.get('t_top', 200),
                t_bot=data.get('t_bot', 200),
                t_web=data.get('t_web', 200),
                h=data.get('height', 1500)
            )
        )
    else:
        raise ValueError(f"Unknown section type: {section_type}")


def build_design_input(req: DesignRequest) -> BeamDesignInput:
    """Build BeamDesignInput from request"""
    
    # Build section
    section = build_section(req.model_dump())
    
    # Calculate concrete properties
    concrete = calculate_concrete_properties(req.concrete.fck)
    concrete.creep_coefficient = req.concrete.creep_coefficient
    concrete.shrinkage_strain = req.concrete.shrinkage_strain
    concrete.density = req.concrete.density
    
    # Build steel
    steel = PrestressingSteel(
        fp01k=req.steel.fp01k,
        fpk=req.steel.fpk,
        Ep=req.steel.Ep,
        strand_area=req.steel.strand_area,
        relaxation_class=req.steel.relaxation_class
    )
    
    # Build tendon geometry
    tendon = TendonGeometry(
        profile_type=req.tendon_profile,
        num_strands=req.steel.num_strands,
        eccentricity=req.eccentricity,
        e_end=req.e_end,
        e_mid=req.e_mid,
        e_support=req.e_support,
        e_drape=req.e_drape,
        drape_position=req.drape_position
    )
    
    # Build prestress input
    prestress = PrestressInput(
        prestress_type=req.prestress_type,
        jacking_stress=req.jacking_stress,
        tendon=tendon,
        steel=steel,
        friction_coefficient=req.friction_coefficient,
        wobble_coefficient=req.wobble_coefficient
    )
    
    # Build load cases
    load_cases = []
    if req.permanent_udl > 0:
        load_cases.append(LoadCase(
            name="Additional Permanent",
            udl=req.permanent_udl,
            is_permanent=True,
            load_factor_uls=1.35,
            load_factor_sls=1.0
        ))
    if req.imposed_udl > 0:
        load_cases.append(LoadCase(
            name="Imposed Load",
            udl=req.imposed_udl,
            is_permanent=False,
            load_factor_uls=1.5,
            load_factor_sls=1.0
        ))
    
    return BeamDesignInput(
        project_name=req.project_name,
        beam_name=req.beam_name,
        span=req.span,
        section=section,
        concrete=concrete,
        self_weight=req.include_self_weight,
        load_cases=load_cases,
        prestress=prestress
    )


# API Routes
@api_router.get("/")
async def root():
    return {"message": "BeamForge API - Prestressed Beam Design per Eurocode 2"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@api_router.post("/calculate/section-properties")
async def calculate_section_props(req: QuickCalcRequest):
    """Calculate section properties for given dimensions"""
    try:
        section = build_section(req.model_dump())
        props = calculate_section_properties(section)
        h = get_section_height(section)
        return {
            "section_type": req.section_type,
            "height": h,
            "properties": props.model_dump()
        }
    except Exception as e:
        logger.error(f"Section calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/calculate/concrete-properties")
async def calculate_concrete_props(fck: float):
    """Calculate concrete properties from fck"""
    try:
        props = calculate_concrete_properties(fck)
        return props.model_dump()
    except Exception as e:
        logger.error(f"Concrete calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/design/analyze")
async def analyze_beam(req: DesignRequest):
    """Perform full beam analysis"""
    try:
        design_input = build_design_input(req)
        
        results = perform_full_analysis(
            span=design_input.span,
            section=design_input.section,
            concrete=design_input.concrete,
            prestress=design_input.prestress,
            load_cases=design_input.load_cases,
            include_self_weight=design_input.self_weight
        )
        
        # Save to database
        doc = {
            "input": design_input.model_dump(),
            "results": results.model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        doc["input"]["created_at"] = doc["input"]["created_at"].isoformat()
        doc["input"]["updated_at"] = doc["input"]["updated_at"].isoformat()
        
        insert_result = await db.beam_designs.insert_one(doc)
        
        return {
            "id": str(insert_result.inserted_id),
            "input_id": design_input.id,
            "results": results.model_dump()
        }
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/design/generate-pdf")
async def generate_pdf(req: DesignRequest):
    """Generate PDF report for beam design"""
    try:
        design_input = build_design_input(req)
        
        results = perform_full_analysis(
            span=design_input.span,
            section=design_input.section,
            concrete=design_input.concrete,
            prestress=design_input.prestress,
            load_cases=design_input.load_cases,
            include_self_weight=design_input.self_weight
        )
        
        pdf_buffer = generate_pdf_report(design_input, results)
        
        filename = f"{design_input.project_name.replace(' ', '_')}_{design_input.beam_name.replace(' ', '_')}.pdf"
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/projects")
async def get_projects():
    """Get list of saved projects"""
    try:
        projects = await db.beam_designs.find(
            {}, 
            {"_id": 0, "input.id": 1, "input.project_name": 1, "input.beam_name": 1, 
             "input.section.section_type": 1, "input.span": 1, 
             "results.overall_status": 1, "created_at": 1}
        ).sort("created_at", -1).to_list(100)
        
        result = []
        for p in projects:
            result.append({
                "id": p.get("input", {}).get("id"),
                "project_name": p.get("input", {}).get("project_name"),
                "beam_name": p.get("input", {}).get("beam_name"),
                "section_type": p.get("input", {}).get("section", {}).get("section_type"),
                "span": p.get("input", {}).get("span"),
                "status": p.get("results", {}).get("overall_status"),
                "created_at": p.get("created_at")
            })
        
        return result
    except Exception as e:
        logger.error(f"Get projects error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details by ID"""
    try:
        project = await db.beam_designs.find_one(
            {"input.id": project_id},
            {"_id": 0}
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        result = await db.beam_designs.delete_one({"input.id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
