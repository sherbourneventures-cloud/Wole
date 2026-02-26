"""
Prestressed Beam Design Calculations
Engineering calculations per Eurocode 2
"""
import math
from typing import List, Tuple, Optional
from models import (
    BeamSection, ConcreteProperties, PrestressingSteel, TendonGeometry,
    PrestressInput, LoadCase, SectionProperties, PrestressLosses,
    MagnelDiagram, MagnelPoint, FlexureResult, ShearResult, DeflectionResult,
    CrackWidthResult, AnalysisResults
)


def calculate_concrete_properties(fck: float) -> ConcreteProperties:
    """Calculate derived concrete properties from fck per EC2 Table 3.1"""
    fcm = fck + 8  # Mean strength
    
    # Tensile strength (EC2 3.1.3)
    if fck <= 50:
        fctm = 0.30 * (fck ** (2/3))
    else:
        fctm = 2.12 * math.log(1 + fcm / 10)
    
    fctk_005 = 0.7 * fctm
    fctk_095 = 1.3 * fctm
    
    # Modulus of elasticity (EC2 3.1.3)
    Ecm = 22 * ((fcm / 10) ** 0.3)  # GPa
    
    # Cube strength approximation
    fck_cube = fck / 0.8
    
    return ConcreteProperties(
        fck=fck,
        fck_cube=fck_cube,
        fcm=fcm,
        fctm=fctm,
        fctk_005=fctk_005,
        fctk_095=fctk_095,
        Ecm=Ecm
    )


def calculate_section_properties(section: BeamSection) -> SectionProperties:
    """Calculate geometric section properties"""
    if section.section_type == "rectangular":
        s = section.rectangular
        b, h = s.width, s.height
        
        area = b * h
        I = (b * h ** 3) / 12
        y_top = h / 2
        y_bot = h / 2
        perimeter = 2 * (b + h)
        
    elif section.section_type == "t_beam":
        s = section.t_beam
        bw, bf, hf, h = s.bw, s.bf, s.hf, s.h
        hw = h - hf
        
        # Area
        area = bf * hf + bw * hw
        
        # Centroid from bottom
        y_bar = (bf * hf * (h - hf/2) + bw * hw * (hw/2)) / area
        y_bot = y_bar
        y_top = h - y_bar
        
        # Second moment of area
        I_flange = (bf * hf ** 3) / 12 + bf * hf * ((h - hf/2) - y_bar) ** 2
        I_web = (bw * hw ** 3) / 12 + bw * hw * ((hw/2) - y_bar) ** 2
        I = I_flange + I_web
        
        perimeter = 2 * h + 2 * bf + 2 * (bf - bw)
        
    elif section.section_type == "i_beam":
        s = section.i_beam
        bw = s.bw
        bf_top, bf_bot = s.bf_top, s.bf_bot
        hf_top, hf_bot = s.hf_top, s.hf_bot
        h = s.h
        hw = h - hf_top - hf_bot
        
        # Areas
        A_top = bf_top * hf_top
        A_web = bw * hw
        A_bot = bf_bot * hf_bot
        area = A_top + A_web + A_bot
        
        # Centroid from bottom
        y_bar = (A_bot * (hf_bot/2) + A_web * (hf_bot + hw/2) + A_top * (h - hf_top/2)) / area
        y_bot = y_bar
        y_top = h - y_bar
        
        # Second moment of area
        I_bot = (bf_bot * hf_bot ** 3) / 12 + A_bot * ((hf_bot/2) - y_bar) ** 2
        I_web = (bw * hw ** 3) / 12 + A_web * ((hf_bot + hw/2) - y_bar) ** 2
        I_top = (bf_top * hf_top ** 3) / 12 + A_top * ((h - hf_top/2) - y_bar) ** 2
        I = I_bot + I_web + I_top
        
        perimeter = 2 * h + bf_top + bf_bot + 2 * (bf_top - bw) + 2 * (bf_bot - bw)
        
    elif section.section_type == "box_girder":
        s = section.box_girder
        b_top, b_bot = s.b_top, s.b_bot
        b_int = s.b_int
        t_top, t_bot, t_web = s.t_top, s.t_bot, s.t_web
        h = s.h
        
        # Simplified box calculation
        h_int = h - t_top - t_bot
        
        # Areas
        A_top = b_top * t_top
        A_bot = b_bot * t_bot
        A_webs = 2 * t_web * h_int
        area = A_top + A_bot + A_webs
        
        # Centroid from bottom
        y_bar = (A_bot * (t_bot/2) + A_webs * (t_bot + h_int/2) + A_top * (h - t_top/2)) / area
        y_bot = y_bar
        y_top = h - y_bar
        
        # Second moment (simplified)
        I_bot = (b_bot * t_bot ** 3) / 12 + A_bot * ((t_bot/2) - y_bar) ** 2
        I_webs = 2 * ((t_web * h_int ** 3) / 12 + A_webs/2 * ((t_bot + h_int/2) - y_bar) ** 2)
        I_top = (b_top * t_top ** 3) / 12 + A_top * ((h - t_top/2) - y_bar) ** 2
        I = I_bot + I_webs + I_top
        
        perimeter = 2 * (b_top + b_bot) + 4 * h_int
    else:
        raise ValueError(f"Unknown section type: {section.section_type}")
    
    Z_top = I / y_top
    Z_bot = I / y_bot
    
    return SectionProperties(
        area=area,
        I=I,
        y_top=y_top,
        y_bot=y_bot,
        Z_top=Z_top,
        Z_bot=Z_bot,
        perimeter=perimeter
    )


