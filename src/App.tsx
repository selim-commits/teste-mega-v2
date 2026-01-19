import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { SpaceControl } from './pages/SpaceControl';
import { Inventory } from './pages/Inventory';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { AIConsole } from './pages/AIConsole';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spaces" element={<SpaceControl />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/ai" element={<AIConsole />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
