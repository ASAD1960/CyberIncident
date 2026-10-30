
# CyberIncident

**A full-stack platform for reporting, investigating, tracking, and managing organizational security incidents.**

CyberIncident is a web-based incident management platform built to centralize incident reporting, coordinate investigations, manage supporting evidence, track workflow progress, maintain audit records, and generate operational reports through a structured interface.

Built with **Next.js, React, TypeScript, and Supabase**, the project demonstrates practical software engineering and cybersecurity concepts, including role-based authorization, database access controls, server-side validation, private evidence storage, and secure application architecture.

**Live Application:** https://cyberincident-hub.netlify.app  
**GitHub Repository:** https://github.com/ASAD1960/CyberIncident

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Project Objectives](#3-project-objectives)
- [4. Key Features](#4-key-features)
- [5. Screenshots and Application Walkthrough](#5-screenshots-and-application-walkthrough)
- [6. User Roles and Permissions](#6-user-roles-and-permissions)
- [7. Incident Management Workflow](#7-incident-management-workflow)
- [8. Evidence Management](#8-evidence-management)
- [9. Reporting and Auditability](#9-reporting-and-auditability)
- [10. Technology Stack](#10-technology-stack)
- [11. System Architecture](#11-system-architecture)
- [12. Repository Structure](#12-repository-structure)
- [13. Security Architecture](#13-security-architecture)
- [14. Installation and Setup](#14-installation-and-setup)
- [15. Environment Configuration](#15-environment-configuration)
- [16. Supabase Configuration](#16-supabase-configuration)
- [17. Running the Application](#17-running-the-application)
- [18. Testing and Validation](#18-testing-and-validation)
- [19. Deployment](#19-deployment)
- [20. Organizational Adoption](#20-organizational-adoption)
- [21. Operational Considerations](#21-operational-considerations)
- [22. Future Development Roadmap](#22-future-development-roadmap)
- [23. Contributing](#23-contributing)
- [24. Security Reporting](#24-security-reporting)
- [25. License](#25-license)

---

## 1. Project Overview

Modern organizations rely on digital systems to deliver services, communicate, store information, and manage daily operations. When a security, technical, or operational incident occurs, teams need a consistent way to report the issue, assign responsibility, investigate the circumstances, document actions, preserve supporting evidence, and track resolution.

CyberIncident provides a centralized environment for managing these activities through a structured web application.

The platform brings together incident intake, incident records, investigation notes, workflow management, evidence handling, notifications, administrative operations, and reporting.

The project demonstrates how modern full-stack development techniques can be applied to cybersecurity-oriented workflows while emphasizing maintainability, access control, and secure data handling.

### Potential application areas

- Internal IT support and operational incident management.
- Cybersecurity incident intake and investigation coordination.
- University and campus IT support operations.
- Technical issue reporting and follow-up.
- Internal risk tracking and corrective-action management.
- Audit findings and operational accountability.

These are potential use cases rather than claims of existing production deployments or regulatory certification.

---

## 2. Problem Statement

Incident information is often distributed across emails, spreadsheets, messaging applications, and separate tracking systems. This can result in inconsistent records, unclear responsibility, limited investigation visibility, poorly organized evidence, and difficulty producing reliable reports.

CyberIncident addresses these challenges by providing a structured foundation for incident reporting, investigation coordination, evidence management, workflow tracking, and operational reporting in one application.

---

## 3. Project Objectives

The primary objectives are to:

1. Centralize incident reporting and record management.
2. Implement role-aware access to application functionality.
3. Organize investigation activities and workflow progress.
4. Provide structured evidence-upload and access mechanisms.
5. Maintain relevant incident history and audit activity.
6. Validate user input before sensitive operations.
7. Apply database-level authorization through Supabase Row Level Security (RLS).
8. Provide dashboard summaries and CSV reporting.
9. Maintain a modular and extensible application architecture.
10. Establish a foundation for future integration with organizational security and IT systems.

---

## 4. Key Features

### Authentication and account management

- Login interface.
- Password-reset request and reset pages.
- Authentication callback handling.
- Session-aware application access.
- User profile functionality.
- Server-side authentication and permission helpers.

Authentication behavior depends on the connected Supabase project's configuration, including email delivery and redirect settings.

### Incident management

- Incident listing and overview pages.
- Incident creation and detail views.
- Server-side incident operations.
- Input validation for incident-related data.
- Workflow and status management logic.
- Investigation notes and timeline-oriented components.
- Role-aware authorization for protected operations.

### Dashboard and analytics

- Dashboard overview.
- Incident-related statistical summaries.
- Reusable chart visualizations.
- Bar-list and trend-chart components.
- Visual summaries of operational data.

### Evidence management

- Evidence upload interface.
- Server-side evidence-handling services.
- File-validation utilities.
- Supabase Storage integration.
- Authorization checks before evidence downloads.
- Short-lived signed download links.
- Audit recording for selected evidence operations.

### Notifications

- Notification center interface.
- Notification-related service layer.
- Foundation for communicating relevant application updates.

External email, SMS, or messaging delivery requires separate configuration and validation.

### Reporting and CSV export

- Reporting interface.
- Report query and service modules.
- CSV export endpoint.
- CSV cell handling intended to reduce spreadsheet formula-injection risks.
- Response metadata indicating when an export reaches its configured row limit.

The current browser download interface does not yet display a dedicated warning for truncated exports.

### Administration

- Administrative user-management interface.
- Administrative settings interface.
- Audit activity interface.
- Server-side administrative actions.
- Profile-access helpers and database restrictions.

Administrative permissions must be configured and tested for the intended deployment.

---

## 5. Screenshots and Application Walkthrough

The following screenshots provide a visual overview of CyberIncident's user interface and major application workflows.

### 5.1 Login Page

The login page provides the main entry point to CyberIncident. It allows registered users to access the application through the authentication interface.

![CyberIncident Login Page](Screenshots/login%20page.png)

### 5.2 Login Page with User Login

This screenshot demonstrates the login interface during the user authentication experience.

![CyberIncident User Login](Screenshots/login%20page%20with%20user%20login.png)

### 5.3 Dashboard

The dashboard provides an overview of the application and its incident-related information. It gives users a central starting point for navigating the platform and reviewing operational summaries.

![CyberIncident Dashboard](Screenshots/Dasboard.png)

### 5.4 Report an Incident

The incident reporting interface allows users to submit security or operational incidents by providing a summary, detailed description, category, urgency, and relevant affected-system information.

![Report an Incident](Screenshots/report%20an%20incident.png)

### 5.5 Report Submitted

This screen demonstrates the confirmation experience after an incident report has been submitted successfully.

![Incident Report Submitted](Screenshots/report%20sumbitted.png)

### 5.6 Reports Timeline and Information

The reports timeline provides a view of incident records and their associated information, helping users review incidents and follow their progress.

![Reports Timeline and Information](Screenshots/reports%20time%20line%20and%20info.png)

### 5.7 Report Summary

The report summary presents structured information about an incident in a readable format, helping users review the reported issue and its details.

![Incident Report Summary](Screenshots/report%20summery.png)

### 5.8 Detailed Report Summary

This screenshot shows an additional report-summary view with further incident information, supporting a more detailed review of the recorded report.

![Detailed Incident Report Summary](Screenshots/report%20summery%202.png)

### 5.9 Notifications

The notifications interface provides a central place for users to view application notifications and relevant activity updates.

![CyberIncident Notifications](Screenshots/notifiction.png)

### 5.10 User Profile

The profile page provides access to the user's account information and profile-related functionality.

![CyberIncident User Profile](Screenshots/profile.png)

### 5.11 Sidebar Navigation

The sidebar provides navigation between the main application sections, helping users access the dashboard, incidents, reports, notifications, profile, and other available areas.

![CyberIncident Sidebar Navigation](Screenshots/side%20bar.png)

---

## 6. User Roles and Permissions

CyberIncident uses a role-aware access model. Database policies, server-side authorization logic, and administrative functions collectively determine which operations are permitted.

| Role | Intended responsibilities |
|---|---|
| Reporter | Submit incidents and access records permitted by ownership and authorization rules. |
| Analyst / Investigator | Review authorized incidents, document investigations, and perform permitted workflow and evidence operations. |
| Administrator | Perform authorized administrative tasks, manage permitted user settings, and review audit activity. |

The final permissions depend on the deployed database policies and application configuration. Each role should be tested against both allowed and denied operations, including direct API requests that bypass the user interface.

---

## 7. Incident Management Workflow

A typical incident-handling process follows these stages:

1. **Reporting:** An authenticated user submits an incident.
2. **Validation:** Server-side logic validates the submitted information and checks identity and permissions.
3. **Registration:** The incident is stored under the configured database access rules.
4. **Review:** Authorized personnel review the incident and determine its priority and ownership.
5. **Investigation:** Authorized users record notes, perform permitted workflow actions, and attach supporting evidence.
6. **Monitoring:** Users track progress and review relevant incident history.
7. **Reporting:** Authorized users retrieve incident data and export reports.
8. **Closure and retention:** Incidents are closed, archived, or retained according to the organization's documented policies.

Severity levels, escalation rules, response targets, approval requirements, and closure criteria should be defined for the intended environment.

---

## 8. Evidence Management

Evidence handling is a security-sensitive part of CyberIncident.

The application uses Supabase Storage for evidence files and separates file storage from database metadata and authorization checks.

### Evidence download flow

1. An authenticated user requests access to an evidence record.
2. The application checks access to the associated evidence metadata.
3. The server uses its privileged Supabase client to generate a signed download URL.
4. Relevant evidence-access activity is recorded through the audit service.
5. The signed URL expires after the configured 60-second period.

### Evidence security considerations

- The evidence bucket must remain private.
- File-size and content-type restrictions must match the application's validation rules.
- Access must be tested using separate user roles.
- Signed URLs must not be published or unnecessarily written to logs.
- Retention and deletion procedures must be documented.
- Sensitive deployments may require malware scanning, integrity verification, legal holds, and chain-of-custody procedures.

A signed URL is a temporary bearer credential. Anyone who obtains it may be able to use it until it expires. Actual security depends on the deployed Storage configuration and server-side authorization.

---

## 9. Reporting and Auditability

CyberIncident provides reporting functionality for retrieving incident-related information and exporting it as CSV for analysis in spreadsheet and reporting tools.

The export implementation includes handling intended to reduce formula-injection risks and response metadata for identifying exports that reach their configured row limit.

Audit-related services and the administrative interface provide a foundation for reviewing selected application activity.

An organizational audit policy should define which actions are recorded, who may access audit records, how long records are retained, how sensitive information is excluded from logs, and how records are protected against unauthorized modification.

Application audit logs should not automatically be considered immutable or tamper-proof. High-assurance environments may require independent log storage and stronger integrity controls.

---

## 10. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 15.5.28 | Full-stack framework and App Router |
| React 19 | Component-based user interface |
| TypeScript | Static typing and maintainability |
| Tailwind CSS 3 | Utility-first styling |
| Supabase Auth | Authentication and session integration |
| Supabase PostgreSQL | Relational database |
| Supabase Row Level Security | Database access restrictions |
| Supabase Storage | Evidence-file storage |
| Zod | Input validation |
| Lucide React | Icons |
| Recharts | Dashboard visualizations |
| ESLint | Code-quality checks |

The installed package versions in `package.json` and `package-lock.json` are the authoritative reference for dependencies.

---

## 11. System Architecture

CyberIncident follows a modular Next.js architecture that separates the user interface, server-side entry points, validation, authorization, business logic, database access, and evidence-storage operations.

```text
                       User / Browser
                             |
                             v
                    Next.js App Router
                             |
                +------------+------------+
                |                         |
                v                         v
          Application UI           Session Middleware
                |
                v
       Server Actions / API Routes
                |
                v
        Input Validation (Zod)
                |
                v
      Authentication & Authorization
                |
                v
              Services
                |
           +----+------+
           |           |
           v           v
     Authenticated   Restricted Admin
     Supabase Client Supabase Client
           |           |
           v           +------> Private Storage
     PostgreSQL / RLS  |
                       +------> Privileged server operations
```

### Architectural responsibilities

- **UI components:** Render pages, forms, tables, charts, and navigation.
- **Server Actions:** Process supported application mutations.
- **API Route Handlers:** Handle endpoints such as evidence downloads and report exports.
- **Validation modules:** Validate incoming data.
- **Authorization helpers:** Check identity, roles, and permissions.
- **Service modules:** Organize business logic and data operations.
- **Supabase Auth:** Manage authentication.
- **PostgreSQL and RLS:** Apply database access restrictions.
- **Supabase Storage:** Store evidence files.
- **Audit services:** Record selected application activities.

The privileged Supabase client must remain server-side. A service-role key can bypass ordinary RLS protections, so every operation using it must be carefully authorized.

---

## 12. Repository Structure

```text
CyberIncident/
├── Screenshots/
│   ├── login page.png
│   ├── login page with user login.png
│   ├── Dasboard.png
│   ├── report an incident.png
│   ├── report sumbitted.png
│   ├── reports time line and info.png
│   ├── report summery.png
│   ├── report summery 2.png
│   ├── notifiction.png
│   ├── profile.png
│   └── side bar.png
│
├── src/
│   ├── actions/
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── evidence.ts
│   │   ├── incidents.ts
│   │   └── notifications.ts
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── incidents/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   └── reports/
│   │   ├── (auth)/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── incidents/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth/
│   │   ├── security/
│   │   ├── services/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── workflow/
│   ├── middleware.ts
│   └── types/
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 0001_init.sql
│       └── 0002_security_hardening.sql
│
├── .env.example
├── .gitignore
├── SECURITY_REVIEW.md
├── package.json
├── package-lock.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Important directories

- `Screenshots/` — Application screenshots used in the README.
- `src/actions/` — Server-side application actions.
- `src/app/` — Pages, layouts, route handlers, and application entry points.
- `src/components/` — Reusable UI components.
- `src/lib/auth/` — Session and permission helpers.
- `src/lib/security/` — File handling, hashing, and rate-limiting utilities.
- `src/lib/services/` — Application services and data operations.
- `src/lib/supabase/` — Supabase client configurations.
- `src/lib/validation/` — Input validation schemas.
- `src/lib/workflow/` — Workflow status logic.
- `supabase/migrations/` — Database schema and security migrations.

---

## 13. Security Architecture

Security is an important engineering concern throughout the project.

### Security-oriented controls

The source code and migrations include work related to:

- Server-side authentication and permission checks.
- PostgreSQL Row Level Security policies.
- Restricted database grants and security helper functions.
- Profile-access restrictions.
- Incident-history deletion and truncation protections.
- Reporter-reply attribution checks.
- File-validation utilities.
- Private evidence-storage operations.
- Authorization before issuing signed download links.
- Audit recording for selected operations.
- CSV cell handling intended to reduce formula-injection risks.
- Security-related HTTP header configuration.
- Rate-limiting utilities.

These controls represent implementation and hardening work, not proof of complete security.

### Security limitations

- Live Supabase RLS tests have not been completed as part of the recorded source-level review.
- Storage policies and bucket privacy must be verified in the actual deployment.
- Rate limiting is process-local and is not reliable as a shared limit across multiple serverless instances.
- Privileged server-side operations require careful review because the service-role key bypasses normal RLS restrictions.
- Audit logs require an appropriate retention and integrity strategy.
- The project has not undergone an independent penetration test or compliance certification.

See [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md) for additional hardening notes and known gaps.

---

## 14. Installation and Setup

### Prerequisites

Install the following:

- Node.js compatible with the project's Next.js version.
- npm.
- Git.
- A Supabase project for authentication, PostgreSQL, and Storage.

A local Supabase CLI setup is optional but useful for development and migration testing.

### Step 1: Clone the repository

```bash
git clone https://github.com/ASAD1960/CyberIncident.git
cd CyberIncident
```

### Step 2: Install dependencies

```bash
npm install
```

On Windows PowerShell, if the execution policy blocks the npm PowerShell script, use:

```powershell
npm.cmd install
```

### Step 3: Create the environment file

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and replace the placeholders with the correct values for your Supabase project.

**Never commit `.env.local` or publish real credentials.**

### Step 4: Configure Supabase

Review and apply the database migrations to a development or staging project before using the application.

### Step 5: Start the development server

```powershell
npm.cmd run dev
```

Open http://localhost:3000 in your browser.

---

## 15. Environment Configuration

The repository includes `.env.example` as an environment-variable template.

| Variable | Purpose | Security |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-compatible Supabase key | Public; RLS must protect database access |
| `NEXT_PUBLIC_SITE_URL` | Application site URL | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side Supabase operations | **Secret; server-only** |

Example configuration:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server only. Never expose this variable to browser code.
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

These values are placeholders, not working credentials.

Never prefix the service-role key with `NEXT_PUBLIC_`. Do not expose it in client components, browser bundles, screenshots, public issues, or source-control history.

If a real credential is accidentally exposed, rotate it through the relevant provider dashboard and update the affected environments.

---

## 16. Supabase Configuration

### Database migrations

The database migration files are:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_security_hardening.sql`

Review both files before applying them.

The second migration includes security-related changes to profile access, helper-function permissions, incident-history protections, and reporter-reply authorization.

Apply migrations to a development or staging database first. Back up existing data and compare the migrations with the deployed schema before applying them to an established environment.

### Authentication configuration

Configure the site URL and allowed redirect URLs in Supabase Auth for each environment.

Verify:

- Login and logout.
- Password-reset requests and completion.
- Authentication callbacks.
- Expired sessions.
- Access after a role change.
- Redirect behavior on the deployed domain.

### Evidence storage

Create or configure the expected Supabase Storage bucket as private.

Verify the bucket name, allowed file types, file-size limits, access policies, and signed URL behavior against the application's implementation. Do not assume the download endpoint makes a publicly configured bucket private.

### Test accounts

Create separate reporter, analyst, and administrator accounts. Verify permitted and denied actions independently for each role.

---

## 17. Running the Application

Common project commands include:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run start
npm.cmd run lint
npm.cmd run typecheck
```

Use the scripts declared in `package.json`. If a command is not defined there, use the corresponding available script.

Before deployment, run the production build and validate the application against the intended environment configuration.

---

## 18. Testing and Validation

The recorded development and hardening work includes:

- TypeScript type checking passed after the hardening changes.
- ESLint passed at the time of the recorded review.
- A later local production build completed successfully during development.
- Live Supabase/RLS testing remains outstanding.
- Independent penetration testing has not been performed.

Re-run the relevant checks against the current version before release.

### Recommended test plan

- Login, logout, and password-reset flows.
- Expired-session behavior.
- Reporter, analyst, and administrator permission boundaries.
- Direct API and Server Action authorization.
- Incident creation and updates.
- Workflow transition validation.
- Notes and history behavior.
- Evidence upload and unauthorized-download attempts.
- Signed URL expiration.
- Audit-record creation and access.
- CSV correctness and formula-injection cases.
- Export truncation behavior.
- Rate limiting under the intended hosting architecture.
- Database backup and restoration.
- Migration behavior on a staging database.

A successful local build does not establish that deployed database policies, authentication settings, storage permissions, or application workflows are secure.

---

## 19. Deployment

CyberIncident is deployed as a Next.js application connected to a managed Supabase project.

**Live Application:** https://cyberincident-hub.netlify.app  
**Hosting Platform:** Netlify  
**Source Repository:** https://github.com/ASAD1960/CyberIncident

### Deployment process

1. Push the reviewed source code to GitHub.
2. Connect the GitHub repository to Netlify.
3. Confirm the Next.js project settings and build configuration.
4. Configure environment variables through Netlify.
5. Configure the Supabase site URL and allowed redirect URLs for the deployed domain.
6. Apply reviewed database migrations to the appropriate Supabase database.
7. Confirm that the evidence bucket is private.
8. Test every user role and important workflow.
9. Review logs and error handling for accidental exposure of sensitive information.
10. Test backups and recovery procedures.
11. Complete the necessary security and operational reviews before production use.

Keep development and production Supabase projects separate where practical. The service-role key must remain server-side and must never be exposed through browser-visible environment variables.

### Production readiness checklist

- [ ] Database migrations reviewed and applied safely.
- [ ] Database backup and restoration tested.
- [ ] RLS policies tested using authenticated sessions.
- [ ] Storage bucket privacy and policies verified.
- [ ] Administrative access restricted and documented.
- [ ] Authentication and password-reset flows verified.
- [ ] Shared rate limiting implemented for multi-instance deployments.
- [ ] Trusted-proxy IP handling configured correctly.
- [ ] Logs reviewed for secrets and sensitive incident information.
- [ ] Audit retention and integrity requirements defined.
- [ ] Evidence retention and deletion procedures documented.
- [ ] Monitoring, alerting, and support ownership established.
- [ ] Privacy, legal, and regulatory reviews completed where applicable.
- [ ] Independent security assessment completed for the intended risk level.
- [ ] Recovery procedures and incident-response runbooks tested.

---

## 20. Organizational Adoption

CyberIncident is designed to be adaptable, but adoption requires more than deploying the code. Organizations must align the application with their policies, access model, infrastructure, and operational responsibilities.

### Potential adoption scenarios

Depending on customization and validation, the platform could be evaluated for:

- Internal IT incident reporting.
- Security investigation coordination.
- University or campus IT operations.
- Small-team technical incident tracking.
- Internal audit follow-up.
- Operational issue and corrective-action tracking.

These are potential applications rather than claims of existing customer deployments.

### Recommended adoption phases

**Phase 1: Understand the process**

Document incident categories, severity levels, ownership, escalation paths, required fields, response targets, closure criteria, and retention requirements.

**Phase 2: Define access control**

Create a role-permission matrix. Specify who can create, view, assign, investigate, update, export, administer, and close incidents.

**Phase 3: Prepare a staging environment**

Use a separate Supabase project and non-sensitive test data. Review migrations, storage policies, authentication settings, and environment variables.

**Phase 4: Conduct a limited pilot**

Start with a small team and a limited incident category. Train users on reporting quality, evidence handling, privacy, and escalation.

**Phase 5: Evaluate results**

Measure relevant indicators such as reporting completeness, time to triage, assignment delays, overdue incidents, resolution time, and user adoption. Validate calculations before using these metrics for management decisions.

**Phase 6: Complete security and operational reviews**

Verify RLS, permissions, storage access, backup recovery, logging, monitoring, retention, and support procedures. Obtain required approvals before handling sensitive production data.

**Phase 7: Expand gradually**

Add teams, incident categories, and integrations only after the pilot demonstrates that the application and supporting processes work as intended.

### Organization-specific customization

An adopting organization may need to configure or develop:

- Branding and terminology.
- Incident categories, severity levels, and required fields.
- Assignment, approval, escalation, and closure rules.
- Department-level permissions and access boundaries.
- Enterprise identity integration, SSO, and MFA.
- Notification channels and escalation schedules.
- Evidence scanning, retention, and legal-hold procedures.
- Audit policies, monitoring, and alerting.
- Privacy, data-residency, and regulatory requirements.
- Backup, recovery, capacity, and support arrangements.
- Integrations with ticketing systems, SIEM, EDR, identity providers, and asset inventories.

### Scaling to larger organizations

Before organization-wide deployment, assess database query performance, indexes, pagination, concurrency, storage capacity, export workload, logging, and recovery objectives.

The current process-local rate limiter must be replaced with an appropriate shared mechanism before relying on rate limits across multiple serverless instances or replicas.

If multiple organizations will use one deployment, explicit tenant identifiers, tenant-aware authorization, tenant-scoped RLS, and isolation tests must be designed and verified. Separate deployments may be more appropriate when organizations have different security or regulatory requirements.

---

## 21. Operational Considerations

### Access management

- Grant only the permissions needed for each role.
- Review administrator access regularly.
- Remove access when responsibilities change.
- Use separate accounts for permission testing.
- Avoid shared administrator credentials.

### Evidence handling

- Store only data the environment is approved to handle.
- Avoid unnecessary personal information and credentials in incident descriptions.
- Protect signed URLs and exported files.
- Establish evidence-retention and deletion rules.
- Define integrity verification and chain-of-custody requirements when necessary.

### Monitoring and recovery

Organizations should define who monitors application health, reviews audit events, responds to failures, manages credentials, applies security updates, and restores service after an incident.

Backups should cover required database data and consider evidence files, audit records, and configuration separately. A backup is not proven reliable until restoration has been tested.

---

## 22. Future Development Roadmap

Potential improvements include the following. These are proposed extensions rather than claims of existing functionality.

### Security and reliability

- Replace process-local rate limiting with a shared store.
- Add automated integration tests for RLS and permission boundaries.
- Conduct independent penetration testing.
- Add malware scanning and safe evidence-processing workflows.
- Strengthen audit integrity and external retention.
- Improve backup automation and disaster recovery.
- Add centralized monitoring, metrics, and alerting.
- Display export-truncation warnings in the user interface.

### Incident management

- Configurable severity and category models.
- Assignment queues and escalation rules.
- Response-target tracking and overdue reminders.
- Approval workflows for sensitive transitions.
- Incident playbooks and post-incident review templates.
- Incident relationships and duplicate detection.
- More advanced filtering and carefully authorized bulk operations.

### Integrations and user experience

- Enterprise SSO and enforced MFA.
- Reliable email and messaging integrations.
- Integrations with ticketing, SIEM, EDR, asset, and identity systems.
- Improved accessibility and localization.
- Scheduled reports and advanced analytics.
- Documented APIs and integration contracts.

### Governance and scalability

- Tenant isolation for multi-organization use.
- Configurable retention and archival workflows.
- Formal access reviews and approval records.
- Load testing and database performance tuning.
- Capacity planning and operational runbooks.

### Analytics and automation

- Incident trend analysis and recurring-issue detection.
- Controlled automation for routing and enrichment.
- Integration with detection systems to create incident records.
- Optional machine-learning assistance evaluated for accuracy, explainability, privacy, human oversight, and safe failure behavior.

---

## 23. Contributing

Contributions that improve maintainability, correctness, accessibility, testing, and security are welcome.

1. Describe the proposed change or issue.
2. Discuss significant database or permission changes before implementing them.
3. Follow existing validation, authorization, and service patterns.
4. Add tests for behavior and permission boundaries.
5. Run the available lint, type-check, and build commands.
6. Document migration and deployment requirements.
7. Never include real credentials, private incident records, evidence files, or signed URLs in public issues or pull requests.

Database migrations require particular care because they can change data access, integrity, and retention behavior.

---

## 24. Security Reporting

Do not publish exploitable vulnerabilities, credentials, private incident records, or evidence in public issues.

For a deployed instance managed by an organization, report security concerns through its approved private security-reporting channel.

Repository maintainers should establish a private vulnerability-reporting process before inviting security testing.

---

## 25. License

No license has been selected for this repository yet.

Until an appropriate license is added, do not assume the code is available for unrestricted reuse, redistribution, or commercial use. Select and add a license before inviting external reuse.

---

**CyberIncident — A structured foundation for incident reporting, investigation, evidence management, and operational accountability.**