def get_section_height(section: BeamSection) -> float:
    """Get total height of section"""
    if section.section_type == "rectangular":
        return section.rectangular.height
    elif section.section_type == "t_beam":
        return section.t_beam.h
    elif section.section_type == "i_beam":
        return section.i_beam.h
    elif section.section_type == "box_girder":
        return section.box_girder.h
    return 0


def get_web_width(section: BeamSection) -> float:
    """Get web width for shear calculations"""
    if section.section_type == "rectangular":
        return section.rectangular.width
    elif section.section_type == "t_beam":
        return section.t_beam.bw
    elif section.section_type == "i_beam":
        return section.i_beam.bw
    elif section.section_type == "box_girder":
        return 2 * section.box_girder.t_web
    return 0


def calculate_prestress_losses(
    prestress: PrestressInput,
    section_props: SectionProperties,
    concrete: ConcreteProperties,
    span: float,
    eccentricity: float
) -> PrestressLosses:
    """Calculate prestress losses per EC2 5.10"""
    
    steel = prestress.steel
    Ap = steel.strand_area * prestress.tendon.num_strands  # Total strand area
    Ep = steel.Ep * 1000  # GPa to MPa
    Ecm = concrete.Ecm * 1000  # GPa to MPa
    
    sigma_pi = prestress.jacking_stress  # Initial jacking stress
    P_i = sigma_pi * Ap / 1000  # Initial force in kN
    
    # 1. Elastic shortening (EC2 5.10.4)
    # Stress at centroid of tendons due to prestress
    sigma_cp = P_i * 1000 / section_props.area + (P_i * 1000 * eccentricity ** 2) / section_props.I
    delta_elastic = (Ep / Ecm) * sigma_cp
    
    if prestress.prestress_type == "pretensioned":
        # For pretensioned, full elastic shortening applies
        elastic_shortening = delta_elastic
    else:
        # For post-tensioned with sequential stressing, take half
        elastic_shortening = delta_elastic / 2
    
    # 2. Friction losses (EC2 5.10.5.2) - post-tensioned only
    friction = 0.0
    if prestress.prestress_type == "post_tensioned":
        mu = prestress.friction_coefficient
        k = prestress.wobble_coefficient
        
        # Calculate tendon angle change for parabolic profile
        if prestress.tendon.profile_type in ["parabolic", "multi_parabolic"]:
            e_mid = prestress.tendon.e_mid or eccentricity
            e_end = prestress.tendon.e_end or 0
            sag = abs(e_mid - e_end) / 1000  # Convert to m
            theta = 4 * sag / span  # Approximate angle change
        else:
            theta = 0
        
        x = span / 2  # Consider mid-span
        friction = sigma_pi * (1 - math.exp(-mu * theta - k * x))
    
    # 3. Anchorage slip (EC2 5.10.5.3) - post-tensioned only
    anchorage_slip = 0.0
    if prestress.prestress_type == "post_tensioned":
        delta_s = 6  # Typical slip in mm
        anchorage_slip = delta_s * Ep / (span * 1000)  # Simplified
    
    total_immediate = elastic_shortening + friction + anchorage_slip
    
    # 4. Time-dependent losses
    # Creep loss (EC2 5.10.6)
    phi = concrete.creep_coefficient
    sigma_c_qp = sigma_cp  # Quasi-permanent stress
    creep = (Ep / Ecm) * phi * sigma_c_qp
    
    # Shrinkage loss (EC2 5.10.6)
    eps_cs = concrete.shrinkage_strain
    shrinkage = eps_cs * Ep
    
    # Relaxation loss (EC2 5.10.6, 3.3.2)
    # Class 2 low relaxation
    rho_1000 = steel.relaxation_loss_1000h / 100
    mu_val = (sigma_pi - total_immediate) / steel.fpk
    
    if steel.relaxation_class == 2:
        # Low relaxation
        relaxation = 0.66 * rho_1000 * math.exp(9.1 * mu_val) * ((500000 / 1000) ** 0.75) * (1 - mu_val) * sigma_pi / 100
    else:
        # Normal relaxation
        relaxation = 5.39 * rho_1000 * math.exp(6.7 * mu_val) * ((500000 / 1000) ** 0.75) * (1 - mu_val) * sigma_pi / 100
    
    # Cap relaxation at reasonable value
    relaxation = min(relaxation, 0.08 * sigma_pi)
    
    total_time_dependent = creep + shrinkage + relaxation
    total = total_immediate + total_time_dependent
    loss_ratio = (total / sigma_pi) * 100
    
    return PrestressLosses(
        elastic_shortening=round(elastic_shortening, 2),
        friction=round(friction, 2),
        anchorage_slip=round(anchorage_slip, 2),
        creep=round(creep, 2),
        shrinkage=round(shrinkage, 2),
        relaxation=round(relaxation, 2),
        total_immediate=round(total_immediate, 2),
        total_time_dependent=round(total_time_dependent, 2),
        total=round(total, 2),
        loss_ratio=round(loss_ratio, 1)
    )


