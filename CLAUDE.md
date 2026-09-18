# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 4020
- `npm run build` - Build the application for production
- `npm start` - Start production server on port 4020
- `npm run lint` - Run ESLint for code quality checks
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without making changes

## Architecture Overview

This is a Next.js 15 application with TypeScript that serves as a car booking/travel management system. The application uses:

- **Database**: SQL Server with Prisma ORM
- **UI Framework**: React 19 with Tailwind CSS and shadcn/ui components
- **Authentication**: JWT tokens with LDAP integration
- **Architecture**: Next.js App Router with API routes

### Key Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (auth, trips, users, etc.)
│   ├── dashboard/         # Dashboard page
│   ├── admin/             # Admin-only pages
│   ├── trips/             # Trip management pages
│   ├── log-usage/         # Usage logging page
│   └── login/             # Authentication page
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── auth-middleware.ts # Authentication middleware utilities
│   ├── ldap-auth.ts       # LDAP authentication logic
│   ├── prisma.ts          # Prisma client configuration
│   └── api.ts             # API utilities
├── hooks/                 # Custom React hooks
├── middleware.ts          # Next.js middleware for auth and routing
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
└── utils/                 # General utility functions
```

### Database Schema

The application uses Prisma with SQL Server and manages:
- `TRAVEL_DETAIL` - Main travel/trip records with approval workflow, locations, and purpose
- `TRAVEL_DETAIL_ITEMS` - Individual trip segments with start/end points
- `TRAVEL_DRIVERS` - Driver assignments for specific trips
- `TV_USERNAME` - User accounts with LDAP integration, department info, and permissions
- `CAR_DETAIL` - Vehicle information including brand, model, plate number, and status
- `DRIVER_DETAIL` - Driver information with contact details and license numbers

### Authentication & Authorization

There are two independent auth checks on the same token, not one shared layer:

- **Edge middleware** (`src/middleware.ts`) verifies the `carWebtime_token` cookie with `jose` and gates page routes (`/dashboard`, `/log-usage`, `/trips`, `/admin`) at the routing layer. It explicitly skips `/api/*` — API auth is left entirely to the route handlers.
- **API routes** call `verifyJwtMiddleware()` (`src/lib/auth-middleware.ts`), which verifies via `JWTService` (`src/services/jwt-service.ts`, using `jsonwebtoken`) and expects the token as a `Bearer` header, not the cookie. The client sends it this way via `fetchWithAuth()` (`src/lib/api.ts`), which reads the same token out of `localStorage`.
- **Role is not a stored field.** `TV_USERNAME` has no role column. `mapRole()` (`src/lib/auth-middleware.ts`) derives `admin` / `approver` / `user` from `TV_USERNAME.DEPARTMENT` (via a hardcoded department allowlist/alias table) at login time, and the result is embedded in the JWT. On every subsequent API request, `verifyJwtMiddleware` re-derives the role from the DB department rather than trusting `payload.role` — but the page-level Edge middleware *does* trust `payload.role` directly for gating `/admin`. Keep this in sync if you change how departments map to roles.
- LDAP (`ldapjs`) is the primary credential check, via `AuthService.authenticate()` → `authenticateWithLDAP()` (`src/lib/ldap-auth.ts`, config in `src/lib/ldap-config.ts`).
- `src/middleware/rate-limit.ts` implements in-memory IP rate limiting but is currently **not wired into `src/middleware.ts`** — it exists but has no effect until imported and called there.

### Path Aliases

The project uses TypeScript path mapping:
- `@/*` maps to `./src/*`

### UI Components

Uses shadcn/ui with:
- Radix UI primitives
- Tailwind CSS for styling
- Lucide React for icons
- Framer Motion for animations

### Environment Configuration

- Server runs on port 4020 (both dev and production, configurable via `PORT` env var)
- Database URL configured via `DATABASE_URL` environment variable
- JWT signing configured via `JWT_SECRET` (access tokens, 30m expiry) and `JWT_REFRESH_SECRET` (refresh tokens, 7d expiry) — both silently fall back to insecure defaults if unset, so always set them
- LDAP authentication configured via `LDAP_URL`, `LDAP_BASE_DNS`, and `LDAP_BASE` env vars
- Email notifications configured via `EMAIL_*` environment variables (SMTP settings)
- Application URLs configured via `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_BASE_URL`

### Development Notes

- Prettier configuration: single quotes, 80 char width, 2 spaces
- Project includes email notifications via nodemailer
- Print functionality available via react-to-print
- Uses Zod for schema validation
- Toast notifications available via react-toastify and sonner
- Charts and data visualization via recharts