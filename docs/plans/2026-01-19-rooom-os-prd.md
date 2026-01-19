# Rooom OS - Product Requirements Document (PRD)

**Version**: 2.0
**Date**: 2026-01-19
**Status**: Ready for Ralph Implementation
**Iterations**: 10

---

## 1. Product Overview

### Vision
Rooom OS is the all-in-one operating system for creative studios. It combines booking management, inventory tracking, CRM, finance, and AI-powered automation into a single, beautifully designed platform.

### Target Users
- Photo studios
- Video production studios
- Event spaces
- Creative agencies
- Rental studios

### Key Differentiators
1. **AI-Native**: 4 specialized agents (YODA, NEXUS, NOVA, SENTINEL)
2. **Real-time**: Supabase Realtime for live updates
3. **Beautiful UX**: Apple-inspired design with stills.com aesthetics
4. **Full-stack**: Complete solution from booking to accounting

---

## 2. Technical Requirements

### Stack
```
Frontend:
  - React 19
  - TypeScript 5.9+
  - Vite 7
  - Framer Motion
  - CSS Modules
  - Lucide Icons

Backend:
  - Supabase (PostgreSQL)
  - Supabase Auth
  - Supabase Storage
  - Supabase Realtime
  - Supabase Edge Functions

Integrations:
  - Stripe (payments)
  - Claude API (AI agents)
  - Google Calendar API
  - SendGrid (emails)
```