def calculate_moments_and_shear(
    span: float,
    load_cases: List[LoadCase],
    self_weight_udl: float,
    factor: float = 1.0
) -> Tuple[float, float, float, float]:
    """Calculate maximum moment and shear for simply supported beam"""
    
    total_udl = self_weight_udl * factor
    M_max = 0.0
    V_max = 0.0
    
    for lc in load_cases:
        # UDL contribution
        w = lc.udl * factor
        total_udl += w
        
        # Point load contributions to moment and shear
        for pl in lc.point_loads:
            P = pl.magnitude * factor
            a = pl.position
            b = span - a
            M_pl = P * a * b / span
            M_max += M_pl
            V_max += P * max(a, b) / span
    
    # UDL moment and shear (simply supported)
    M_udl = total_udl * span ** 2 / 8
    V_udl = total_udl * span / 2
    
    M_max += M_udl
    V_max += V_udl
    
    return M_max, V_max, M_udl, total_udl


def calculate_magnel_diagram(
    section_props: SectionProperties,
    concrete: ConcreteProperties,
    M_min: float,  # Moment at transfer (self-weight only) in kNm
    M_max: float,  # Moment at service (full load) in kNm
    losses: PrestressLosses,
    h: float  # Section height in mm
) -> MagnelDiagram:
    """Generate Magnel diagram data"""
    
    # Allowable stresses per EC2
    fck = concrete.fck
    fctm = concrete.fctm
    
    # At transfer (fresh concrete, assume 0.8*fck)
    fci = 0.8 * fck
    sigma_c_max_transfer = 0.6 * fci  # Compression limit at transfer
    sigma_t_max_transfer = fctm  # Tension limit at transfer
    
    # At service
    sigma_c_max_service = 0.6 * fck  # Compression limit at service
    sigma_t_max_service = 0  # No tension for crack control (conservative)
    
    # Loss ratio
    eta = 1 - losses.loss_ratio / 100  # Effective prestress ratio
    
    # Section properties
    A = section_props.area  # mm²
    Z_t = section_props.Z_top  # mm³
    Z_b = section_props.Z_bot  # mm³
    y_t = section_props.y_top  # mm
    y_b = section_props.y_bot  # mm
    
    # Convert moments to Nmm
    M_min_Nmm = M_min * 1e6
    M_max_Nmm = M_max * 1e6
    
    # Maximum eccentricity (geometric limit)
    e_max = y_b - 50  # 50mm cover
    e_min = -(y_t - 50)
    
    # Generate Magnel lines
    # Line equations: 1/P = (1/A ± e/Z) / (stress_limit - M/Z)
    
    line1_top_transfer = []  # Top fiber at transfer (compression)
    line2_bot_transfer = []  # Bottom fiber at transfer (tension)
    line3_top_service = []   # Top fiber at service (tension)
    line4_bot_service = []   # Bottom fiber at service (compression)
    
    num_points = 50
    e_range = [e_min + i * (e_max - e_min) / (num_points - 1) for i in range(num_points)]
    
    for e in e_range:
        # Line 1: Top fiber at transfer (compression limit)
        # sigma_top = -P/A + Pe/Zt - M_min/Zt <= sigma_c_max_transfer
        # => 1/P >= (1/A - e/Zt) / (sigma_c_max_transfer + M_min/Zt)
        denom1 = sigma_c_max_transfer + M_min_Nmm / Z_t
        if abs(denom1) > 1e-6:
            inv_P1 = (1/A - e/Z_t) / denom1
            if inv_P1 > 0:
                line1_top_transfer.append(MagnelPoint(inverse_force=inv_P1 * 1e3, eccentricity=e))
        
        # Line 2: Bottom fiber at transfer (tension limit)
        # sigma_bot = -P/A - Pe/Zb + M_min/Zb >= -sigma_t_max_transfer
        # => 1/P >= (1/A + e/Zb) / (sigma_t_max_transfer + M_min/Zb)
        denom2 = sigma_t_max_transfer + M_min_Nmm / Z_b
        if abs(denom2) > 1e-6:
            inv_P2 = (1/A + e/Z_b) / denom2
            if inv_P2 > 0:
                line2_bot_transfer.append(MagnelPoint(inverse_force=inv_P2 * 1e3, eccentricity=e))
        
        # Line 3: Top fiber at service (tension limit) - using effective prestress
        # eta * (-P/A + Pe/Zt) - M_max/Zt >= -sigma_t_max_service
        # => 1/P <= (1/A - e/Zt) / ((sigma_t_max_service + M_max/Zt) / eta)
        denom3 = (sigma_t_max_service + M_max_Nmm / Z_t) / eta
        if abs(denom3) > 1e-6:
            inv_P3 = (1/A - e/Z_t) / denom3
            if inv_P3 > 0:
                line3_top_service.append(MagnelPoint(inverse_force=inv_P3 * 1e3, eccentricity=e))
        
        # Line 4: Bottom fiber at service (compression limit)
        # eta * (-P/A - Pe/Zb) + M_max/Zb <= sigma_c_max_service
        # => 1/P >= (1/A + e/Zb) / ((sigma_c_max_service - M_max/Zb) / eta)
        denom4 = (sigma_c_max_service - M_max_Nmm / Z_b) / eta
        if abs(denom4) > 1e-6:
            inv_P4 = (1/A + e/Z_b) / denom4
            if inv_P4 > 0:
                line4_bot_service.append(MagnelPoint(inverse_force=inv_P4 * 1e3, eccentricity=e))
    
    # Find feasible region (simplified - take intersection points)
    # For a valid design, all constraints must be satisfied
    
    # Find optimal point (minimum prestress force with maximum eccentricity)
    optimal_e = e_max * 0.8  # Use 80% of max eccentricity
    optimal_inv_P = max(
        (1/A + optimal_e/Z_b) / (sigma_t_max_transfer + M_min_Nmm / Z_b),
        (1/A - optimal_e/Z_t) / ((sigma_t_max_service + M_max_Nmm / Z_t) / eta)
    ) if (sigma_t_max_transfer + M_min_Nmm / Z_b) > 0 else 1e-6
    
    optimal_P = 1 / (optimal_inv_P * 1e-3) if optimal_inv_P > 0 else 0
    
    return MagnelDiagram(
        line1_top_transfer=line1_top_transfer,
        line2_bot_transfer=line2_bot_transfer,
        line3_top_service=line3_top_service,
        line4_bot_service=line4_bot_service,
        optimal_point=MagnelPoint(inverse_force=optimal_inv_P * 1e3, eccentricity=optimal_e),
        min_force=optimal_P * 0.5,
        max_force=optimal_P * 2,
        min_eccentricity=e_min,
        max_eccentricity=e_max
    )


