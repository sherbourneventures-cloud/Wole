"""
PDF Report Generator for Prestressed Beam Design
Uses ReportLab to generate detailed engineering calculation reports
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Line, Rect
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics import renderPDF

from models import BeamDesignInput, AnalysisResults


def create_styles():
    """Create custom paragraph styles for engineering reports"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='ReportTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Section heading
    styles.add(ParagraphStyle(
        name='SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5282'),
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold',
        borderColor=colors.HexColor('#2c5282'),
        borderWidth=1,
        borderPadding=5
    ))
    
    # Subsection heading
    styles.add(ParagraphStyle(
        name='SubsectionHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#2d3748'),
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyText',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        fontName='Helvetica'
    ))
    
    # Equation/calculation style
    styles.add(ParagraphStyle(
        name='Calculation',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Courier',
        leftIndent=20,
        spaceAfter=5,
        backColor=colors.HexColor('#f7fafc')
    ))
    
    # Result style
    styles.add(ParagraphStyle(
        name='Result',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica-Bold',
        leftIndent=20,
        spaceAfter=10
    ))
    
    # Pass style
    styles.add(ParagraphStyle(
        name='Pass',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#276749'),
        alignment=TA_CENTER
    ))
    
    # Fail style
    styles.add(ParagraphStyle(
        name='Fail',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#c53030'),
        alignment=TA_CENTER
    ))
    
    return styles


def create_table_style():
    """Create standard table style for engineering reports"""
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ])


def add_header_footer(canvas, doc):
    """Add header and footer to each page"""
    canvas.saveState()
    
    # Header
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(colors.HexColor('#2c5282'))
    canvas.drawString(20*mm, A4[1] - 15*mm, "BeamForge - Prestressed Beam Design Report")
    
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#718096'))
    canvas.drawRightString(A4[0] - 20*mm, A4[1] - 15*mm, 
                          f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}")
    
    # Header line
    canvas.setStrokeColor(colors.HexColor('#2c5282'))
    canvas.setLineWidth(0.5)
    canvas.line(20*mm, A4[1] - 18*mm, A4[0] - 20*mm, A4[1] - 18*mm)
    
    # Footer
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#718096'))
    canvas.drawString(20*mm, 15*mm, "Calculations per Eurocode 2 (EN 1992-1-1)")
    canvas.drawRightString(A4[0] - 20*mm, 15*mm, f"Page {doc.page}")
    
    # Footer line
    canvas.line(20*mm, 20*mm, A4[0] - 20*mm, 20*mm)
    
    canvas.restoreState()


