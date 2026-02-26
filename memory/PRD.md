# Eurocode 2 Slab Design App - PRD

## Original Problem Statement
Build an app for structural design of slabs to Eurocode 2 with PDF output.

## User Choices
- Slab Types: All (one-way, two-way, flat slabs)
- Design Checks: All (bending, shear, deflection, crack width)
- Input Parameters: Manual input only
- PDF Output: Summary results with detailed step-by-step calculations, include diagrams
- Authentication: JWT-based login to save/load designs

## User Personas
1. **Structural Engineers** - Need quick, reliable slab design calculations
2. **Civil Engineers** - Require EC2 compliant designs for building projects
3. **Engineering Students** - Learning structural design with detailed calculations

## Core Requirements (Static)
- EC2 compliant calculations for one-way, two-way, and flat slabs
- ULS checks: bending moment, shear, punching shear
- SLS checks: deflection, crack width control
- Material properties database (concrete C20-C50, steel B500)
- Detailed PDF report generation
- User authentication for project persistence

## What's Been Implemented (Feb 2026)
### Backend (FastAPI + MongoDB)
- JWT authentication (register, login, token verification)
- Eurocode 2 calculation engine:
  - One-way slab design (EC2 6.1, 6.2, 7.3, 7.4, 9.2.1)
  - Two-way slab design with moment coefficients
  - Flat slab design with punching shear (EC2 6.4)
- Project CRUD operations
- PDF generation with ReportLab (detailed calculations, diagrams)

### Frontend (React + Tailwind + Shadcn)
- Landing page with features overview
- Auth pages (login/register)
- Dashboard with project management
- New Design page with split-screen layout:
  - Left: Input form with tabs (Geometry, Materials, Loads)
  - Right: Results preview with utilization bars
- Project View page with tabbed results:
  - Summary, Geometry, Bending, Reinforcement, Checks, Diagram

## Prioritized Backlog
### P0 (Critical) - Complete
- [x] User authentication
- [x] All slab type calculations
- [x] PDF generation
- [x] Project save/load

### P1 (Important)
- [ ] Continuous slab support (multi-span)
- [ ] Custom moment coefficients
- [ ] Imperial units option
- [ ] Rebar optimization (bar schedule)

### P2 (Nice to Have)
- [ ] Comparison mode (multiple designs)
- [ ] Export to CAD formats
- [ ] Email PDF reports
- [ ] Team collaboration features

## Next Tasks
1. Add continuous slab analysis (multi-span)
2. Add bar curtailment optimization
3. Include more detailed diagrams in PDF
4. Add support for partial safety factors customization
