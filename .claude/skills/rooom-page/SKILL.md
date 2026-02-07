---
name: rooom-page
description: Scaffolder une nouvelle page complete Rooom OS (page + store + hook + service + route)
---

# Skill: Creer une Page Rooom OS

## Quand utiliser
Quand on te demande de creer une nouvelle page/route dans l'application Rooom OS.

## Etapes

### 1. Planifier la feature
Identifier:
- Nom de la feature (ex: `Activities`)
- Table Supabase correspondante
- Champs principaux
- Relations avec d'autres tables

### 2. Creer le service

Fichier: `src/services/{featureName}.ts`
```typescript
import { supabase } from '@/lib/supabase';

// Types depuis database.ts ou definis ici
export interface {Feature} {
  id: string;
  studio_id: string;
  // ... champs
  created_at: string;
  updated_at: string;
}

export interface {Feature}Filters {
  search?: string;
  status?: string;
}

export const {feature}Service = {
  async getAll(studioId: string, filters?: {Feature}Filters): Promise<{Feature}[]> {
    let query = supabase.from('{features}').select('*').eq('studio_id', studioId);
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<{Feature} | null> {
    const { data, error } = await supabase.from('{features}').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(item: Omit<{Feature}, 'id' | 'created_at' | 'updated_at'>): Promise<{Feature}> {
    const { data, error } = await supabase.from('{features}').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<{Feature}>): Promise<{Feature}> {
    const { data, error } = await supabase.from('{features}').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('{features}').delete().eq('id', id);
    if (error) throw error;
  },
};
```

### 3. Creer le hook

Fichier: `src/hooks/use{Feature}s.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { {feature}Service } from '@/services/{featureName}';
import { useAuthStore } from '@/stores';
import { isDemoMode } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';

export function use{Feature}s(filters?: {Feature}Filters) {
  const studioId = useAuthStore(s => s.currentStudioId);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.{features}.list(filters || {}),
    queryFn: async () => {
      if (isDemoMode) {
        // TODO: Ajouter mock data dans mockData.ts
        return [];
      }
      return {feature}Service.getAll(studioId!, filters);
    },
    enabled: !!studioId,
  });

  const createMutation = useMutation({
    mutationFn: {feature}Service.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.{features}.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{Feature}> }) =>
      {feature}Service.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.{features}.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: {feature}Service.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.{features}.all }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### 4. Creer le store (optionnel)

Fichier: `src/stores/{feature}Store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface {Feature}State {
  filter: string;
  selectedId: string | null;
  page: number;
  pageSize: number;
  setFilter: (filter: string) => void;
  setSelectedId: (id: string | null) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const use{Feature}Store = create<{Feature}State>()(
  persist(
    (set) => ({
      filter: '',
      selectedId: null,
      page: 1,
      pageSize: 20,
      setFilter: (filter) => set({ filter, page: 1 }),
      setSelectedId: (id) => set({ selectedId: id }),
      setPage: (page) => set({ page }),
      reset: () => set({ filter: '', selectedId: null, page: 1 }),
    }),
    {
      name: '{feature}-store',
      partialize: (state) => ({ filter: state.filter }),
    }
  )
);
```

### 5. Creer la page

Fichier: `src/pages/{Feature}s.tsx`
```typescript
import { useState, useMemo } from 'react';
import { use{Feature}s } from '@/hooks/use{Feature}s';
import { use{Feature}Store } from '@/stores/{feature}Store';
import { Button, Modal, Table, Input } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { Plus, Search } from 'lucide-react';
import styles from './{Feature}s.module.css';

export default function {Feature}sPage() {
  const { data, isLoading, create, update, delete: remove } = use{Feature}s();
  const { filter, setFilter, page, setPage } = use{Feature}Store();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<{Feature} | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return data;
    return data.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  const handleCreate = async (formData: any) => {
    await create(formData);
    setIsCreateOpen(false);
  };

  return (
    <div className={styles.page}>
      <Header
        title="{Features}"
        subtitle="Gestion des {features}"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Nouveau
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <Input
          placeholder="Rechercher..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      <Table
        data={filtered}
        columns={[
          { key: 'name', header: 'Nom' },
          // ... colonnes
        ]}
        isLoading={isLoading}
        onRowClick={setEditItem}
        emptyMessage="Aucun element"
      />

      {/* Modal creation */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        {/* Formulaire */}
      </Modal>
    </div>
  );
}
```

Fichier: `src/pages/{Feature}s.module.css`
```css
.page {
  padding: var(--content-padding);
  max-width: 1200px;
}

.toolbar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
```

### 6. Ajouter la route

Dans `src/App.tsx`, ajouter:
```typescript
import {Feature}sPage from './pages/{Feature}s';
// ...
<Route path="/{features}" element={<{Feature}sPage />} />
```

### 7. Ajouter dans la sidebar (optionnel)

Dans `src/components/layout/Sidebar.tsx`, ajouter le lien de navigation.

### 8. Ajouter les query keys

Dans `src/lib/queryClient.ts`:
```typescript
{features}: {
  all: ['{features}'] as const,
  list: (filters: any) => ['{features}', 'list', filters] as const,
  detail: (id: string) => ['{features}', 'detail', id] as const,
},
```

### 9. Verifier
```bash
npm run build
```

## Checklist
- [ ] Service CRUD cree
- [ ] Hook React Query cree
- [ ] Store Zustand cree (si necessaire)
- [ ] Page avec Header, Table, Modal
- [ ] CSS Module avec variables design system
- [ ] Route ajoutee dans App.tsx
- [ ] Query keys ajoutees
- [ ] Support demo mode
- [ ] Build passe
