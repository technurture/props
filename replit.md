# Life Point Medical Centre - EMR System

## Overview
Life Point Medical Centre EMR is a comprehensive Electronic Medical Records (EMR) system built with Next.js 15 and TypeScript. Its primary purpose is to streamline patient care, clinical workflows, billing, and inter-departmental communication within a medical center. The system supports branch-specific and role-based access, aiming to enhance efficiency and patient outcomes. Key capabilities include patient management, appointment scheduling, clinical workflow management, billing and payments, messaging, and staff attendance tracking. The system integrates insurance management into patient registration to streamline verification and billing processes, and aims to be a leading solution for medical record management in the healthcare sector.

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
- **Clinical Workflow**: Structured patient clocking system for seamless handoffs (e.g., Checked In → Nurse → Front Desk → Doctor/Lab/Pharmacy/Billing → Completed), managed by a central `PatientVisit` record. Supports "Lab-Only" visits and flexible patient transfer between departments or to "Complete Visit" (Front Desk). Doctor transfers are filtered to show only currently clocked-in doctors. Doctors can send patients back to nurses for injections and other nursing tasks with nurse assignment. This includes comprehensive lab test workflow integration from doctor ordering to lab completion and billing. **User-Specific Patient Assignment**: When transferring patients between departments, staff must assign patients to specific individuals (e.g., assigning to "Nurse Daniel" instead of the general nurse queue). Each staff member only sees patients specifically assigned to them or unassigned patients in their department queue. This applies to nurses, doctors, lab technicians, pharmacists, and billing staff, ensuring accountability and preventing queue confusion.
- **Billing & Payments**: Invoice generation, payment processing, insurance claims, and debt management, leveraging a service charges catalog for pricing. Service charges support flexible billing types: flat rate (one-time), per day, and per hour (for admitted patients), enabling accurate billing for hospital admissions and time-based services.
- **Messaging & Notifications**: In-app communication and real-time event-driven notifications with loud audio alerts (90% volume). The system includes iPhone-style tri-tone sound notifications (E6→G6→A6 frequencies) that play when new notifications arrive, with automatic Web Audio API fallback if custom audio file is not available. Custom notification sound can be added as `/public/notification-sound.mp3`.
- **Staff Attendance**: Manual clock-in/out system with toggle in header (no automatic clock-in on login). Users control their attendance status independently of login/logout. Real-time attendance tracking with total hours displayed in user profile dropdown.
- **Real-Time Queue Management**: Department-specific queue dashboards with auto-refresh and role-based filtering.
- **Doctor Consultation Workflow**: Comprehensive consultation system including chief complaints, history, physical exams, diagnosis, treatment plans, prescriptions, and lab orders.
- **Lab & Pharmacy Clock-In Workflows**: Department-specific workflows for processing lab tests and dispensing medications.
- **Department Record Viewing**: Staff can view comprehensive patient records across departments, with intelligent status filtering for lab and medical results.
- **Staff Directory**: Universal read-only directory accessible to all departments showing staff members with role filtering, on-duty status toggle, search functionality, and pagination. Distinguishes from "Staff Management" (admin-only CRUD operations). Uses dedicated `staff_directory:read` permission with sanitized data exposure (no sensitive contact information).
- **User Profile Management**: Users can manage their profiles, including image uploads via Cloudinary.
- **Session Management & Multi-User Support**: Robust session handling with JWT token refresh (5-minute TTL), role routing, and secure logout. Session tokens automatically refresh user branch assignments and role data from the database every 5 minutes, ensuring that manager branch reassignments and user deactivations are reflected without requiring logout. Deactivated or deleted users have their sessions invalidated within 5 minutes.
- **Settings Management**: Streamlined general, security, and notification settings with password change functionality and enhanced duplicate email error handling.
- **Manager Role & Branch Assignment**: Managers can be assigned to specific branches with comprehensive permissions but branch-restricted access. Branch management interface includes manager search and assignment functionality.
- **Insurance Patient Data**: Direct access to patient visit data and service history per insurance provider. Clicking "View Patients" on any insurance provider in Insurance Management displays comprehensive patient activity data with filtering by date range and search capabilities, plus CSV export functionality. Access control: ADMIN (cross-branch), MANAGER (branch-restricted), ACCOUNTING, and BILLING roles.
- **Bulk Import/Export System**: Excel-based bulk import and export functionality for managing Insurance, Pharmacy, Service Charges, and Staff data. Exported Excel templates include dropdown validation for enum fields (Insurance type, Pharmacy units, Service Charge categories/billing types, Staff roles) to ensure data consistency and prevent entry errors. Templates include separate sheets for allowed values, validation rules, and example data.

**User Roles:** Nine distinct role-based access levels: ADMIN, MANAGER, FRONT_DESK, NURSE, DOCTOR, LAB, PHARMACY, BILLING, and ACCOUNTING, with granular permissions, dynamic sidebar filtering, and API route protection. Managers can be assigned to specific branches and have comprehensive permissions similar to admin but restricted to their assigned branch only.

**UI/UX Decisions:**
- **Components**: Leverages Ant Design and React Bootstrap for a modern interface.
- **Data Visualization**: ApexCharts for data presentation and FullCalendar for scheduling.
- **Branding**: Consistent use of navy blue, red, and white color scheme; "Life Point Medical Centre" branding.
- **Mobile Responsiveness**: Comprehensive mobile-first design with responsive typography, touch target optimization, and iOS Safari viewport handling.
- **Accessibility**: Implemented with proper ARIA labels, roles, and live regions.
- **Action Elements**: Direct action icons (view, edit, delete) replace dropdowns for improved usability.

**Technical Implementations:**
- **State Management**: Redux Toolkit.
- **Styling**: SCSS/Sass.
- **Deployment**: Configured for Autoscale deployment on Replit using `output: 'standalone'`, optimized with Turbopack. Fully containerized using a multi-stage Dockerfile.
- **Next.js Configuration**: Includes `serverExternalPackages` for Mongoose and Webpack configurations. All API routes utilize Next.js 15 Route Handlers with async params and are TypeScript production-ready.
- **Location Integration**: Comprehensive Nigerian administrative location system (State → LGA → Ward).

**System Design Choices:**
- **Cross-Branch Viewing with Edit Restrictions**: Staff can view data across all branches, but edit/delete operations are restricted to their own branch. Admins have full cross-branch access.
- **API Endpoints**: Complete CRUD operations with read/write permission separation, enforcing branch isolation for write operations.
- **Inter-Departmental Data Flow**: A central `PatientVisit` record tracks patient journeys, with each department updating the same record and `currentStage` field.

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