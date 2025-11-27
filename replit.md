# NuncCare EMR System

## Overview
NuncCare EMR is a comprehensive Electronic Medical Records (EMR) system built with Next.js 15 and TypeScript. Its primary purpose is to streamline patient care, clinical workflows, billing, and inter-departmental communication within healthcare organizations. The system supports multi-tenancy architecture, branch-specific and role-based access, aiming to enhance efficiency and patient outcomes. Key capabilities include patient management, appointment scheduling, clinical workflow management, billing and payments, messaging, and staff attendance tracking. The system integrates insurance management into patient registration to streamline verification and billing processes.

## Recent Changes (November 27, 2025)
- **Multi-Tenancy Architecture Implementation**: Added complete multi-tenancy support
  - Tenant model with plan-based limits (starter, professional, enterprise, trial)
  - Tenant resolution from subdomains and custom domains
  - User and Branch models linked to tenants via tenantId
  - Organization signup flow creating isolated tenant environments
  - Marketing landing page with pricing and signup for new organizations
- **Branding Update**: Updated from Life Point Medical Centre to NuncCare branding
  - New logo and favicon throughout the application
  - Updated page titles and metadata
  - Modern landing page with healthcare imagery
  - Professional signup flow for new organizations

## Multi-Tenancy Architecture

### How Data Isolation Works
Each healthcare organization (tenant) using NuncCare gets their own completely isolated environment:

1. **Tenant Identification**: Every organization has a unique tenant ID stored in the `Tenant` collection
2. **Data Segregation**: All critical data models (Users, Branches, Patients, Visits, Billing, etc.) are linked to a tenant via `tenantId`
3. **Query Filtering**: API endpoints automatically filter data by the current tenant's ID
4. **Subdomain Routing**: Organizations access their data via unique subdomains (e.g., `myclinic.nunccare.app`)

### Key Isolation Points
- **Users**: Staff accounts are created within a specific tenant and can only access that tenant's data
- **Branches**: Clinic branches belong to a single tenant
- **Patients**: Patient records are tenant-specific
- **Billing & Invoices**: Financial data is completely isolated per tenant
- **Settings**: Each tenant can customize their branding, timezone, and preferences

### Plan-Based Limits
| Feature | Trial | Starter | Professional | Enterprise |
|---------|-------|---------|--------------|------------|
| Users | 5 | 10 | 50 | Unlimited |
| Branches | 1 | 1 | 5 | Unlimited |
| Patients/Month | 50 | 500 | 2,000 | Unlimited |
| Storage | 500MB | 2GB | 10GB | 50GB |
| Telemedicine | No | No | Yes | Yes |
| API Access | No | No | No | Yes |
| White-label | No | No | No | Yes |

## User Preferences
The user prefers a development approach that emphasizes:
- **Clarity**: Simple, clear explanations for any proposed changes or issues.
- **Modularity**: Prioritize solutions that are modular and maintainable.
- **Security**: Focus on robust security measures, especially for patient data and access control.
- **Efficiency**: Optimize for performance and efficient resource usage within the Replit environment.
- **Iterative Development**: Develop features incrementally, allowing for regular feedback and adjustments.
- **Autonomy**: The agent should take initiative in identifying and fixing issues, but report them.

## System Architecture
The EMR system utilizes Next.js 15 with the App Router, TypeScript, and React 19. Data persistence is managed by MongoDB with Mongoose, and authentication is handled by NextAuth. The UI integrates Bootstrap 5, Ant Design, and React Bootstrap for a responsive user experience.

**Core Features:**
- **Patient Management**: Registration, record keeping, document uploads, medical history, vitals, and insurance integration.
- **Appointment Scheduling**: Calendar-based booking and patient self-service.
- **Clinical Workflow**: Structured patient clocking system for seamless handoffs (e.g., Checked In → Nurse → Front Desk → Doctor/Lab/Pharmacy/Billing → Completed), managed by a central `PatientVisit` record.
- **Billing & Payments**: Invoice generation, payment processing, insurance claims, and debt management, leveraging a service charges catalog for pricing.
- **Messaging & Notifications**: In-app communication and real-time event-driven notifications with audio alerts.
- **Staff Attendance**: Manual clock-in/out system with toggle in header.
- **Real-Time Queue Management**: Department-specific queue dashboards with auto-refresh and role-based filtering.
- **Multi-Tenancy**: Complete data isolation between healthcare organizations with plan-based feature limits.
- **Marketing Website**: Landing page with pricing, features, and organization signup.

**User Roles:** Nine distinct role-based access levels: ADMIN, MANAGER, FRONT_DESK, NURSE, DOCTOR, LAB, PHARMACY, BILLING, and ACCOUNTING, with granular permissions, dynamic sidebar filtering, and API route protection.

**UI/UX Decisions:**
- **Components**: Leverages Ant Design and React Bootstrap for a modern interface.
- **Data Visualization**: ApexCharts for data presentation and FullCalendar for scheduling.
- **Branding**: NuncCare healthcare branding with teal (#0D9488) and navy (#1E3A5F) color scheme.
- **Mobile Responsiveness**: Comprehensive mobile-first design with responsive typography.
- **Accessibility**: Implemented with proper ARIA labels, roles, and live regions.

**Technical Implementations:**
- **State Management**: Redux Toolkit.
- **Styling**: SCSS/Sass.
- **Deployment**: Configured for Autoscale deployment on Replit using `output: 'standalone'`.
- **Next.js Configuration**: Includes `serverExternalPackages` for Mongoose.

**System Design Choices:**
- **Tenant Isolation**: All data queries are scoped to the authenticated user's tenant.
- **Cross-Branch Viewing with Edit Restrictions**: Staff can view data across all branches, but edit/delete operations are restricted to their own branch.
- **API Endpoints**: Complete CRUD operations with tenant-scoped read/write permissions.

## External Dependencies
- **Database**: MongoDB (with Mongoose ORM)
- **Authentication**: NextAuth
- **File Storage**: Cloudinary
- **Email Services**: EmailJS
- **Payment Gateway**: Paystack
- **UI Libraries**: Bootstrap 5, Ant Design, React Bootstrap
- **Calendar**: FullCalendar
- **Charting**: ApexCharts
- **Rich Text Editor**: React Quill

## Project Structure
```
src/
├── app/
│   ├── (authentication)/   # Login, signup, password reset pages
│   ├── (marketing)/        # Landing page, pricing, features, signup
│   ├── (pages)/            # Main application pages
│   └── api/                # API routes
├── components/             # React components
├── core/                   # Core utilities and common components
├── lib/                    # Database connection, services, utilities
├── models/                 # Mongoose models (Tenant, User, Branch, etc.)
├── style/                  # SCSS stylesheets
└── types/                  # TypeScript type definitions
```
