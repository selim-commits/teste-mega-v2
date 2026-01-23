import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { SpaceControl } from './pages/SpaceControl';
import { Calendar } from './pages/Calendar';
import { Inventory } from './pages/Inventory';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { AIConsole } from './pages/AIConsole';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { Bookings } from './pages/Bookings';
import { WidgetBuilder } from './pages/WidgetBuilder';
import { Packs } from './pages/Packs';
import { Chat } from './pages/Chat';
import { Reports } from './pages/Reports';
import { Availability } from './pages/Availability';
import { AppointmentTypes } from './pages/AppointmentTypes';
import { Integrations } from './pages/Integrations';
import { CalendarSync } from './pages/CalendarSync';
import { Payments } from './pages/Payments';
import { EmailNotifications } from './pages/EmailNotifications';
import { SMSNotifications } from './pages/SMSNotifications';
import { AlertNotifications } from './pages/AlertNotifications';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Aperçu */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/spaces" element={<Calendar />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/reports" element={<Reports />} />

                {/* Paramètres de l'entreprise */}
                <Route path="/availability" element={<Availability />} />
                <Route path="/appointment-types" element={<AppointmentTypes />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/packs" element={<Packs />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/calendar-sync" element={<CalendarSync />} />
                <Route path="/payments" element={<Payments />} />

                {/* Notifications */}
                <Route path="/notifications/email" element={<EmailNotifications />} />
                <Route path="/notifications/sms" element={<SMSNotifications />} />
                <Route path="/notifications/alerts" element={<AlertNotifications />} />

                {/* Outils avancés */}
                <Route path="/widgets" element={<WidgetBuilder />} />
                <Route path="/ai" element={<AIConsole />} />
                <Route path="/chat" element={<Chat />} />

                {/* Autres */}
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
