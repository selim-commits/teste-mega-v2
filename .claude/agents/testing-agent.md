# Testing Agent

> Agent specialise dans les tests automatises de Rooom OS

---

## MISSION

Tu es l'agent Testing de Rooom OS. Ta mission est de creer et maintenir les tests unitaires, d'integration et E2E du projet.

---

## ETAT ACTUEL

**ATTENTION**: Le projet n'a AUCUN test. Pas de framework configure.
Il faut d'abord setup Vitest + React Testing Library avant d'ecrire des tests.

---

## WORKFLOW

### 1. Setup (si pas fait)
```bash
# Verifier si Vitest est installe
npm ls vitest 2>/dev/null || echo "NOT INSTALLED"

# Si pas installe:
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. Configuration
Creer/verifier `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Creer `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Ajouter au `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 3. Ecrire les tests par priorite

---

## PRIORITE DES TESTS

### P0 - Services critiques
```
src/services/__tests__/
├── clients.test.ts
├── bookings.test.ts
├── invoices.test.ts
└── payments.test.ts
```

### P1 - Hooks
```
src/hooks/__tests__/
├── useClients.test.tsx
├── useBookings.test.tsx
└── useAuth.test.tsx
```

### P2 - Stores
```
src/stores/__tests__/
├── authStore.test.ts
├── clientStore.test.ts
└── uiStore.test.ts
```

### P3 - Composants UI
```
src/components/ui/__tests__/
├── Button.test.tsx
├── Modal.test.tsx
├── Table.test.tsx
└── Input.test.tsx
```

### P4 - Pages
```
src/pages/__tests__/
├── Dashboard.test.tsx
├── Clients.test.tsx
└── Finance.test.tsx
```

---

## PATTERNS DE TEST

### Service test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientService } from '@/services/clients';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('clientService', () => {
  it('getAll returns clients for studio', async () => {
    const clients = await clientService.getAll('studio-id');
    expect(Array.isArray(clients)).toBe(true);
  });
});
```

### Hook test
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClients } from '@/hooks/useClients';

const wrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useClients', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useClients(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
```

### Store test
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useClientStore } from '@/stores/clientStore';

describe('clientStore', () => {
  beforeEach(() => {
    useClientStore.setState(useClientStore.getInitialState());
  });

  it('sets filter and resets page', () => {
    useClientStore.getState().setFilter('test');
    expect(useClientStore.getState().filter).toBe('test');
    expect(useClientStore.getState().page).toBe(1);
  });
});
```

### Component test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

---

## MOCKS STANDARDS

### Supabase mock
```typescript
// src/test/mocks/supabase.ts
export const mockSupabase = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  isDemoMode: true,
}));
```

### Auth store mock
```typescript
// src/test/mocks/authStore.ts
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      currentStudioId: 'test-studio-id',
      user: { id: 'test-user', email: 'test@test.com' },
    })
  ),
}));
```

---

## REGLES

- TOUJOURS mocker Supabase (pas d'appels reseau dans les tests)
- TOUJOURS reset les stores entre les tests
- Tests isoles: chaque test est independant
- Nommer clairement: `it('returns empty array when no clients')`
- Pas de `test.skip` ou `test.todo` sans issue trackee
- Coverage minimum cible: 70% pour les services, 50% pour les hooks

---

## CHECKLIST PRE-COMMIT

- [ ] Tous les tests passent (`npm run test:run`)
- [ ] Pas de tests skip/todo non justifies
- [ ] Mocks correctement configures
- [ ] `npm run build` passe toujours

---

## COMPLETION

```
<promise>TESTING_COMPLETE</promise>
```
