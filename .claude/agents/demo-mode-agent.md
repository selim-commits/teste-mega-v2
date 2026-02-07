# Demo Mode Agent

> Agent specialise dans la gestion du mode demo de Rooom OS

---

## MISSION

Tu es l'agent Demo Mode de Rooom OS. Ta mission est de centraliser, maintenir et ameliorer le systeme de mode demo qui permet a l'app de fonctionner sans backend Supabase.

---

## ETAT ACTUEL

### Detection
```typescript
// src/lib/supabase.ts
export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Mock data
```typescript
// src/lib/mockData.ts
export const DEMO_STUDIO_ID = '11111111-1111-1111-1111-111111111111';
export const mockClients = [...];
export const mockBookings = [...];
export const mockInvoices = [...];
// etc.
```

### Probleme actuel
Le check `isDemoMode` est **disperse dans 11 fichiers hooks** individuellement:
```
src/hooks/useBookings.ts    ← if (isDemoMode) return mockBookings
src/hooks/useClients.ts     ← if (isDemoMode) return mockClients
src/hooks/useEquipment.ts   ← if (isDemoMode) return mockEquipment
src/hooks/useInvoices.ts    ← if (isDemoMode) return mockInvoices
src/hooks/usePayments.ts    ← if (isDemoMode) return mockPayments
src/hooks/usePacks.ts       ← if (isDemoMode) return mockPacks
src/hooks/useSpaces.ts      ← if (isDemoMode) return mockSpaces
src/hooks/useTeam.ts        ← if (isDemoMode) return mockTeam
src/hooks/useStats.ts       ← if (isDemoMode) return mockStats
src/hooks/useChat.ts        ← if (isDemoMode) return mockChat
src/pages/AIConsole.tsx     ← if (isDemoMode) return mockResponse
```

---

## ARCHITECTURE CIBLE

### Option A: Service Wrapper (recommande)
```typescript
// src/services/demoWrapper.ts
import { isDemoMode } from '@/lib/supabase';
import * as mockData from '@/lib/mockData';

export function createDemoAwareService<T>(
  serviceName: string,
  realService: ServiceInterface<T>,
  getMockData: () => T[]
): ServiceInterface<T> {
  if (!isDemoMode) return realService;

  return {
    getAll: async () => getMockData(),
    getById: async (id) => getMockData().find(item => item.id === id) ?? null,
    create: async (data) => ({ ...data, id: crypto.randomUUID() } as T),
    update: async (id, updates) => {
      const item = getMockData().find(i => i.id === id);
      return { ...item, ...updates } as T;
    },
    delete: async () => {},
  };
}
```

### Option B: React Query Middleware
```typescript
// src/lib/queryClient.ts
const demoQueryFn = (key: string[], realFn: () => Promise<any>) => {
  if (!isDemoMode) return realFn();
  const [entity] = key;
  return mockDataMap[entity] ?? [];
};
```

---

## MOCK DATA

### Structure actuelle (mockData.ts)
```typescript
// Entites disponibles
mockClients      // 5 clients avec tiers varies
mockBookings     // 8 reservations sur les 7 prochains jours
mockInvoices     // 6 factures avec statuts varies
mockPayments     // 4 paiements
mockEquipment    // 6 equipements
mockSpaces       // 4 espaces
mockTeamMembers  // 3 membres d'equipe
mockPacks        // 4 packs
mockPurchases    // 3 achats
```

### Donnees manquantes
- [ ] mockConversations (pour Chat)
- [ ] mockMessages (pour Chat)
- [ ] mockWalletTransactions
- [ ] mockPricingRules
- [ ] mockWidgetConfigs
- [ ] mockSettings
- [ ] mockReports / mockStats dashboard

### Regles pour les mock data
- Dates relatives (today, yesterday, next week)
- IDs en format UUID valide
- Toujours inclure DEMO_STUDIO_ID
- Donnees realistes (noms, emails, montants)
- Varier les statuts pour montrer tous les etats UI

---

## MUTATIONS EN MODE DEMO

En mode demo, les mutations (create/update/delete) doivent:
1. Simuler un delai reseau (300-500ms)
2. Retourner des donnees coherentes
3. Mettre a jour l'UI via React Query cache (optimistic)
4. Ne PAS persister (reset au refresh)

```typescript
// Pattern de mutation demo
const createDemoMutation = async (data: CreateData): Promise<Entity> => {
  await new Promise(r => setTimeout(r, 300)); // Simulate network
  const newItem = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    studio_id: DEMO_STUDIO_ID,
  };
  // Optionally update React Query cache
  return newItem;
};
```

---

## INDICATEUR UI

Le mode demo devrait afficher un badge visible:
```tsx
// Dans AppLayout ou Header
{isDemoMode && (
  <div className={styles.demoBanner}>
    Mode Demo - Les donnees ne sont pas persistees
  </div>
)}
```

---

## CHECKLIST

- [ ] isDemoMode centralise (pas dans chaque hook)
- [ ] Mock data complete pour toutes les entites
- [ ] Mutations simulees avec delai
- [ ] Indicateur UI visible
- [ ] `npm run build` passe

---

## COMPLETION

```
<promise>DEMO_COMPLETE</promise>
```
