# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build with optimized chunks
- `npm run build:dev` - Development mode build
- `npm run lint` - ESLint code quality checks
- `npm run preview` - Preview production build

## Architecture Overview

BeautyFetch is a multi-tenant e-commerce platform built with React, TypeScript, Vite, and Supabase. The app serves three primary user types:

### User Roles & Authentication
- **Customers**: Browse products, place orders, track deliveries
- **Merchants (store_owner)**: Manage stores, products, inventory, orders
- **Drivers**: Handle deliveries and track earnings
- **Admins**: Platform administration and approvals

Authentication is managed through `src/contexts/AuthContext.tsx` which handles:
- Role-based access control with cached role checking
- Session management with tab visibility handling
- Profile and store data fetching
- Multi-role authentication flows

### Core Architecture Patterns

**Multi-Context Architecture**: The app uses nested context providers in `App.tsx`:
```
AuthProvider → CartProvider → LocationProvider → QueryClientProvider
```

**Role-Based Routing**: Different authentication flows and dashboards for each user type:
- `/login` - Customer auth
- `/merchant/login` - Merchant auth  
- `/driver/login` - Driver auth
- `/admin` - Admin dashboard (protected by AdminRoute)

**Database Integration**: 
- Supabase client configuration in `src/integrations/supabase/client.ts`
- Database migrations in `supabase/migrations/`
- RLS policies for multi-tenant data isolation

### Key Components Structure

**Pages**: Role-specific dashboards and flows
- `Admin.tsx` - Platform administration
- `MerchantDashboard.tsx` - Store owner interface
- `DriverDashboard.tsx` - Driver delivery interface

**Admin Components**: Located in `src/components/admin/`
- Store import/export functionality
- User and order management
- Merchant approval workflows

**UI Components**: shadcn/ui components in `src/components/ui/`

### Data Flow Patterns

**Location Services**: Hybrid location handling in `src/lib/`
- Google Maps integration
- Mock services for development
- Permission-based location access

**Payment Integration**: Stripe integration with:
- Client-side components in `src/components/payment/`
- Server-side processing via Supabase Edge Functions

**State Management**: 
- React Context for auth, cart, and location
- TanStack Query for server state
- Local storage for auth token caching

### Database Architecture

Multi-tenant design with role-based access:
- `profiles` table with role field for user types
- `stores` table linked to store owners
- `driver_applications` for driver onboarding
- RLS policies enforce data isolation between tenants

### Development Notes

- Uses Vite with SWC for fast builds and HMR
- Import paths use `@/` alias pointing to `src/`
- Tailwind CSS with shadcn/ui component system
- ESLint with TypeScript and React hooks rules