def calculate_flexure(
    section_props: SectionProperties,
    concrete: ConcreteProperties,
    prestress: PrestressInput,
    losses: PrestressLosses,
    M_Ed: float,  # Design moment in kNm
    M_transfer: float,  # Moment at transfer in kNm
    eccentricity: float,  # Tendon eccentricity in mm
    h: float  # Section height in mm
) -> FlexureResult:
    """Check flexural capacity per EC2 6.1"""
    
    steel = prestress.steel
    Ap = steel.strand_area * prestress.tendon.num_strands  # mm²
    
    # Effective prestress
    sigma_pe = prestress.jacking_stress - losses.total  # MPa
    P_e = sigma_pe * Ap / 1000  # kN
    
    # Initial prestress (at transfer)
    sigma_pi = prestress.jacking_stress - losses.total_immediate
    P_i = sigma_pi * Ap / 1000  # kN
    
    # Design strengths
    fcd = 0.85 * concrete.fck / 1.5  # Design compressive strength
    fpd = steel.fp01k / 1.15  # Design prestress steel strength
    
    # Depth to tendons
    d = h - (h / 2 - eccentricity)  # mm (assuming centroid at mid-height)
    
    # Ultimate moment capacity (simplified rectangular stress block)
    # Assuming tendons reach design strength
    x = Ap * fpd / (0.8 * fcd * get_web_width_from_h(h))  # Neutral axis depth (simplified)
    if x > 0:
        z = d - 0.4 * x  # Lever arm
    else:
        z = 0.9 * d
    
    M_Rd = Ap * fpd * z / 1e6  # kNm
    
    # Stress checks
    A = section_props.area
    Z_t = section_props.Z_top
    Z_b = section_props.Z_bot
    
    # At transfer
    sigma_top_transfer = -P_i * 1000 / A + P_i * 1000 * eccentricity / Z_t - M_transfer * 1e6 / Z_t
    sigma_bot_transfer = -P_i * 1000 / A - P_i * 1000 * eccentricity / Z_b + M_transfer * 1e6 / Z_b
    
    # At service
    sigma_top_service = -P_e * 1000 / A + P_e * 1000 * eccentricity / Z_t - M_Ed * 1e6 / Z_t
    sigma_bot_service = -P_e * 1000 / A - P_e * 1000 * eccentricity / Z_b + M_Ed * 1e6 / Z_b
    
    utilization = M_Ed / M_Rd if M_Rd > 0 else float('inf')
    status = "PASS" if utilization <= 1.0 else "FAIL"
    
    return FlexureResult(
        M_Ed=round(M_Ed, 2),
        M_Rd=round(M_Rd, 2),
        utilization=round(utilization, 3),
        status=status,
        sigma_top_transfer=round(sigma_top_transfer, 2),
        sigma_bot_transfer=round(sigma_bot_transfer, 2),
        sigma_top_service=round(sigma_top_service, 2),
        sigma_bot_service=round(sigma_bot_service, 2)
    )


