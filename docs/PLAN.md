# Deployment Restructure Plan

## Goal
Restructure the application so it can be deployed cleanly in a cloud environment with this target setup:

- Frontend hosted on Vercel
- Backend services hosted on Supabase
- Database hosted on Neon PostgreSQL

The current application is tightly coupled to local server assumptions and direct Prisma access inside the Next.js app. The objective is to separate responsibilities, remove deployment blockers, and make the system suitable for production hosting.

## Current Situation
The app currently combines UI, authentication, data access, and business logic in the same Next.js codebase. That is acceptable for local development, but it creates deployment friction because:

- API routes directly access the database with Prisma
- Several server components query Prisma directly
- Auth is implemented with NextAuth credentials flow and local role claims
- The database schema is still MySQL-based
- Client pages depend on local API routes that assume the backend lives inside the same app

This means the app is functional, but not yet structured as a cloud-friendly deployment where frontend, backend, and database are cleanly separated.

## Target Architecture
The target system should be split into clear layers:

### 1. Frontend Layer
The Next.js application on Vercel should be responsible for:

- Rendering pages and UI components
- Managing client interaction state
- Calling backend services over HTTP or SDKs
- Protecting pages based on authenticated session state
- Displaying dashboard data, product data, customer data, and sale results

The frontend should not directly depend on database access at runtime.

### 2. Backend Layer
Supabase should be used as the backend service layer for:

- Authentication
- Authorization rules
- Service endpoints or backend logic
- Business rules that were previously inside Next.js API routes
- Transactional operations such as sale creation and stock updates

### 3. Database Layer
Neon PostgreSQL should be the persistent relational database for:

- Users and roles
- Categories
- Products
- Customers
- Sales and sale items
- Stock logs

This database should be treated as the production source of truth.

## Core Restructuring Principles
The restructuring should follow these rules:

- Keep UI behavior stable while changing the underlying architecture
- Move data access behind backend boundaries instead of leaving it inside page code
- Preserve the business rules already implemented in the app
- Prefer small, testable migration steps over a single large rewrite
- Make production configuration explicit through environment variables
- Avoid introducing deployment-specific assumptions into page components

## Detailed Restructure Phases

### Phase 1: Confirm Boundaries and Remove Hidden Coupling
This phase is about identifying exactly where the app is coupled and deciding what belongs where.

Tasks:

1. Inventory all runtime data access points.
   - API routes
   - Server components
   - Authentication code
   - Client pages that call internal API endpoints

2. Categorize each module by responsibility.
   - Frontend-only
   - Backend service logic
   - Database access
   - Auth and session management

3. Identify code that must be replaced, not merely moved.
   - Direct Prisma access in API routes
   - Direct Prisma access in dashboard server components
   - NextAuth credentials flow if Supabase Auth becomes the standard

4. Define the new service boundary.
   - Decide how frontend pages will talk to backend services
   - Decide how backend services will expose product, customer, sales, and user operations
   - Decide how role-based access will be enforced

Deliverable:
- A clear boundary map showing which files and features move to Supabase, which remain in Next.js, and which become frontend consumers only.

### Phase 2: Migrate the Data Layer to PostgreSQL
This phase prepares the database layer for Neon PostgreSQL.

Tasks:

1. Update the Prisma datasource provider from MySQL to PostgreSQL.
2. Review schema types for PostgreSQL compatibility.
   - Decimal fields
   - Unique constraints
   - Relations and cascading actions
   - Enum handling
3. Update seed data and any database bootstrap logic for PostgreSQL.
4. Verify the schema can be created and seeded on Neon.
5. Decide whether Prisma remains as a temporary migration tool or only as a backend implementation detail.

Important notes:
- The current MySQL database does not need to be migrated.
- A fresh PostgreSQL database is acceptable.
- The focus is correctness for the new deployment target, not preserving old database state.

Deliverable:
- A working PostgreSQL schema and seed path for Neon.

### Phase 3: Move Backend Responsibilities to Supabase
This is the main architectural change.

Tasks:

1. Extract business logic out of the current Next.js API routes.
   - Product CRUD
   - Category CRUD
   - Customer CRUD
   - User management
   - Sales creation and sales history

2. Rebuild backend access around Supabase services.
   - HTTP endpoints, server functions, or Supabase-native backend logic
   - Shared validation and error handling
   - Consistent response structure

3. Preserve transactional behavior.
   - Sale creation must remain atomic
   - Stock updates must remain consistent with sale creation
   - Stock logs must be written alongside inventory changes

4. Define backend authorization rules.
   - Admin-only user management
   - Role-based access for inventory and sales actions
   - Authenticated access for protected operations