### Architecture
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── services/         # API and Supabase services
├── stores/           # State management (Zustand)
├── types/            # TypeScript types
└── styles/           # Global styles
```

---

## 3. Ralph Implementation Plan

### Iteration Strategy
Each iteration builds on the previous, with verification at each step.

---

### ITERATION 1: Supabase Foundation
**Goal**: Set up Supabase and core authentication

#### Tasks
- [ ] Create Supabase project configuration
- [ ] Set up environment variables (.env.local)
- [ ] Install Supabase client library
- [ ] Create auth context and hooks
- [ ] Implement login/signup pages
- [ ] Create auth middleware for protected routes
- [ ] Test: User can sign up, login, logout

#### Files to Create
```
src/lib/supabase.ts
src/hooks/useAuth.ts
src/contexts/AuthContext.tsx
src/pages/Login.tsx
src/pages/Signup.tsx
src/components/auth/AuthGuard.tsx
```

#### Verification
```bash
npm run build
npm run dev
# Manual: Sign up → Login → Access dashboard → Logout
```

---

### ITERATION 2: Core Database Schema
**Goal**: Create all database tables with proper relationships

#### Tasks
- [ ] Create SQL migration files
- [ ] Set up studios table
- [ ] Set up clients table with contacts
- [ ] Set up bookings table with extras
- [ ] Set up equipment and inventory tables
- [ ] Set up invoices and payments tables
- [ ] Set up team members and roles tables
- [ ] Set up AI-related tables
- [ ] Set up settings tables
- [ ] Apply migrations to Supabase
- [ ] Create Row Level Security (RLS) policies

#### Files to Create
```
supabase/migrations/001_studios.sql
supabase/migrations/002_clients.sql
supabase/migrations/003_bookings.sql
supabase/migrations/004_inventory.sql
supabase/migrations/005_finance.sql
supabase/migrations/006_team.sql
supabase/migrations/007_ai.sql
supabase/migrations/008_settings.sql
supabase/migrations/009_rls_policies.sql
```

#### Verification
```bash
npx supabase db push
npx supabase db diff
# Check tables in Supabase dashboard
```

---

### ITERATION 3: Service Layer & Types
**Goal**: Create TypeScript types and Supabase service functions

#### Tasks
- [ ] Generate TypeScript types from Supabase schema
- [ ] Create base CRUD service pattern
- [ ] Create studios service
- [ ] Create clients service
- [ ] Create bookings service
- [ ] Create inventory service
- [ ] Create finance service
- [ ] Create team service
- [ ] Create notifications service
- [ ] Test: All services with mock data

#### Files to Create
```
src/types/database.ts
src/types/index.ts
src/services/base.service.ts
src/services/studios.service.ts
src/services/clients.service.ts
src/services/bookings.service.ts
src/services/inventory.service.ts
src/services/finance.service.ts
src/services/team.service.ts
src/services/notifications.service.ts
```

#### Verification
```bash
npm run build
# TypeScript should compile without errors
```

---

### ITERATION 4: State Management & Hooks
**Goal**: Set up Zustand stores and custom hooks

#### Tasks
- [ ] Install Zustand
- [ ] Create auth store
- [ ] Create studio store
- [ ] Create bookings store
- [ ] Create clients store
- [ ] Create inventory store
- [ ] Create notifications store
- [ ] Create UI store (sidebar, modals, etc.)
- [ ] Create custom hooks for each domain
- [ ] Implement real-time subscriptions

#### Files to Create
```
src/stores/auth.store.ts
src/stores/studio.store.ts
src/stores/bookings.store.ts
src/stores/clients.store.ts
src/stores/inventory.store.ts
src/stores/notifications.store.ts
src/stores/ui.store.ts
src/hooks/useStudio.ts
src/hooks/useBookings.ts
src/hooks/useClients.ts
src/hooks/useInventory.ts
src/hooks/useRealtime.ts
```

#### Verification
```bash
npm run build
npm run dev
# Check React DevTools for store state
```

---

### ITERATION 5: Enhanced UI Components
**Goal**: Build complete UI component library

#### Tasks
- [ ] Create Input component (text, email, password, search)
- [ ] Create Select component
- [ ] Create Checkbox and Radio components
- [ ] Create Modal component
- [ ] Create Dropdown component
- [ ] Create Tabs component
- [ ] Create Table component
- [ ] Create Calendar component
- [ ] Create DatePicker component
- [ ] Create TimePicker component
- [ ] Create Toast/Notification component
- [ ] Create Avatar component
- [ ] Create Progress component
- [ ] Create Skeleton loader component

#### Files to Create
```
src/components/ui/Input.tsx
src/components/ui/Select.tsx
src/components/ui/Checkbox.tsx
src/components/ui/Modal.tsx
src/components/ui/Dropdown.tsx
src/components/ui/Tabs.tsx
src/components/ui/Table.tsx
src/components/ui/Calendar.tsx
src/components/ui/DatePicker.tsx
src/components/ui/TimePicker.tsx
src/components/ui/Toast.tsx
src/components/ui/Avatar.tsx
src/components/ui/Progress.tsx
src/components/ui/Skeleton.tsx
```

#### Verification
```bash
npm run build
# Create a /components demo page to visually verify all components
```

---

### ITERATION 6: Dashboard & Space Control
**Goal**: Implement real Dashboard and Space Control with data

#### Tasks
- [ ] Refactor Dashboard to use real data
- [ ] Implement KPI calculations from Supabase
- [ ] Add drag & drop widget system
- [ ] Implement notification center
- [ ] Implement goals tracking
- [ ] Refactor Space Control with real bookings
- [ ] Implement calendar with day/week/month views
- [ ] Add booking creation modal
- [ ] Add booking edit/delete
- [ ] Implement drag & resize bookings
- [ ] Add conflict detection
- [ ] Add recurring bookings UI

#### Files to Update/Create
```
src/pages/Dashboard.tsx (update)
src/components/features/dashboard/KPICard.tsx
src/components/features/dashboard/WidgetGrid.tsx
src/components/features/dashboard/NotificationCenter.tsx
src/components/features/dashboard/GoalsWidget.tsx
src/pages/SpaceControl.tsx (update)
src/components/features/calendar/CalendarView.tsx
src/components/features/calendar/BookingModal.tsx
src/components/features/calendar/BookingCard.tsx
src/components/features/calendar/RecurrenceEditor.tsx
```

#### Verification
```bash
npm run build
npm run dev
# Create test booking → See on calendar → Edit → Delete
# Check real-time updates in another browser tab
```

---

### ITERATION 7: Inventory & Clients
**Goal**: Complete Inventory and CRM modules

#### Tasks
- [ ] Implement equipment CRUD
- [ ] Add QR code generation
- [ ] Implement kit management
- [ ] Add maintenance scheduling
- [ ] Implement stock alerts
- [ ] Add equipment loan tracking
- [ ] Implement client CRUD
- [ ] Add client scoring system
- [ ] Implement tags and segmentation
- [ ] Add communication history
- [ ] Implement document uploads
- [ ] Add client timeline view

#### Files to Update/Create
```
src/pages/Inventory.tsx (update)
src/components/features/inventory/EquipmentModal.tsx
src/components/features/inventory/QRCodeGenerator.tsx
src/components/features/inventory/KitBuilder.tsx
src/components/features/inventory/MaintenanceSchedule.tsx
src/components/features/inventory/LoanTracker.tsx
src/pages/Clients.tsx (update)
src/components/features/clients/ClientModal.tsx
src/components/features/clients/ClientProfile.tsx
src/components/features/clients/ClientScore.tsx
src/components/features/clients/TagManager.tsx
src/components/features/clients/ClientTimeline.tsx
src/components/features/clients/CommunicationCenter.tsx
```

#### Verification
```bash
npm run build
npm run dev
# Add equipment → Assign to booking → Return
# Add client → Add tags → Send communication → View timeline
```

---

### ITERATION 8: Finance Module
**Goal**: Complete invoicing and payment system

#### Tasks
- [ ] Implement product catalog
- [ ] Create quote builder
- [ ] Create invoice builder
- [ ] Implement quote to invoice conversion
- [ ] Add line item management
- [ ] Implement discount and tax calculations
- [ ] Set up Stripe integration
- [ ] Create payment recording
- [ ] Implement payment reminders
- [ ] Add credit notes
- [ ] Create expense tracking
- [ ] Implement financial reports
- [ ] Add export functionality (PDF, CSV)

#### Files to Update/Create
```
src/pages/Finance.tsx (update)
src/components/features/finance/ProductCatalog.tsx
src/components/features/finance/QuoteBuilder.tsx
src/components/features/finance/InvoiceBuilder.tsx
src/components/features/finance/LineItemEditor.tsx
src/components/features/finance/PaymentRecorder.tsx
src/components/features/finance/StripeCheckout.tsx
src/components/features/finance/ReminderManager.tsx
src/components/features/finance/ExpenseTracker.tsx
src/components/features/finance/FinancialCharts.tsx
src/components/features/finance/ReportExporter.tsx
src/lib/stripe.ts
```

#### Verification
```bash
npm run build
npm run dev
# Create quote → Convert to invoice → Record payment
# Test Stripe checkout (test mode)
# Generate financial report
```

---

### ITERATION 9: AI Console & Team
**Goal**: Implement AI agents and team management

#### Tasks
- [ ] Set up Claude API integration
- [ ] Implement agent conversation UI
- [ ] Create conversation history persistence
- [ ] Implement YODA insights generation
- [ ] Create NEXUS workflow builder
- [ ] Implement SENTINEL audit logging
- [ ] Add AI suggestions system
- [ ] Implement team member CRUD
- [ ] Add role & permission system
- [ ] Create team calendar
- [ ] Implement time tracking
- [ ] Add leave request system
- [ ] Create performance dashboard

#### Files to Update/Create
```
src/pages/AIConsole.tsx (update)
src/components/features/ai/AgentChat.tsx
src/components/features/ai/ConversationList.tsx
src/components/features/ai/WorkflowBuilder.tsx
src/components/features/ai/SuggestionFeed.tsx
src/components/features/ai/SentinelDashboard.tsx
src/services/ai.service.ts
src/lib/claude.ts
src/pages/Team.tsx (new)
src/components/features/team/TeamDirectory.tsx
src/components/features/team/MemberProfile.tsx
src/components/features/team/RoleEditor.tsx
src/components/features/team/TeamCalendar.tsx
src/components/features/team/TimeTracker.tsx
src/components/features/team/LeaveManager.tsx
```

#### Verification
```bash
npm run build
npm run dev
# Chat with YODA → Get insights
# Create workflow in NEXUS → Test trigger
# Add team member → Assign role → Track time
```

---

### ITERATION 10: Settings & Polish
**Goal**: Complete settings and final polish

#### Tasks
- [ ] Implement studio profile settings
- [ ] Add branding customization
- [ ] Create business hours configuration
- [ ] Implement document templates
- [ ] Add notification preferences
- [ ] Create integration connections UI
- [ ] Implement API key management
- [ ] Add backup functionality
- [ ] Implement GDPR compliance tools
- [ ] Create subscription management (Stripe)
- [ ] Performance optimization
- [ ] Add loading states everywhere
- [ ] Implement error boundaries
- [ ] Add empty states
- [ ] Final responsive design fixes
- [ ] Accessibility audit
- [ ] Run full test suite

#### Files to Update/Create
```
src/pages/Settings.tsx (new)
src/components/features/settings/StudioProfile.tsx
src/components/features/settings/BrandingEditor.tsx
src/components/features/settings/HoursScheduler.tsx
src/components/features/settings/TemplateEditor.tsx
src/components/features/settings/NotificationPrefs.tsx
src/components/features/settings/IntegrationManager.tsx
src/components/features/settings/APIKeyManager.tsx
src/components/features/settings/BackupManager.tsx
src/components/features/settings/GDPRCenter.tsx
src/components/features/settings/BillingPortal.tsx
src/components/common/ErrorBoundary.tsx
src/components/common/EmptyState.tsx
src/components/common/LoadingState.tsx
```

#### Verification
```bash
npm run build
npm run lint
npm run test
# Full manual test of all features
# Lighthouse audit for performance
# Accessibility check with axe
```

---

## 4. Success Criteria

### Per Iteration
- [ ] `npm run build` passes without errors
- [ ] No TypeScript errors
- [ ] New features functional and tested
- [ ] Git commit with descriptive message

### Final Product
- [ ] All 8 modules fully functional
- [ ] Real-time updates working
- [ ] Authentication secure
- [ ] Stripe payments working
- [ ] AI agents responding
- [ ] Mobile responsive
- [ ] Performance score > 90 (Lighthouse)
- [ ] No critical accessibility issues

---

## 5. Ralph Execution Commands

### Start Ralph Loop
```bash
# In project root
ralph start --iterations 10 --plan docs/plans/2026-01-19-rooom-os-prd.md
```

### Manual Iteration
```bash
# Run single iteration
ralph iterate --number 1