def get_web_width_from_h(h: float) -> float:
    """Estimate web width from height for simplified calculations"""
    return h * 0.3  # Approximate


def calculate_shear(
    section_props: SectionProperties,
    section: BeamSection,
    concrete: ConcreteProperties,
    prestress: PrestressInput,
    losses: PrestressLosses,
    V_Ed: float,  # Design shear in kN
    h: float  # Section height in mm
) -> ShearResult:
    """Check shear capacity per EC2 6.2"""
    
    steel = prestress.steel
    Ap = steel.strand_area * prestress.tendon.num_strands
    sigma_pe = prestress.jacking_stress - losses.total
    P_e = sigma_pe * Ap / 1000  # kN
    
    bw = get_web_width(section)
    d = 0.9 * h  # Effective depth approximation
    
    fck = concrete.fck
    fcd = 0.85 * fck / 1.5
    
    # EC2 6.2.2 - Shear resistance without shear reinforcement
    # V_Rd,c = [C_Rd,c * k * (100 * rho_l * fck)^(1/3) + k1 * sigma_cp] * bw * d
    
    k = min(1 + math.sqrt(200 / d), 2.0)
    rho_l = min(Ap / (bw * d), 0.02)
    sigma_cp = min(P_e * 1000 / section_props.area, 0.2 * fcd)
    
    C_Rd_c = 0.18 / 1.5  # Partial factor
    k1 = 0.15
    
    V_Rd_c = (C_Rd_c * k * (100 * rho_l * fck) ** (1/3) + k1 * sigma_cp) * bw * d / 1000
    
    # Minimum value
    v_min = 0.035 * k ** 1.5 * fck ** 0.5
    V_Rd_c_min = (v_min + k1 * sigma_cp) * bw * d / 1000
    V_Rd_c = max(V_Rd_c, V_Rd_c_min)
    
    # EC2 6.2.3 - Maximum shear resistance (strut crushing)
    alpha_cw = 1 + sigma_cp / fcd if sigma_cp > 0 else 1
    v1 = 0.6 * (1 - fck / 250)
    z = 0.9 * d
    V_Rd_max = alpha_cw * bw * z * v1 * fcd / (2 * 1000)  # For cot(theta) = 2.5
    
    shear_reinforcement_required = V_Ed > V_Rd_c
    
    # Required shear reinforcement if needed
    Asw_s = None
    V_Rd_s = 0
    if shear_reinforcement_required:
        fywd = 500 / 1.15  # Design yield strength of shear reinforcement
        Asw_s = V_Ed * 1000 / (z * fywd * 2.5)  # mm²/m for cot(theta) = 2.5
        V_Rd_s = Asw_s * z * fywd * 2.5 / 1000
    
    V_Rd = min(V_Rd_c + V_Rd_s, V_Rd_max) if shear_reinforcement_required else V_Rd_c
    utilization = V_Ed / V_Rd if V_Rd > 0 else float('inf')
    status = "PASS" if utilization <= 1.0 else "FAIL"
    
    return ShearResult(
        V_Ed=round(V_Ed, 2),
        V_Rd_c=round(V_Rd_c, 2),
        V_Rd_s=round(V_Rd_s, 2),
        V_Rd_max=round(V_Rd_max, 2),
        utilization=round(utilization, 3),
        status=status,
        shear_reinforcement_required=shear_reinforcement_required,
        Asw_s=round(Asw_s, 2) if Asw_s else None
    )