5. Decide what remains in Next.js during the transition.
   - Temporary compatibility wrappers if needed
   - Thin adapters only, not duplicated business logic

Deliverable:
- Backend operations available through Supabase rather than local Prisma-backed Next.js routes.

### Phase 4: Migrate Authentication to Supabase Auth
This phase replaces the current NextAuth-based authentication model.

Tasks:

1. Replace the current credentials-based auth flow.
2. Recreate login and session handling with Supabase Auth.
3. Preserve role information for authorization decisions.
4. Update protected-route checks to match the new auth model.
5. Update client-side session access and provider wiring.
6. Rework user profile handling so roles and identity data are available consistently across the app.

Important notes:
- The current role model must survive the migration.
- Dashboard, POS, users, and inventory screens still need access control.
- Authentication should fit the new backend design instead of forcing the old design to remain.

Deliverable:
- A production-ready Supabase Auth integration with role-based access preserved.

### Phase 5: Refactor Frontend Data Access
Once backend services are in place, the frontend must stop depending on the old local API model.

Tasks:

1. Update the POS page to create sales through the new backend service layer.
2. Update the products page to fetch and mutate data from the new backend layer.
3. Update the customers page to use the new backend layer.
4. Update the dashboard to retrieve statistics without direct Prisma access.
5. Update any remaining client pages or components that rely on internal API routes.
6. Remove assumptions that the frontend and backend share the same runtime.

Important pages to review:
- POS checkout flow
- Products management
- Customers management
- Dashboard statistics
- User management

Deliverable:
- Frontend pages that work against the new backend boundary and no longer depend on tightly coupled local API internals.

### Phase 6: Harden Deployment Configuration
This phase ensures the app behaves correctly in production environments.

Tasks:

1. Add production environment variables for all external services.
   - Neon database connection settings
   - Supabase auth and service settings
   - Vercel deployment URLs

2. Review origin and redirect handling.
   - Local development
   - Preview deployments
   - Production deployments

3. Review server runtime assumptions.
   - Connection handling
   - Session handling
   - CORS or request origin rules if required

4. Remove any development-only assumptions that would fail in production.

Deliverable:
- Production-safe runtime configuration with clear environment setup.

### Phase 7: Test and Validate the Full Flow
The final phase is to verify that the refactor did not break application behavior.

Tasks:

1. Validate login and session persistence.
2. Validate protected route access.
3. Validate product listing, creation, update, and deletion.
4. Validate customer creation and lookup.
5. Validate sale checkout, stock decrement, and stock log creation.
6. Validate dashboard totals and inventory metrics.
7. Validate receipt generation and post-sale refresh behavior.
8. Validate the app in a deployed staging environment before production rollout.

Deliverable:
- A tested deployment-ready application with the main business flows verified.

## Recommended Implementation Order
To reduce risk, the implementation should proceed in this order:

1. Confirm the architecture and service boundary.
2. Migrate the schema and database setup to PostgreSQL.
3. Implement Supabase backend services.
4. Move auth to Supabase Auth.
5. Refactor frontend pages to use the new backend layer.
6. Harden environment and deployment settings.
7. Test everything end to end.

## Files Most Likely to Change
These files are the main hotspots for the restructure:

- app/api/products/route.ts
- app/api/customers/route.ts
- app/api/categories/route.ts
- app/api/sales/route.ts
- app/api/users/route.ts
- lib/auth.ts
- middleware.ts
- components/providers.tsx
- types/next-auth.d.ts
- prisma/schema.prisma
- lib/prisma.ts
- app/(protected)/dashboard/page.tsx
- app/(protected)/pos/page.tsx
- app/(protected)/products/page.tsx
- app/(protected)/customers/page.tsx
- app/layout.tsx
- next.config.ts
- prisma/seed.ts

## Risks To Watch
1. Sales creation is the highest-risk flow because it depends on atomic updates across multiple tables.
2. Auth migration can break protected routes if session shape and role handling are not updated consistently.
3. Frontend pages may still assume local API routes exist, so client data fetching must be reviewed carefully.
4. PostgreSQL migration can expose schema assumptions that were hidden under MySQL.
5. Deployment settings can fail late if environment variables or redirect URLs are not aligned across Vercel and Supabase.

## Success Criteria
The restructure is complete when:

- The app deploys successfully to Vercel
- The backend logic runs through Supabase
- The database runs on Neon PostgreSQL
- Auth works through Supabase Auth
- Protected routes still enforce roles correctly
- CRUD and checkout flows work end to end
- No page depends on direct local Prisma access for production behavior

## Next Step
This document is the working deployment plan. The next step is to start the actual restructuring in small phases, beginning with the architecture boundary and database migration work.
