import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { SpaceControl } from './pages/SpaceControl';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/spaces" element={<SpaceControl />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/packs" element={<Packs />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/ai" element={<AIConsole />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/widgets" element={<WidgetBuilder />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