def calculate_deflection(
    section_props: SectionProperties,
    concrete: ConcreteProperties,
    prestress: PrestressInput,
    losses: PrestressLosses,
    span: float,  # in m
    total_udl: float,  # kN/m
    eccentricity: float  # mm
) -> DeflectionResult:
    """Calculate deflection per EC2 7.4"""
    
    steel = prestress.steel
    Ap = steel.strand_area * prestress.tendon.num_strands
    sigma_pe = prestress.jacking_stress - losses.total
    P_e = sigma_pe * Ap / 1000  # kN
    
    L = span * 1000  # Convert to mm
    w = total_udl / 1000  # kN/mm
    
    I = section_props.I
    Ecm = concrete.Ecm * 1000  # GPa to MPa
    
    # Immediate deflection due to loads (simply supported, UDL)
    delta_load = 5 * w * L ** 4 / (384 * Ecm * I)
    
    # Upward deflection due to prestress (parabolic profile)
    e = eccentricity  # mm
    delta_prestress = P_e * 1000 * e * L ** 2 / (8 * Ecm * I)
    
    delta_immediate = delta_load - delta_prestress
    
    # Long-term deflection
    phi = concrete.creep_coefficient
    delta_long_term = delta_immediate * phi
    
    delta_total = delta_immediate + delta_long_term
    
    # Limit per EC2 (span/250 for appearance, span/500 for damage)
    limit = L / 250
    
    span_ratio = L / abs(delta_total) if delta_total != 0 else float('inf')
    utilization = abs(delta_total) / limit if limit > 0 else 0
    status = "PASS" if utilization <= 1.0 else "FAIL"
    
    return DeflectionResult(
        delta_immediate=round(delta_immediate, 2),
        delta_long_term=round(delta_long_term, 2),
        delta_total=round(delta_total, 2),
        span_ratio=round(span_ratio, 1),
        limit=round(limit, 2),
        utilization=round(utilization, 3),
        status=status
    )


