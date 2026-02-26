"""
Prestressed Beam Design Models
Pydantic models for beam sections, materials, loads, and analysis results
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid


# Enums as Literal types
SectionType = Literal["rectangular", "t_beam", "i_beam", "box_girder"]
TendonProfile = Literal["straight", "parabolic", "harped", "multi_parabolic"]
LoadType = Literal["udl", "point_load", "moment"]
StrandType = Literal["7_wire_strand", "19_wire_strand", "bar"]


class ConcreteProperties(BaseModel):
    """Concrete material properties per EC2"""
    fck: float = Field(..., description="Characteristic cylinder strength (MPa)")
    fck_cube: Optional[float] = Field(None, description="Characteristic cube strength (MPa)")
    fcm: Optional[float] = Field(None, description="Mean cylinder strength (MPa)")
    fctm: Optional[float] = Field(None, description="Mean tensile strength (MPa)")
    fctk_005: Optional[float] = Field(None, description="5% fractile tensile strength (MPa)")
    fctk_095: Optional[float] = Field(None, description="95% fractile tensile strength (MPa)")
    Ecm: Optional[float] = Field(None, description="Secant modulus of elasticity (GPa)")
    density: float = Field(default=25.0, description="Unit weight (kN/m³)")
    creep_coefficient: float = Field(default=2.0, description="Creep coefficient φ(∞,t0)")
    shrinkage_strain: float = Field(default=0.0003, description="Shrinkage strain εcs")


class PrestressingSteel(BaseModel):
    """Prestressing steel properties per EC2"""
    fp01k: float = Field(..., description="0.1% proof stress (MPa)")
    fpk: float = Field(..., description="Characteristic tensile strength (MPa)")
    Ep: float = Field(default=195.0, description="Modulus of elasticity (GPa)")
    strand_type: StrandType = Field(default="7_wire_strand")
    strand_area: float = Field(..., description="Area per strand (mm²)")
    relaxation_class: int = Field(default=2, description="Relaxation class (1, 2, or 3)")
    relaxation_loss_1000h: float = Field(default=2.5, description="Relaxation loss at 1000h (%)")


class RectangularSection(BaseModel):
    """Rectangular beam section"""
    width: float = Field(..., description="Width b (mm)")
    height: float = Field(..., description="Total height h (mm)")


class TBeamSection(BaseModel):
    """T-beam section"""
    bw: float = Field(..., description="Web width (mm)")
    bf: float = Field(..., description="Flange width (mm)")
    hf: float = Field(..., description="Flange thickness (mm)")
    h: float = Field(..., description="Total height (mm)")


class IBeamSection(BaseModel):
    """I-beam (double T) section"""
    bw: float = Field(..., description="Web width (mm)")
    bf_top: float = Field(..., description="Top flange width (mm)")
    bf_bot: float = Field(..., description="Bottom flange width (mm)")
    hf_top: float = Field(..., description="Top flange thickness (mm)")
    hf_bot: float = Field(..., description="Bottom flange thickness (mm)")
    h: float = Field(..., description="Total height (mm)")


class BoxGirderSection(BaseModel):
    """Box girder section"""
    b_top: float = Field(..., description="Top slab width (mm)")
    b_bot: float = Field(..., description="Bottom slab width (mm)")
    b_int: float = Field(..., description="Internal width (mm)")
    t_top: float = Field(..., description="Top slab thickness (mm)")
    t_bot: float = Field(..., description="Bottom slab thickness (mm)")
    t_web: float = Field(..., description="Web thickness (mm)")
    h: float = Field(..., description="Total height (mm)")


class BeamSection(BaseModel):
    """Combined beam section model"""
    section_type: SectionType
    rectangular: Optional[RectangularSection] = None
    t_beam: Optional[TBeamSection] = None
    i_beam: Optional[IBeamSection] = None
    box_girder: Optional[BoxGirderSection] = None


class PointLoad(BaseModel):
    """Point load definition"""
    magnitude: float = Field(..., description="Load magnitude (kN)")
    position: float = Field(..., description="Position from left support (m)")


class MomentLoad(BaseModel):
    """Applied moment definition"""
    magnitude: float = Field(..., description="Moment magnitude (kNm)")
    position: float = Field(..., description="Position from left support (m)")


class LoadCase(BaseModel):
    """Load case definition"""
    name: str = Field(default="Load Case 1")
    udl: float = Field(default=0.0, description="Uniformly distributed load (kN/m)")
    point_loads: List[PointLoad] = Field(default_factory=list)
    moments: List[MomentLoad] = Field(default_factory=list)
    is_permanent: bool = Field(default=False, description="Is this a permanent/dead load?")
    load_factor_uls: float = Field(default=1.5, description="ULS load factor")
    load_factor_sls: float = Field(default=1.0, description="SLS load factor")


class TendonGeometry(BaseModel):
    """Tendon profile geometry"""
    profile_type: TendonProfile
    num_strands: int = Field(..., description="Number of strands")
    
    # For straight profile
    eccentricity: Optional[float] = Field(None, description="Constant eccentricity (mm)")
    
    # For parabolic profile
    e_end: Optional[float] = Field(None, description="Eccentricity at ends (mm)")
    e_mid: Optional[float] = Field(None, description="Eccentricity at mid-span (mm)")
    
    # For harped profile
    e_support: Optional[float] = Field(None, description="Eccentricity at support (mm)")
    e_drape: Optional[float] = Field(None, description="Eccentricity at drape point (mm)")
    drape_position: Optional[float] = Field(None, description="Drape point position (fraction of span)")
    
    # For multi-parabolic
    inflection_points: Optional[List[float]] = Field(None, description="Inflection point positions")
    eccentricities: Optional[List[float]] = Field(None, description="Eccentricities at key points")


class PrestressInput(BaseModel):
    """Prestress input parameters"""
    prestress_type: Literal["pretensioned", "post_tensioned"]
    jacking_stress: float = Field(..., description="Jacking stress (MPa)")
    tendon: TendonGeometry
    steel: PrestressingSteel
    duct_diameter: Optional[float] = Field(None, description="Duct diameter for post-tensioned (mm)")
    friction_coefficient: float = Field(default=0.19, description="Friction coefficient μ")
    wobble_coefficient: float = Field(default=0.008, description="Wobble coefficient k (1/m)")


class SectionProperties(BaseModel):
    """Calculated section properties"""
    area: float = Field(..., description="Cross-sectional area (mm²)")
    I: float = Field(..., description="Second moment of area (mm⁴)")
    y_top: float = Field(..., description="Distance to top fiber (mm)")
    y_bot: float = Field(..., description="Distance to bottom fiber (mm)")
    Z_top: float = Field(..., description="Section modulus top (mm³)")
    Z_bot: float = Field(..., description="Section modulus bottom (mm³)")
    perimeter: float = Field(..., description="Perimeter for shrinkage (mm)")


class PrestressLosses(BaseModel):
    """Prestress loss calculations"""
    # Immediate losses
    elastic_shortening: float = Field(default=0.0, description="Elastic shortening loss (MPa)")
    friction: float = Field(default=0.0, description="Friction loss (MPa)")
    anchorage_slip: float = Field(default=0.0, description="Anchorage slip loss (MPa)")
    
    # Time-dependent losses
    creep: float = Field(default=0.0, description="Creep loss (MPa)")
    shrinkage: float = Field(default=0.0, description="Shrinkage loss (MPa)")
    relaxation: float = Field(default=0.0, description="Relaxation loss (MPa)")
    
    # Totals
    total_immediate: float = Field(default=0.0, description="Total immediate losses (MPa)")
    total_time_dependent: float = Field(default=0.0, description="Total time-dependent losses (MPa)")
    total: float = Field(default=0.0, description="Total losses (MPa)")
    loss_ratio: float = Field(default=0.0, description="Total loss as percentage (%)")


class MagnelPoint(BaseModel):
    """Single point on Magnel diagram"""
    inverse_force: float = Field(..., description="1/P (1/kN)")
    eccentricity: float = Field(..., description="e (mm)")


class MagnelDiagram(BaseModel):
    """Magnel diagram data"""
    line1_top_transfer: List[MagnelPoint] = Field(default_factory=list)
    line2_bot_transfer: List[MagnelPoint] = Field(default_factory=list)
    line3_top_service: List[MagnelPoint] = Field(default_factory=list)
    line4_bot_service: List[MagnelPoint] = Field(default_factory=list)
    feasible_region: List[MagnelPoint] = Field(default_factory=list)
    optimal_point: Optional[MagnelPoint] = None
    min_force: float = Field(default=0.0)
    max_force: float = Field(default=0.0)
    min_eccentricity: float = Field(default=0.0)
    max_eccentricity: float = Field(default=0.0)


class FlexureResult(BaseModel):
    """Flexure analysis results"""
    M_Ed: float = Field(..., description="Design moment (kNm)")
    M_Rd: float = Field(..., description="Moment resistance (kNm)")
    utilization: float = Field(..., description="Utilization ratio")
    status: str = Field(..., description="PASS or FAIL")
    
    # Stresses
    sigma_top_transfer: float = Field(default=0.0, description="Top fiber stress at transfer (MPa)")
    sigma_bot_transfer: float = Field(default=0.0, description="Bottom fiber stress at transfer (MPa)")
    sigma_top_service: float = Field(default=0.0, description="Top fiber stress at service (MPa)")
    sigma_bot_service: float = Field(default=0.0, description="Bottom fiber stress at service (MPa)")


class ShearResult(BaseModel):
    """Shear analysis results"""
    V_Ed: float = Field(..., description="Design shear force (kN)")
    V_Rd_c: float = Field(..., description="Concrete shear resistance (kN)")
    V_Rd_s: float = Field(default=0.0, description="Shear reinforcement contribution (kN)")
    V_Rd_max: float = Field(..., description="Maximum shear resistance (kN)")
    utilization: float = Field(..., description="Utilization ratio")
    status: str = Field(..., description="PASS or FAIL")
    shear_reinforcement_required: bool = Field(default=False)
    Asw_s: Optional[float] = Field(None, description="Required shear reinforcement (mm²/m)")


class DeflectionResult(BaseModel):
    """Deflection analysis results"""
    delta_immediate: float = Field(..., description="Immediate deflection (mm)")
    delta_long_term: float = Field(..., description="Long-term deflection (mm)")
    delta_total: float = Field(..., description="Total deflection (mm)")
    span_ratio: float = Field(..., description="Span/deflection ratio")
    limit: float = Field(..., description="Allowable deflection (mm)")
    utilization: float = Field(..., description="Utilization ratio")
    status: str = Field(..., description="PASS or FAIL")


class CrackWidthResult(BaseModel):
    """Crack width analysis results per EC2 7.3"""
    wk: float = Field(..., description="Calculated crack width (mm)")
    wk_limit: float = Field(..., description="Allowable crack width (mm)")
    utilization: float = Field(..., description="Utilization ratio")
    status: str = Field(..., description="PASS or FAIL")
    sr_max: float = Field(default=0.0, description="Maximum crack spacing (mm)")
    epsilon_sm_cm: float = Field(default=0.0, description="Strain difference εsm - εcm")


class AnalysisResults(BaseModel):
    """Complete analysis results"""
    section_properties: SectionProperties
    prestress_losses: PrestressLosses
    magnel_diagram: MagnelDiagram
    flexure: FlexureResult
    shear: ShearResult
    deflection: DeflectionResult
    crack_width: Optional[CrackWidthResult] = None
    cable_concordancy: bool = Field(default=True, description="Cable concordancy check")
    overall_status: str = Field(..., description="Overall design status")


class BeamDesignInput(BaseModel):
    """Complete beam design input"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str = Field(default="Untitled Project")
    beam_name: str = Field(default="Beam 1")
    
    # Geometry
    span: float = Field(..., description="Beam span (m)")
    section: BeamSection
    
    # Materials
    concrete: ConcreteProperties
    
    # Loads
    self_weight: bool = Field(default=True, description="Include self-weight")
    load_cases: List[LoadCase] = Field(default_factory=list)
    
    # Prestress
    prestress: PrestressInput
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BeamDesignOutput(BaseModel):
    """Complete beam design output"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input_id: str
    results: AnalysisResults
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectSummary(BaseModel):
    """Project summary for dashboard"""
    model_config = ConfigDict(extra="ignore")
    
    id: str
    project_name: str
    beam_name: str
    section_type: str
    span: float
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