# Check status
ralph status

# Verify iteration
ralph verify --iteration 1
```

### Agent Assignments
```
Iteration 1-2: Setup & Database → Single agent (foundation)
Iteration 3-4: Services & State → Single agent (architecture)
Iteration 5: UI Components → Parallel agents (independent components)
Iteration 6-7: Features → Parallel agents (Dashboard+SpaceControl, Inventory+Clients)
Iteration 8: Finance → Single agent (complex integrations)
Iteration 9: AI & Team → Parallel agents (AI agent, Team agent)
Iteration 10: Polish → Multiple agents (Settings, Testing, Optimization)
```

---

## 6. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase rate limits | Use batch operations, implement caching |
| Stripe test mode issues | Document test card numbers, handle webhooks |
| AI API costs | Implement rate limiting, cache responses |
| Complex calendar logic | Use proven library (react-big-calendar or custom) |
| Real-time sync conflicts | Implement optimistic updates with rollback |

---

## 7. Post-Implementation

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Deployment guide

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Posthog)
- [ ] Performance monitoring

### Future Enhancements
- Mobile app (React Native)
- Multi-tenant support
- White-label solution
- Marketplace for plugins

---

*PRD Version 2.0 - Ready for Ralph Implementation*
*Generated: 2026-01-19*