def calculate_crack_width(
    section_props: SectionProperties,
    concrete: ConcreteProperties,
    prestress: PrestressInput,
    losses: PrestressLosses,
    M_Ed: float,  # Service moment in kNm
    eccentricity: float,
    h: float,
    exposure_class: str = "XC1"
) -> CrackWidthResult:
    """Calculate crack width per EC2 7.3"""
    
    steel = prestress.steel
    Ap = steel.strand_area * prestress.tendon.num_strands
    sigma_pe = prestress.jacking_stress - losses.total
    P_e = sigma_pe * Ap / 1000  # kN
    
    # Cover and effective depth
    c = 50  # mm cover
    d = h - (h / 2 - eccentricity)
    
    # Strain in steel
    Es = steel.Ep * 1000  # MPa
    Ecm = concrete.Ecm * 1000  # MPa
    alpha_e = Es / Ecm
    
    # Stress in steel at cracked section
    z = 0.9 * d
    sigma_s = M_Ed * 1e6 / (Ap * z) - sigma_pe + sigma_pe
    
    # For prestressed concrete, check decompression first
    A = section_props.area
    Z_b = section_props.Z_bot
    
    # Decompression moment
    M_dec = P_e * (1000 / A + 1000 * eccentricity / Z_b) * Z_b / 1e6
    
    if M_Ed <= M_dec:
        # No cracking expected
        return CrackWidthResult(
            wk=0,
            wk_limit=0.2,
            utilization=0,
            status="PASS - Uncracked",
            sr_max=0,
            epsilon_sm_cm=0
        )
    
    # EC2 7.3.4 Crack spacing
    k1 = 0.8  # High bond bars
    k2 = 0.5  # Bending
    k3 = 3.4
    k4 = 0.425
    
    phi_s = math.sqrt(4 * steel.strand_area / math.pi)  # Equivalent diameter
    rho_p_eff = min(Ap / (2.5 * (h - d) * get_web_width_from_h(h)), 0.05)
    
    sr_max = k3 * c + k1 * k2 * k4 * phi_s / rho_p_eff
    
    # EC2 7.3.4 Strain difference
    fct_eff = concrete.fctm
    kt = 0.4  # Long-term loading
    
    epsilon_sm_cm = max(
        (sigma_s - kt * fct_eff / rho_p_eff * (1 + alpha_e * rho_p_eff)) / Es,
        0.6 * sigma_s / Es
    )
    
    # Crack width
    wk = sr_max * epsilon_sm_cm
    
    # Limit based on exposure class
    wk_limits = {
        "X0": 0.4,
        "XC1": 0.3,
        "XC2": 0.3,
        "XC3": 0.3,
        "XC4": 0.3,
        "XD1": 0.3,
        "XD2": 0.3,
        "XD3": 0.2,
        "XS1": 0.3,
        "XS2": 0.3,
        "XS3": 0.2
    }
    wk_limit = wk_limits.get(exposure_class, 0.3)
    
    utilization = wk / wk_limit if wk_limit > 0 else 0
    status = "PASS" if utilization <= 1.0 else "FAIL"
    
    return CrackWidthResult(
        wk=round(wk, 4),
        wk_limit=wk_limit,
        utilization=round(utilization, 3),
        status=status,
        sr_max=round(sr_max, 2),
        epsilon_sm_cm=round(epsilon_sm_cm, 6)
    )


