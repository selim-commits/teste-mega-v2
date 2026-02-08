import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthCallback } from './components/auth/AuthCallback';

// Lazy-loaded pages for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Finance = lazy(() => import('./pages/Finance').then(m => ({ default: m.Finance })));
const AIConsole = lazy(() => import('./pages/AIConsole').then(m => ({ default: m.AIConsole })));
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Bookings = lazy(() => import('./pages/Bookings').then(m => ({ default: m.Bookings })));
const WidgetBuilder = lazy(() => import('./pages/WidgetBuilder').then(m => ({ default: m.WidgetBuilder })));
const Packs = lazy(() => import('./pages/Packs').then(m => ({ default: m.Packs })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Availability = lazy(() => import('./pages/Availability').then(m => ({ default: m.Availability })));
const AppointmentTypes = lazy(() => import('./pages/AppointmentTypes').then(m => ({ default: m.AppointmentTypes })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const CalendarSync = lazy(() => import('./pages/CalendarSync').then(m => ({ default: m.CalendarSync })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const EmailNotifications = lazy(() => import('./pages/EmailNotifications').then(m => ({ default: m.EmailNotifications })));
const SMSNotifications = lazy(() => import('./pages/SMSNotifications').then(m => ({ default: m.SMSNotifications })));
const AlertNotifications = lazy(() => import('./pages/AlertNotifications').then(m => ({ default: m.AlertNotifications })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const Automations = lazy(() => import('./pages/Automations').then(m => ({ default: m.Automations })));
const Revenue = lazy(() => import('./pages/Revenue').then(m => ({ default: m.Revenue })));
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const PhotoGallery = lazy(() => import('./pages/PhotoGallery').then(m => ({ default: m.PhotoGallery })));
const Reviews = lazy(() => import('./pages/Reviews').then(m => ({ default: m.Reviews })));
const AccessControl = lazy(() => import('./pages/AccessControl').then(m => ({ default: m.AccessControl })));
const ApiDocs = lazy(() => import('./pages/ApiDocs').then(m => ({ default: m.ApiDocs })));
const Webhooks = lazy(() => import('./pages/Webhooks').then(m => ({ default: m.Webhooks })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

// Minimal loading fallback for page transitions
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light, #e5e5e5)', borderTopColor: 'var(--accent-primary, #1A1A1A)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Homepage / Landing page (visible to unauthenticated users) */}
                  <Route path="/" element={<GuestGuard redirectTo="/dashboard"><Login /></GuestGuard>} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/reset-password" element={<AuthCallback />} />

                  <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                    {/* Aperçu */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/spaces" element={<Calendar />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/client-portal" element={<ClientPortal />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/photo-gallery" element={<PhotoGallery />} />

                    {/* Paramètres de l'entreprise */}
                    <Route path="/availability" element={<Availability />} />
                    <Route path="/appointment-types" element={<AppointmentTypes />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/packs" element={<Packs />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/calendar-sync" element={<CalendarSync />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/revenue" element={<Revenue />} />
                    <Route path="/access-control" element={<AccessControl />} />

                    {/* Notifications */}
                    <Route path="/notifications/email" element={<EmailNotifications />} />
                    <Route path="/notifications/sms" element={<SMSNotifications />} />
                    <Route path="/notifications/alerts" element={<AlertNotifications />} />

                    {/* Outils avancés */}
                    <Route path="/widgets" element={<WidgetBuilder />} />
                    <Route path="/automations" element={<Automations />} />
                    <Route path="/ai" element={<AIConsole />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/api-docs" element={<ApiDocs />} />
                    <Route path="/webhooks" element={<Webhooks />} />

                    {/* Autres */}
                    <Route path="/team" element={<Team />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* Catch-all: redirect unknown routes to login */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