def generate_pdf_report(design_input: BeamDesignInput, results: AnalysisResults) -> BytesIO:
    """Generate complete PDF report for prestressed beam design"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=25*mm,
        bottomMargin=25*mm,
        title=f"Prestressed Beam Design - {design_input.project_name}",
        author="BeamForge"
    )
    
    styles = create_styles()
    table_style = create_table_style()
    story = []
    
    # Title Page
    story.append(Spacer(1, 50*mm))
    story.append(Paragraph("PRESTRESSED BEAM DESIGN REPORT", styles['ReportTitle']))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(f"Project: {design_input.project_name}", styles['SubsectionHeading']))
    story.append(Paragraph(f"Beam: {design_input.beam_name}", styles['SubsectionHeading']))
    story.append(Spacer(1, 20*mm))
    
    # Summary box
    summary_data = [
        ['Design Summary', ''],
        ['Section Type', design_input.section.section_type.replace('_', ' ').title()],
        ['Span', f'{design_input.span:.2f} m'],
        ['Prestress Type', design_input.prestress.prestress_type.replace('_', ' ').title()],
        ['Concrete Grade', f'C{design_input.concrete.fck:.0f}'],
        ['Overall Status', results.overall_status]
    ]
    
    summary_table = Table(summary_data, colWidths=[80*mm, 80*mm])
    summary_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#2c5282')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (1, 0), 12),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#edf2f7')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a0aec0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (1, -1), (1, -1), 
         colors.HexColor('#c6f6d5') if results.overall_status == 'PASS' else colors.HexColor('#fed7d7')),
        ('TEXTCOLOR', (1, -1), (1, -1),
         colors.HexColor('#276749') if results.overall_status == 'PASS' else colors.HexColor('#c53030')),
        ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
    ]))
    story.append(summary_table)
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("TABLE OF CONTENTS", styles['SectionHeading']))
    toc_items = [
        "1. Input Data",
        "2. Section Properties",
        "3. Prestress Losses",
        "4. Magnel Diagram Analysis",
        "5. Flexure Check (EC2 6.1)",
        "6. Shear Check (EC2 6.2)",
        "7. Deflection Check (EC2 7.4)",
        "8. Crack Width Check (EC2 7.3)",
        "9. Design Summary"
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['BodyText']))
    story.append(PageBreak())
    
    # 1. Input Data
    story.append(Paragraph("1. INPUT DATA", styles['SectionHeading']))
    
    # Geometry
    story.append(Paragraph("1.1 Beam Geometry", styles['SubsectionHeading']))
    geometry_data = [['Parameter', 'Value', 'Unit']]
    geometry_data.append(['Span Length', f'{design_input.span:.2f}', 'm'])
    geometry_data.append(['Section Type', design_input.section.section_type.replace('_', ' ').title(), '-'])
    
    # Add section dimensions based on type
    section = design_input.section
    if section.section_type == "rectangular" and section.rectangular:
        geometry_data.append(['Width (b)', f'{section.rectangular.width:.0f}', 'mm'])
        geometry_data.append(['Height (h)', f'{section.rectangular.height:.0f}', 'mm'])
    elif section.section_type == "t_beam" and section.t_beam:
        geometry_data.append(['Web Width (bw)', f'{section.t_beam.bw:.0f}', 'mm'])
        geometry_data.append(['Flange Width (bf)', f'{section.t_beam.bf:.0f}', 'mm'])
        geometry_data.append(['Flange Thickness (hf)', f'{section.t_beam.hf:.0f}', 'mm'])
        geometry_data.append(['Total Height (h)', f'{section.t_beam.h:.0f}', 'mm'])
    elif section.section_type == "i_beam" and section.i_beam:
        geometry_data.append(['Web Width (bw)', f'{section.i_beam.bw:.0f}', 'mm'])
        geometry_data.append(['Top Flange Width', f'{section.i_beam.bf_top:.0f}', 'mm'])
        geometry_data.append(['Bottom Flange Width', f'{section.i_beam.bf_bot:.0f}', 'mm'])
        geometry_data.append(['Total Height (h)', f'{section.i_beam.h:.0f}', 'mm'])
    elif section.section_type == "box_girder" and section.box_girder:
        geometry_data.append(['Top Width', f'{section.box_girder.b_top:.0f}', 'mm'])
        geometry_data.append(['Bottom Width', f'{section.box_girder.b_bot:.0f}', 'mm'])
        geometry_data.append(['Total Height (h)', f'{section.box_girder.h:.0f}', 'mm'])
    
    geometry_table = Table(geometry_data, colWidths=[60*mm, 50*mm, 30*mm])
    geometry_table.setStyle(table_style)
    story.append(geometry_table)
    story.append(Spacer(1, 10*mm))
    
    # Materials
    story.append(Paragraph("1.2 Material Properties", styles['SubsectionHeading']))
    
    # Concrete
    story.append(Paragraph("Concrete:", styles['BodyText']))
    concrete = design_input.concrete
    concrete_data = [
        ['Property', 'Value', 'Unit'],
        ['Characteristic Strength (fck)', f'{concrete.fck:.1f}', 'MPa'],
        ['Mean Compressive Strength (fcm)', f'{concrete.fcm:.1f}' if concrete.fcm else '-', 'MPa'],
        ['Mean Tensile Strength (fctm)', f'{concrete.fctm:.2f}' if concrete.fctm else '-', 'MPa'],
        ['Modulus of Elasticity (Ecm)', f'{concrete.Ecm:.1f}' if concrete.Ecm else '-', 'GPa'],
        ['Creep Coefficient (φ)', f'{concrete.creep_coefficient:.2f}', '-'],
        ['Shrinkage Strain (εcs)', f'{concrete.shrinkage_strain:.5f}', '-'],
    ]
    concrete_table = Table(concrete_data, colWidths=[70*mm, 40*mm, 30*mm])
    concrete_table.setStyle(table_style)
    story.append(concrete_table)
    story.append(Spacer(1, 5*mm))
    
    # Prestressing Steel
    story.append(Paragraph("Prestressing Steel:", styles['BodyText']))
    steel = design_input.prestress.steel
    steel_data = [
        ['Property', 'Value', 'Unit'],
        ['0.1% Proof Stress (fp0.1k)', f'{steel.fp01k:.0f}', 'MPa'],
        ['Tensile Strength (fpk)', f'{steel.fpk:.0f}', 'MPa'],
        ['Modulus of Elasticity (Ep)', f'{steel.Ep:.0f}', 'GPa'],
        ['Strand Type', steel.strand_type.replace('_', ' ').title(), '-'],
        ['Area per Strand', f'{steel.strand_area:.1f}', 'mm²'],
        ['Number of Strands', f'{design_input.prestress.tendon.num_strands}', '-'],
        ['Total Area (Ap)', f'{steel.strand_area * design_input.prestress.tendon.num_strands:.1f}', 'mm²'],
    ]
    steel_table = Table(steel_data, colWidths=[70*mm, 40*mm, 30*mm])
    steel_table.setStyle(table_style)
    story.append(steel_table)
    story.append(Spacer(1, 5*mm))
    
    # Prestress Details
    story.append(Paragraph("1.3 Prestress Configuration", styles['SubsectionHeading']))
    prestress = design_input.prestress
    tendon = prestress.tendon
    prestress_data = [
        ['Parameter', 'Value', 'Unit'],
        ['Prestress Type', prestress.prestress_type.replace('_', ' ').title(), '-'],
        ['Jacking Stress', f'{prestress.jacking_stress:.1f}', 'MPa'],
        ['Tendon Profile', tendon.profile_type.replace('_', ' ').title(), '-'],
    ]
    
    if tendon.profile_type == "straight" and tendon.eccentricity:
        prestress_data.append(['Eccentricity', f'{tendon.eccentricity:.1f}', 'mm'])
    elif tendon.profile_type in ["parabolic", "multi_parabolic"]:
        if tendon.e_end is not None:
            prestress_data.append(['Eccentricity at Ends', f'{tendon.e_end:.1f}', 'mm'])
        if tendon.e_mid is not None:
            prestress_data.append(['Eccentricity at Mid-span', f'{tendon.e_mid:.1f}', 'mm'])
    elif tendon.profile_type == "harped":
        if tendon.e_support is not None:
            prestress_data.append(['Eccentricity at Support', f'{tendon.e_support:.1f}', 'mm'])
        if tendon.e_drape is not None:
            prestress_data.append(['Eccentricity at Drape Point', f'{tendon.e_drape:.1f}', 'mm'])
    
    if prestress.prestress_type == "post_tensioned":
        prestress_data.append(['Friction Coefficient (μ)', f'{prestress.friction_coefficient:.3f}', '-'])
        prestress_data.append(['Wobble Coefficient (k)', f'{prestress.wobble_coefficient:.4f}', '1/m'])
    
    prestress_table = Table(prestress_data, colWidths=[70*mm, 40*mm, 30*mm])
    prestress_table.setStyle(table_style)
    story.append(prestress_table)
    story.append(PageBreak())
    
    # 2. Section Properties
    story.append(Paragraph("2. SECTION PROPERTIES", styles['SectionHeading']))
    sp = results.section_properties
    section_props_data = [
        ['Property', 'Symbol', 'Value', 'Unit'],
        ['Cross-sectional Area', 'A', f'{sp.area:,.0f}', 'mm²'],
        ['Second Moment of Area', 'I', f'{sp.I:,.0f}', 'mm⁴'],
        ['Distance to Top Fiber', 'yt', f'{sp.y_top:.1f}', 'mm'],
        ['Distance to Bottom Fiber', 'yb', f'{sp.y_bot:.1f}', 'mm'],
        ['Section Modulus (Top)', 'Zt', f'{sp.Z_top:,.0f}', 'mm³'],
        ['Section Modulus (Bottom)', 'Zb', f'{sp.Z_bot:,.0f}', 'mm³'],
        ['Perimeter', 'u', f'{sp.perimeter:.0f}', 'mm'],
    ]
    section_props_table = Table(section_props_data, colWidths=[55*mm, 25*mm, 45*mm, 25*mm])
    section_props_table.setStyle(table_style)
    story.append(section_props_table)
    story.append(Spacer(1, 10*mm))
    
    # 3. Prestress Losses
    story.append(Paragraph("3. PRESTRESS LOSSES (EC2 5.10)", styles['SectionHeading']))
    losses = results.prestress_losses
    
    story.append(Paragraph("3.1 Immediate Losses", styles['SubsectionHeading']))
    immediate_data = [
        ['Loss Type', 'Value (MPa)', 'Reference'],
        ['Elastic Shortening', f'{losses.elastic_shortening:.2f}', 'EC2 5.10.4'],
        ['Friction Loss', f'{losses.friction:.2f}', 'EC2 5.10.5.2'],
        ['Anchorage Slip', f'{losses.anchorage_slip:.2f}', 'EC2 5.10.5.3'],
        ['Total Immediate', f'{losses.total_immediate:.2f}', '-'],
    ]
    immediate_table = Table(immediate_data, colWidths=[50*mm, 40*mm, 50*mm])
    immediate_table.setStyle(table_style)
    story.append(immediate_table)
    story.append(Spacer(1, 5*mm))
    
    story.append(Paragraph("3.2 Time-Dependent Losses", styles['SubsectionHeading']))
    timedep_data = [
        ['Loss Type', 'Value (MPa)', 'Reference'],
        ['Creep', f'{losses.creep:.2f}', 'EC2 5.10.6'],
        ['Shrinkage', f'{losses.shrinkage:.2f}', 'EC2 5.10.6'],
        ['Relaxation', f'{losses.relaxation:.2f}', 'EC2 3.3.2'],
        ['Total Time-Dependent', f'{losses.total_time_dependent:.2f}', '-'],
    ]
    timedep_table = Table(timedep_data, colWidths=[50*mm, 40*mm, 50*mm])
    timedep_table.setStyle(table_style)
    story.append(timedep_table)
    story.append(Spacer(1, 5*mm))
    
    story.append(Paragraph("3.3 Total Losses Summary", styles['SubsectionHeading']))
    summary_losses_data = [
        ['Description', 'Value'],
        ['Total Losses', f'{losses.total:.2f} MPa'],
        ['Loss Ratio', f'{losses.loss_ratio:.1f} %'],
        ['Initial Jacking Stress', f'{design_input.prestress.jacking_stress:.1f} MPa'],
        ['Effective Prestress', f'{design_input.prestress.jacking_stress - losses.total:.1f} MPa'],
    ]
    summary_losses_table = Table(summary_losses_data, colWidths=[70*mm, 70*mm])
    summary_losses_table.setStyle(table_style)
    story.append(summary_losses_table)
    story.append(PageBreak())
    
    # 4. Magnel Diagram Analysis
    story.append(Paragraph("4. MAGNEL DIAGRAM ANALYSIS", styles['SectionHeading']))
    magnel = results.magnel_diagram
    story.append(Paragraph(
        "The Magnel diagram provides a graphical method to determine the feasible combinations of "
        "prestressing force and eccentricity that satisfy stress limits at both transfer and service stages.",
        styles['BodyText']
    ))
    
    if magnel.optimal_point:
        story.append(Paragraph("4.1 Optimal Design Point", styles['SubsectionHeading']))
        optimal_P = 1 / (magnel.optimal_point.inverse_force / 1000) if magnel.optimal_point.inverse_force > 0 else 0
        magnel_results = [
            ['Parameter', 'Value', 'Unit'],
            ['Optimal Prestressing Force', f'{optimal_P:.1f}', 'kN'],
            ['Optimal Eccentricity', f'{magnel.optimal_point.eccentricity:.1f}', 'mm'],
            ['Minimum Eccentricity (geometric)', f'{magnel.min_eccentricity:.1f}', 'mm'],
            ['Maximum Eccentricity (geometric)', f'{magnel.max_eccentricity:.1f}', 'mm'],
        ]
        magnel_table = Table(magnel_results, colWidths=[60*mm, 50*mm, 30*mm])
        magnel_table.setStyle(table_style)
        story.append(magnel_table)
    story.append(PageBreak())
    
    # 5. Flexure Check
    story.append(Paragraph("5. FLEXURE CHECK (EC2 6.1)", styles['SectionHeading']))
    flexure = results.flexure
    
    story.append(Paragraph("5.1 Design Actions and Resistance", styles['SubsectionHeading']))
    flexure_data = [
        ['Parameter', 'Value', 'Unit'],
        ['Design Moment (MEd)', f'{flexure.M_Ed:.2f}', 'kNm'],
        ['Moment Resistance (MRd)', f'{flexure.M_Rd:.2f}', 'kNm'],
        ['Utilization Ratio', f'{flexure.utilization:.3f}', '-'],
    ]
    flexure_table = Table(flexure_data, colWidths=[60*mm, 50*mm, 30*mm])
    flexure_table.setStyle(table_style)
    story.append(flexure_table)
    story.append(Spacer(1, 5*mm))
    
    story.append(Paragraph("5.2 Stress Verification", styles['SubsectionHeading']))
    stress_data = [
        ['Location', 'At Transfer (MPa)', 'At Service (MPa)'],
        ['Top Fiber', f'{flexure.sigma_top_transfer:.2f}', f'{flexure.sigma_top_service:.2f}'],
        ['Bottom Fiber', f'{flexure.sigma_bot_transfer:.2f}', f'{flexure.sigma_bot_service:.2f}'],
    ]
    stress_table = Table(stress_data, colWidths=[50*mm, 50*mm, 50*mm])
    stress_table.setStyle(table_style)
    story.append(stress_table)
    story.append(Spacer(1, 5*mm))
    
    # Status
    status_style = 'Pass' if flexure.status == 'PASS' else 'Fail'
    story.append(Paragraph(f"FLEXURE CHECK: {flexure.status}", styles[status_style]))
    story.append(Spacer(1, 10*mm))
    
    # 6. Shear Check
    story.append(Paragraph("6. SHEAR CHECK (EC2 6.2)", styles['SectionHeading']))
    shear = results.shear
    
    shear_data = [
        ['Parameter', 'Value', 'Unit'],
        ['Design Shear Force (VEd)', f'{shear.V_Ed:.2f}', 'kN'],
        ['Concrete Shear Resistance (VRd,c)', f'{shear.V_Rd_c:.2f}', 'kN'],
        ['Maximum Shear Resistance (VRd,max)', f'{shear.V_Rd_max:.2f}', 'kN'],
        ['Utilization Ratio', f'{shear.utilization:.3f}', '-'],
    ]
    
    if shear.shear_reinforcement_required:
        shear_data.append(['Shear Reinforcement Required', 'YES', '-'])
        if shear.Asw_s:
            shear_data.append(['Required Asw/s', f'{shear.Asw_s:.2f}', 'mm²/m'])
    else:
        shear_data.append(['Shear Reinforcement Required', 'NO', '-'])
    
    shear_table = Table(shear_data, colWidths=[70*mm, 40*mm, 30*mm])
    shear_table.setStyle(table_style)
    story.append(shear_table)
    story.append(Spacer(1, 5*mm))
    
    status_style = 'Pass' if shear.status == 'PASS' else 'Fail'
    story.append(Paragraph(f"SHEAR CHECK: {shear.status}", styles[status_style]))
    story.append(PageBreak())
    
    # 7. Deflection Check
    story.append(Paragraph("7. DEFLECTION CHECK (EC2 7.4)", styles['SectionHeading']))
    deflection = results.deflection
    
    deflection_data = [
        ['Parameter', 'Value', 'Unit'],
        ['Immediate Deflection', f'{deflection.delta_immediate:.2f}', 'mm'],
        ['Long-term Deflection', f'{deflection.delta_long_term:.2f}', 'mm'],
        ['Total Deflection', f'{deflection.delta_total:.2f}', 'mm'],
        ['Span/Deflection Ratio', f'{deflection.span_ratio:.0f}', '-'],
        ['Allowable Deflection (L/250)', f'{deflection.limit:.2f}', 'mm'],
        ['Utilization Ratio', f'{deflection.utilization:.3f}', '-'],
    ]
    deflection_table = Table(deflection_data, colWidths=[60*mm, 50*mm, 30*mm])
    deflection_table.setStyle(table_style)
    story.append(deflection_table)
    story.append(Spacer(1, 5*mm))
    
    status_style = 'Pass' if deflection.status == 'PASS' else 'Fail'
    story.append(Paragraph(f"DEFLECTION CHECK: {deflection.status}", styles[status_style]))
    story.append(Spacer(1, 10*mm))
    
    # 8. Crack Width Check
    story.append(Paragraph("8. CRACK WIDTH CHECK (EC2 7.3)", styles['SectionHeading']))
    crack = results.crack_width
    
    if crack:
        crack_data = [
            ['Parameter', 'Value', 'Unit'],
            ['Calculated Crack Width (wk)', f'{crack.wk:.4f}', 'mm'],
            ['Allowable Crack Width', f'{crack.wk_limit:.2f}', 'mm'],
            ['Maximum Crack Spacing (sr,max)', f'{crack.sr_max:.2f}', 'mm'],
            ['Strain Difference (εsm - εcm)', f'{crack.epsilon_sm_cm:.6f}', '-'],
            ['Utilization Ratio', f'{crack.utilization:.3f}', '-'],
        ]
        crack_table = Table(crack_data, colWidths=[70*mm, 40*mm, 30*mm])
        crack_table.setStyle(table_style)
        story.append(crack_table)
        story.append(Spacer(1, 5*mm))
        
        status_style = 'Pass' if 'PASS' in crack.status else 'Fail'
        story.append(Paragraph(f"CRACK WIDTH CHECK: {crack.status}", styles[status_style]))
    story.append(PageBreak())
    
    # 9. Design Summary
    story.append(Paragraph("9. DESIGN SUMMARY", styles['SectionHeading']))
    
    summary_final = [
        ['Check', 'Status', 'Utilization'],
        ['Flexure (EC2 6.1)', flexure.status, f'{flexure.utilization:.3f}'],
        ['Shear (EC2 6.2)', shear.status, f'{shear.utilization:.3f}'],
        ['Deflection (EC2 7.4)', deflection.status, f'{deflection.utilization:.3f}'],
        ['Crack Width (EC2 7.3)', crack.status if crack else 'N/A', f'{crack.utilization:.3f}' if crack else 'N/A'],
        ['Cable Concordancy', 'PASS' if results.cable_concordancy else 'FAIL', '-'],
    ]
    
    summary_final_table = Table(summary_final, colWidths=[60*mm, 40*mm, 40*mm])
    
    # Custom styling for pass/fail cells
    base_style = create_table_style()
    for i, row in enumerate(summary_final[1:], 1):
        if 'PASS' in row[1]:
            base_style.add('BACKGROUND', (1, i), (1, i), colors.HexColor('#c6f6d5'))
            base_style.add('TEXTCOLOR', (1, i), (1, i), colors.HexColor('#276749'))
        elif 'FAIL' in row[1]:
            base_style.add('BACKGROUND', (1, i), (1, i), colors.HexColor('#fed7d7'))
            base_style.add('TEXTCOLOR', (1, i), (1, i), colors.HexColor('#c53030'))
    
    summary_final_table.setStyle(base_style)
    story.append(summary_final_table)
    story.append(Spacer(1, 10*mm))
    
    # Overall verdict
    overall_style = 'Pass' if results.overall_status == 'PASS' else 'Fail'
    story.append(Paragraph(f"OVERALL DESIGN STATUS: {results.overall_status}", styles[overall_style]))
    
    # Notes
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("NOTES:", styles['SubsectionHeading']))
    notes = [
        "1. All calculations are performed in accordance with Eurocode 2 (EN 1992-1-1).",
        "2. Material partial factors: γc = 1.5 for concrete, γs = 1.15 for prestressing steel.",
        "3. This report should be reviewed by a qualified structural engineer.",
        "4. Site conditions and construction tolerances may affect final design."
    ]
    for note in notes:
        story.append(Paragraph(note, styles['BodyText']))
    
    # Build PDF
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    
    buffer.seek(0)
    return buffer