def check_cable_concordancy(
    tendon: TendonGeometry,
    section_props: SectionProperties,
    h: float
) -> bool:
    """Check cable concordancy for statically indeterminate structures"""
    # For simply supported beams, concordancy is automatically satisfied
    # This check is more relevant for continuous beams
    
    y_b = section_props.y_bot
    
    # Check eccentricity is within section bounds
    if tendon.profile_type == "straight":
        e = tendon.eccentricity or 0
        return abs(e) < y_b - 50
    
    elif tendon.profile_type in ["parabolic", "multi_parabolic"]:
        e_mid = tendon.e_mid or 0
        e_end = tendon.e_end or 0
        return abs(e_mid) < y_b - 50 and abs(e_end) < y_b - 50
    
    elif tendon.profile_type == "harped":
        e_support = tendon.e_support or 0
        e_drape = tendon.e_drape or 0
        return abs(e_support) < y_b - 50 and abs(e_drape) < y_b - 50
    
    return True


def perform_full_analysis(
    span: float,
    section: BeamSection,
    concrete: ConcreteProperties,
    prestress: PrestressInput,
    load_cases: List[LoadCase],
    include_self_weight: bool = True
) -> AnalysisResults:
    """Perform complete beam analysis"""
    
    # Calculate section properties
    section_props = calculate_section_properties(section)
    h = get_section_height(section)
    
    # Self weight
    self_weight_udl = section_props.area * concrete.density / 1e6 if include_self_weight else 0
    
    # Get eccentricity
    tendon = prestress.tendon
    if tendon.profile_type == "straight":
        eccentricity = tendon.eccentricity or section_props.y_bot * 0.7
    elif tendon.profile_type in ["parabolic", "multi_parabolic"]:
        eccentricity = tendon.e_mid or section_props.y_bot * 0.7
    elif tendon.profile_type == "harped":
        eccentricity = tendon.e_drape or section_props.y_bot * 0.7
    else:
        eccentricity = section_props.y_bot * 0.7
    
    # Calculate moments and shear
    # At transfer (self-weight only)
    M_transfer, V_transfer, _, _ = calculate_moments_and_shear(
        span, [], self_weight_udl, 1.0
    )
    
    # At service (SLS)
    M_service, V_service, _, total_udl = calculate_moments_and_shear(
        span, load_cases, self_weight_udl, 1.0
    )
    
    # At ULS
    M_uls, V_uls, _, _ = calculate_moments_and_shear(
        span, load_cases, self_weight_udl * 1.35, 1.5
    )
    
    # Prestress losses
    losses = calculate_prestress_losses(
        prestress, section_props, concrete, span, eccentricity
    )
    
    # Magnel diagram
    magnel = calculate_magnel_diagram(
        section_props, concrete, M_transfer, M_service, losses, h
    )
    
    # Flexure check
    flexure = calculate_flexure(
        section_props, concrete, prestress, losses, M_uls, M_transfer, eccentricity, h
    )
    
    # Shear check
    shear = calculate_shear(
        section_props, section, concrete, prestress, losses, V_uls, h
    )
    
    # Deflection check
    deflection = calculate_deflection(
        section_props, concrete, prestress, losses, span, total_udl, eccentricity
    )
    
    # Crack width check
    crack_width = calculate_crack_width(
        section_props, concrete, prestress, losses, M_service, eccentricity, h
    )
    
    # Cable concordancy
    concordancy = check_cable_concordancy(tendon, section_props, h)
    
    # Overall status
    checks = [flexure.status, shear.status, deflection.status, crack_width.status]
    overall_status = "PASS" if all(s == "PASS" or "Uncracked" in s for s in checks) else "FAIL"
    
    return AnalysisResults(
        section_properties=section_props,
        prestress_losses=losses,
        magnel_diagram=magnel,
        flexure=flexure,
        shear=shear,
        deflection=deflection,
        crack_width=crack_width,
        cable_concordancy=concordancy,
        overall_status=overall_status
    )
