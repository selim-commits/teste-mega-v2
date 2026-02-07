---
name: form-builder
description: Generer un formulaire modal complet pour Rooom OS a partir d'un type TypeScript
---

# Skill: Form Builder Rooom OS

## Quand utiliser
Quand on te demande de creer un formulaire (creation/edition) pour une entite Rooom OS.

## Etapes

### 1. Identifier les champs

A partir du type TypeScript de l'entite, determiner:
- Quels champs sont editables par l'utilisateur
- Quels champs sont generes automatiquement (id, created_at, etc.)
- Les types de chaque champ (texte, nombre, select, date, boolean, etc.)
- Les champs obligatoires vs optionnels

### 2. Creer le composant formulaire

Fichier: `src/components/{feature}/{Feature}FormModal.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button, Input, Select, Checkbox, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import styles from './{Feature}FormModal.module.css';

interface {Feature}FormData {
  name: string;
  email: string;
  status: string;
  // ... champs editables
}

const defaultFormData: {Feature}FormData = {
  name: '',
  email: '',
  status: 'active',
};

interface {Feature}FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {Feature}FormData) => Promise<void>;
  initialData?: Partial<{Feature}FormData>;  // Pour l'edition
  title?: string;
}

export function {Feature}FormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: {Feature}FormModalProps) {
  const [formData, setFormData] = useState<{Feature}FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof {Feature}FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;

  // Reset form quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? { ...defaultFormData, ...initialData } : defaultFormData);
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handler generique pour les inputs
  const handleChange = (field: keyof {Feature}FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear l'erreur du champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof {Feature}FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // ... autres validations

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      // Toast d'erreur gere par le parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title={title || (isEditing ? 'Modifier' : 'Nouveau')}
        onClose={onClose}
      />
      <ModalBody>
        <div className={styles.form}>
          {/* Champ texte */}
          <Input
            label="Nom"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            required
          />

          {/* Champ email */}
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
          />

          {/* Select */}
          <Select
            label="Statut"
            value={formData.status}
            onChange={handleChange('status')}
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
            ]}
          />

          {/* Checkbox */}
          <Checkbox
            label="Option"
            checked={formData.someBoolean}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              someBoolean: e.target.checked,
            }))}
          />

          {/* Grille 2 colonnes */}
          <div className={styles.row}>
            <Input label="Champ A" value={formData.fieldA} onChange={handleChange('fieldA')} />
            <Input label="Champ B" value={formData.fieldB} onChange={handleChange('fieldB')} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} loading={isSubmitting}>
          {isEditing ? 'Modifier' : 'Creer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### 3. Creer le CSS Module

Fichier: `src/components/{feature}/{Feature}FormModal.module.css`

```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
  }
}
```

### 4. Integrer dans la page

```typescript
// Dans la page parente
const [isCreateOpen, setIsCreateOpen] = useState(false);
const [editItem, setEditItem] = useState<{Feature} | null>(null);

const handleCreate = async (data: {Feature}FormData) => {
  try {
    await create({ ...data, studio_id: studioId });
    toast.success('Cree avec succes');
  } catch (err) {
    toast.error('Erreur lors de la creation');
    throw err; // Pour que le modal reste ouvert
  }
};

const handleUpdate = async (data: {Feature}FormData) => {
  if (!editItem) return;
  try {
    await update({ id: editItem.id, data });
    toast.success('Modifie avec succes');
    setEditItem(null);
  } catch (err) {
    toast.error('Erreur lors de la modification');
    throw err;
  }
};

// Render
<{Feature}FormModal
  isOpen={isCreateOpen}
  onClose={() => setIsCreateOpen(false)}
  onSubmit={handleCreate}
  title="Nouveau {feature}"
/>

<{Feature}FormModal
  isOpen={!!editItem}
  onClose={() => setEditItem(null)}
  onSubmit={handleUpdate}
  initialData={editItem ?? undefined}
  title="Modifier {feature}"
/>
```

### 5. Verifier
```bash
npm run build
```

## Types de champs

| Type TypeScript | Composant UI | Notes |
|----------------|-------------|-------|
| `string` | `<Input />` | Texte standard |
| `string` (email) | `<Input type="email" />` | Validation email |
| `string` (tel) | `<Input type="tel" />` | Format telephone |
| `string` (long) | `<textarea />` | Multi-ligne |
| `number` | `<Input type="number" />` | Avec min/max |
| `boolean` | `<Checkbox />` ou `<Switch />` | Toggle |
| `enum/union` | `<Select />` | Dropdown avec options |
| `Date` | `<Input type="date" />` | Date picker |
| `string[]` | Chips/Tags input | Multi-valeurs |
| `File` | `<Input type="file" />` | Upload |

## Validation

### Regles courantes
```typescript
// Obligatoire
if (!value.trim()) errors.field = 'Ce champ est obligatoire';

// Email
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Email invalide';

// Telephone
if (!/^[\d\s+()-]{8,}$/.test(value)) errors.phone = 'Telephone invalide';

// Longueur
if (value.length < 2) errors.name = 'Minimum 2 caracteres';
if (value.length > 100) errors.name = 'Maximum 100 caracteres';

// Nombre
if (isNaN(Number(value)) || Number(value) < 0) errors.amount = 'Montant invalide';

// Date future
if (new Date(value) < new Date()) errors.date = 'La date doit etre dans le futur';
```

## Checklist
- [ ] FormData interface definie avec tous les champs editables
- [ ] defaultFormData avec des valeurs par defaut sensees
- [ ] Validation client-side sur les champs obligatoires
- [ ] Gestion des erreurs par champ
- [ ] Reset du formulaire a l'ouverture
- [ ] Loading state pendant la soumission
- [ ] CSS Module avec variables design system
- [ ] Support creation ET edition (initialData)
- [ ] Build passe
