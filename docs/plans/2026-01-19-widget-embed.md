# Widget Embed Rooom OS - Plan d'Implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permettre aux studios d'intégrer un widget de réservation sur leur site web via un simple script.

**Architecture:** Loader script léger (~5KB) chargé via CDN qui injecte dynamiquement l'application React de booking. Communication parent-widget via PostMessage API. API endpoints dédiés pour la configuration et les réservations embed.

**Tech Stack:** React 19, TypeScript, Vite (multi-entry build), Zustand, Supabase Edge Functions, CSS Variables pour theming

---

## Phase 1: Infrastructure de Base

### Task 1: Configuration Vite Multi-Entry

**Files:**
- Modify: `vite.config.ts`
- Create: `src/embed/main.tsx`
- Create: `src/embed/index.html`

**Step 1: Créer le point d'entrée embed**

```typescript
// src/embed/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { EmbedApp } from './EmbedApp'
import './embed.css'

// Get config from script data attributes or URL params
const scriptTag = document.currentScript as HTMLScriptElement | null
const container = document.getElementById('rooom-embed-root')

if (container) {
  const config = {
    studioId: container.dataset.studioId || '',
    theme: (container.dataset.theme as 'light' | 'dark') || 'light',
    accentColor: container.dataset.accentColor || '#1E3A5F',
    services: container.dataset.services?.split(',') || [],
    locale: container.dataset.locale || 'fr',
  }

  createRoot(container).render(
    <StrictMode>
      <EmbedApp config={config} />
    </StrictMode>
  )
}
```

**Step 2: Créer le HTML template embed**

```html
<!-- src/embed/index.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rooom OS - Booking Widget</title>
</head>
<body>
  <div id="rooom-embed-root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**Step 3: Modifier vite.config.ts pour multi-entry**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        embed: resolve(__dirname, 'src/embed/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'embed'
            ? 'embed/[name].[hash].js'
            : 'assets/[name].[hash].js'
        },
      },
    },
  },
})
```

**Step 4: Vérifier que le build fonctionne**

Run: `npm run build`
Expected: Build successful avec `dist/embed/` créé

**Step 5: Commit**

```bash
git add vite.config.ts src/embed/
git commit -m "feat(embed): add multi-entry vite config for widget build"
```

---

### Task 2: Loader Script

**Files:**
- Create: `src/embed/loader.ts`
- Create: `public/embed.js` (version minifiée pour tests)

**Step 1: Créer le loader script**

```typescript
// src/embed/loader.ts
(function() {
  'use strict';

  interface RooomConfig {
    studioId: string;
    theme?: 'light' | 'dark';
    accentColor?: string;
    services?: string[];
    locale?: string;
    container?: string | HTMLElement;
    mode?: 'inline' | 'popup' | 'iframe';
    onReady?: () => void;
    onBookingComplete?: (booking: unknown) => void;
    onError?: (error: Error) => void;
  }

  interface RooomWidget {
    init: (config: RooomConfig) => void;
    open: () => void;
    close: () => void;
    destroy: () => void;
  }

  const WIDGET_URL = import.meta.env.PROD
    ? 'https://embed.rooom-os.com'
    : 'http://localhost:5173/src/embed/index.html';

  const createWidget = (config: RooomConfig): RooomWidget => {
    let iframe: HTMLIFrameElement | null = null;
    let container: HTMLElement | null = null;

    const init = () => {
      // Get or create container
      if (typeof config.container === 'string') {
        container = document.querySelector(config.container);
      } else if (config.container instanceof HTMLElement) {
        container = config.container;
      } else {
        container = document.createElement('div');
        container.id = 'rooom-embed-container';
        document.body.appendChild(container);
      }

      if (!container) {
        config.onError?.(new Error('Container not found'));
        return;
      }

      // Create iframe
      iframe = document.createElement('iframe');
      iframe.src = buildWidgetUrl(config);
      iframe.style.cssText = `
        width: 100%;
        height: 600px;
        border: none;
        border-radius: 12px;
      `;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('title', 'Rooom OS Booking Widget');

      // Handle messages from widget
      window.addEventListener('message', handleMessage);

      container.appendChild(iframe);
    };

    const buildWidgetUrl = (cfg: RooomConfig): string => {
      const params = new URLSearchParams({
        studioId: cfg.studioId,
        theme: cfg.theme || 'light',
        accentColor: cfg.accentColor || '#1E3A5F',
        locale: cfg.locale || 'fr',
      });
      if (cfg.services?.length) {
        params.set('services', cfg.services.join(','));
      }
      return `${WIDGET_URL}?${params.toString()}`;
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(WIDGET_URL).origin) return;

      const { type, payload } = event.data;
      switch (type) {
        case 'ROOOM_READY':
          config.onReady?.();
          break;
        case 'ROOOM_BOOKING_COMPLETE':
          config.onBookingComplete?.(payload);
          break;
        case 'ROOOM_RESIZE':
          if (iframe) {
            iframe.style.height = `${payload.height}px`;
          }
          break;
        case 'ROOOM_ERROR':
          config.onError?.(new Error(payload.message));
          break;
      }
    };

    const open = () => {
      if (config.mode === 'popup' && container) {
        container.style.display = 'block';
      }
    };

    const close = () => {
      if (config.mode === 'popup' && container) {
        container.style.display = 'none';
      }
    };

    const destroy = () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
    };

    init();

    return { init, open, close, destroy };
  };

  // Expose to window
  (window as any).Rooom = {
    createWidget,
  };

  // Auto-init if data attributes present
  document.addEventListener('DOMContentLoaded', () => {
    const autoInitElements = document.querySelectorAll('[data-rooom-studio-id]');
    autoInitElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      createWidget({
        studioId: htmlEl.dataset.rooomStudioId || '',
        theme: (htmlEl.dataset.rooomTheme as 'light' | 'dark') || 'light',
        accentColor: htmlEl.dataset.rooomAccentColor,
        services: htmlEl.dataset.rooomServices?.split(','),
        locale: htmlEl.dataset.rooomLocale,
        container: htmlEl,
      });
    });
  });
})();
```

**Step 2: Vérifier la syntaxe TypeScript**

Run: `npx tsc src/embed/loader.ts --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/loader.ts
git commit -m "feat(embed): add loader script with auto-init and PostMessage support"
```

---

### Task 3: Types et Interfaces Embed

**Files:**
- Create: `src/embed/types.ts`

**Step 1: Créer les types embed**

```typescript
// src/embed/types.ts

// Config passed to widget
export interface EmbedConfig {
  studioId: string;
  theme: 'light' | 'dark';
  accentColor: string;
  services: string[];
  locale: string;
}

// Studio info from API
export interface EmbedStudio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  currency: string;
  settings: {
    booking_lead_time_hours: number;
    booking_max_advance_days: number;
    cancellation_policy_hours: number;
    require_deposit: boolean;
    deposit_percentage: number;
  };
}

// Service/Space available for booking
export interface EmbedService {
  id: string;
  name: string;
  description: string | null;
  hourly_rate: number;
  half_day_rate: number | null;
  full_day_rate: number | null;
  min_booking_hours: number;
  max_booking_hours: number;
  image_url: string | null;
  amenities: string[];
}

// Time slot
export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  available: boolean;
  price: number;
}

// Availability response
export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}

// Booking form data
export interface BookingFormData {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  acceptTerms: boolean;
}

// Booking result
export interface BookingResult {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed';
  service: EmbedService;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  depositAmount: number | null;
  paymentUrl: string | null;
}

// Booking flow step
export type BookingStep =
  | 'services'
  | 'datetime'
  | 'form'
  | 'payment'
  | 'confirmation';

// PostMessage types
export type PostMessageType =
  | 'ROOOM_READY'
  | 'ROOOM_RESIZE'
  | 'ROOOM_BOOKING_COMPLETE'
  | 'ROOOM_ERROR'
  | 'ROOOM_STEP_CHANGE';

export interface PostMessage {
  type: PostMessageType;
  payload?: unknown;
}
```

**Step 2: Vérifier les types**

Run: `npx tsc src/embed/types.ts --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/types.ts
git commit -m "feat(embed): add TypeScript types for embed widget"
```

---

## Phase 2: Store et API

### Task 4: Zustand Store pour Embed

**Files:**
- Create: `src/embed/store/embedStore.ts`

**Step 1: Créer le store Zustand**

```typescript
// src/embed/store/embedStore.ts
import { create } from 'zustand';
import type {
  EmbedConfig,
  EmbedStudio,
  EmbedService,
  BookingStep,
  BookingFormData,
  BookingResult,
  TimeSlot,
} from '../types';

interface EmbedState {
  // Config
  config: EmbedConfig | null;

  // Data
  studio: EmbedStudio | null;
  services: EmbedService[];
  availability: Map<string, TimeSlot[]>;

  // Booking flow
  currentStep: BookingStep;
  selectedService: EmbedService | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  formData: Partial<BookingFormData>;
  bookingResult: BookingResult | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setConfig: (config: EmbedConfig) => void;
  setStudio: (studio: EmbedStudio) => void;
  setServices: (services: EmbedService[]) => void;
  setAvailability: (date: string, slots: TimeSlot[]) => void;

  selectService: (service: EmbedService) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: TimeSlot) => void;
  updateFormData: (data: Partial<BookingFormData>) => void;
  setBookingResult: (result: BookingResult) => void;

  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  reset: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const STEP_ORDER: BookingStep[] = [
  'services',
  'datetime',
  'form',
  'payment',
  'confirmation',
];

export const useEmbedStore = create<EmbedState>((set, get) => ({
  // Initial state
  config: null,
  studio: null,
  services: [],
  availability: new Map(),
  currentStep: 'services',
  selectedService: null,
  selectedDate: null,
  selectedSlot: null,
  formData: {},
  bookingResult: null,
  isLoading: false,
  error: null,

  // Actions
  setConfig: (config) => set({ config }),
  setStudio: (studio) => set({ studio }),
  setServices: (services) => set({ services }),
  setAvailability: (date, slots) =>
    set((state) => {
      const newAvailability = new Map(state.availability);
      newAvailability.set(date, slots);
      return { availability: newAvailability };
    }),

  selectService: (service) =>
    set({
      selectedService: service,
      currentStep: 'datetime',
      selectedDate: null,
      selectedSlot: null,
    }),

  selectDate: (date) =>
    set({
      selectedDate: date,
      selectedSlot: null,
    }),

  selectSlot: (slot) =>
    set({
      selectedSlot: slot,
      currentStep: 'form',
    }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  setBookingResult: (result) =>
    set({
      bookingResult: result,
      currentStep: result.paymentUrl ? 'payment' : 'confirmation',
    }),

  goToStep: (step) => set({ currentStep: step }),

  goBack: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },

  reset: () =>
    set({
      currentStep: 'services',
      selectedService: null,
      selectedDate: null,
      selectedSlot: null,
      formData: {},
      bookingResult: null,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

**Step 2: Vérifier le store**

Run: `npx tsc src/embed/store/embedStore.ts --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/store/
git commit -m "feat(embed): add Zustand store for booking flow state"
```

---

### Task 5: Service API Embed

**Files:**
- Create: `src/embed/services/embedApi.ts`

**Step 1: Créer le service API**

```typescript
// src/embed/services/embedApi.ts
import type {
  EmbedStudio,
  EmbedService,
  AvailabilityResponse,
  BookingFormData,
  BookingResult,
} from '../types';

const API_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const embedApi = {
  // Get studio config and branding
  getStudioConfig: (studioId: string) =>
    fetchApi<EmbedStudio>(`/embed/config?studioId=${studioId}`),

  // Get available services/spaces
  getServices: (studioId: string, serviceIds?: string[]) => {
    const params = new URLSearchParams({ studioId });
    if (serviceIds?.length) {
      params.set('services', serviceIds.join(','));
    }
    return fetchApi<EmbedService[]>(`/embed/services?${params}`);
  },

  // Get availability for a service on a date range
  getAvailability: (
    studioId: string,
    serviceId: string,
    startDate: string,
    endDate: string
  ) => {
    const params = new URLSearchParams({
      studioId,
      serviceId,
      startDate,
      endDate,
    });
    return fetchApi<AvailabilityResponse[]>(`/embed/availability?${params}`);
  },

  // Create a booking
  createBooking: (studioId: string, data: BookingFormData) =>
    fetchApi<BookingResult>(`/embed/booking`, {
      method: 'POST',
      body: JSON.stringify({ studioId, ...data }),
    }),

  // Verify payment (after Stripe redirect)
  verifyPayment: (bookingId: string, sessionId: string) =>
    fetchApi<BookingResult>(`/embed/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ bookingId, sessionId }),
    }),
};
```

**Step 2: Vérifier le service**

Run: `npx tsc src/embed/services/embedApi.ts --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/services/
git commit -m "feat(embed): add API service for embed endpoints"
```

---

## Phase 3: Composants UI Widget

### Task 6: Composant Principal EmbedApp

**Files:**
- Create: `src/embed/EmbedApp.tsx`
- Create: `src/embed/embed.css`

**Step 1: Créer le composant EmbedApp**

```tsx
// src/embed/EmbedApp.tsx
import { useEffect } from 'react';
import { useEmbedStore } from './store/embedStore';
import { embedApi } from './services/embedApi';
import { ServiceSelection } from './components/ServiceSelection';
import { DateTimeSelection } from './components/DateTimeSelection';
import { BookingForm } from './components/BookingForm';
import { PaymentStep } from './components/PaymentStep';
import { Confirmation } from './components/Confirmation';
import { WidgetHeader } from './components/WidgetHeader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import type { EmbedConfig } from './types';
import './embed.css';

interface EmbedAppProps {
  config: EmbedConfig;
}

export function EmbedApp({ config }: EmbedAppProps) {
  const {
    currentStep,
    studio,
    isLoading,
    error,
    setConfig,
    setStudio,
    setServices,
    setLoading,
    setError,
  } = useEmbedStore();

  // Initialize widget
  useEffect(() => {
    setConfig(config);
    loadStudioData();
    notifyParent('ROOOM_READY', {});

    // Auto-resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        notifyParent('ROOOM_RESIZE', {
          height: entry.contentRect.height,
        });
      }
    });

    const container = document.getElementById('rooom-embed-root');
    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const loadStudioData = async () => {
    setLoading(true);
    setError(null);

    // Load studio config
    const studioRes = await embedApi.getStudioConfig(config.studioId);
    if (studioRes.error) {
      setError(studioRes.error);
      setLoading(false);
      return;
    }
    setStudio(studioRes.data!);

    // Load services
    const servicesRes = await embedApi.getServices(
      config.studioId,
      config.services.length ? config.services : undefined
    );
    if (servicesRes.error) {
      setError(servicesRes.error);
      setLoading(false);
      return;
    }
    setServices(servicesRes.data!);

    setLoading(false);
  };

  const notifyParent = (type: string, payload: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, '*');
    }
  };

  // Apply theme
  const themeClass = config.theme === 'dark' ? 'rooom-dark' : 'rooom-light';

  if (isLoading && !studio) {
    return (
      <div className={`rooom-widget ${themeClass}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !studio) {
    return (
      <div className={`rooom-widget ${themeClass}`}>
        <ErrorMessage message={error} onRetry={loadStudioData} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'services':
        return <ServiceSelection />;
      case 'datetime':
        return <DateTimeSelection />;
      case 'form':
        return <BookingForm />;
      case 'payment':
        return <PaymentStep />;
      case 'confirmation':
        return <Confirmation />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`rooom-widget ${themeClass}`}
      style={{ '--accent-color': config.accentColor } as React.CSSProperties}
    >
      <WidgetHeader />
      <main className="rooom-content">
        {renderStep()}
      </main>
    </div>
  );
}
```

**Step 2: Créer les styles de base**

```css
/* src/embed/embed.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

/* CSS Variables */
.rooom-widget {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;

  /* Light theme (default) */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --bg-tertiary: #F1F3F4;
  --text-primary: #1A1A2E;
  --text-secondary: #4A5568;
  --text-tertiary: #718096;
  --text-muted: #A0AEC0;
  --border-light: #E8E8E8;
  --border-default: #D1D5DB;
  --accent-primary: var(--accent-color, #1E3A5F);
  --accent-primary-light: color-mix(in srgb, var(--accent-primary) 10%, transparent);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* Base styles */
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

/* Dark theme */
.rooom-widget.rooom-dark {
  --bg-primary: #1A1A2E;
  --bg-secondary: #16213E;
  --bg-tertiary: #0F3460;
  --text-primary: #FFFFFF;
  --text-secondary: #CBD5E0;
  --text-tertiary: #A0AEC0;
  --text-muted: #718096;
  --border-light: #2D3748;
  --border-default: #4A5568;
}

/* Reset */
.rooom-widget *,
.rooom-widget *::before,
.rooom-widget *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Content area */
.rooom-content {
  padding: var(--space-5);
  min-height: 400px;
}

/* Typography */
.rooom-widget h1,
.rooom-widget h2,
.rooom-widget h3 {
  font-family: var(--font-display);
  font-weight: 400;
  font-style: italic;
  color: var(--text-primary);
}

.rooom-widget h1 { font-size: 28px; }
.rooom-widget h2 { font-size: 22px; }
.rooom-widget h3 { font-size: 18px; }

/* Buttons */
.rooom-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rooom-btn-primary {
  background-color: var(--accent-primary);
  color: white;
}

.rooom-btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.rooom-btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.rooom-btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
}

.rooom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Inputs */
.rooom-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease;
}

.rooom-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.rooom-input::placeholder {
  color: var(--text-muted);
}

/* Cards */
.rooom-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.rooom-card-interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}

.rooom-card-interactive:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
}

.rooom-card-selected {
  border-color: var(--accent-primary);
  background-color: var(--accent-primary-light);
}

/* Grid */
.rooom-grid {
  display: grid;
  gap: var(--space-4);
}

.rooom-grid-2 { grid-template-columns: repeat(2, 1fr); }
.rooom-grid-3 { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 480px) {
  .rooom-grid-2,
  .rooom-grid-3 {
    grid-template-columns: 1fr;
  }
}

/* Flex utilities */
.rooom-flex { display: flex; }
.rooom-flex-col { flex-direction: column; }
.rooom-items-center { align-items: center; }
.rooom-justify-between { justify-content: space-between; }
.rooom-gap-2 { gap: var(--space-2); }
.rooom-gap-3 { gap: var(--space-3); }
.rooom-gap-4 { gap: var(--space-4); }

/* Spacing utilities */
.rooom-mt-4 { margin-top: var(--space-4); }
.rooom-mt-6 { margin-top: var(--space-6); }
.rooom-mb-4 { margin-bottom: var(--space-4); }
.rooom-mb-6 { margin-bottom: var(--space-6); }

/* Text utilities */
.rooom-text-sm { font-size: 12px; }
.rooom-text-muted { color: var(--text-muted); }
.rooom-text-center { text-align: center; }
```

**Step 3: Vérifier les fichiers**

Run: `npx tsc src/embed/EmbedApp.tsx --noEmit --skipLibCheck --jsx react-jsx`
Expected: No errors (ou erreurs mineures sur imports pas encore créés)

**Step 4: Commit**

```bash
git add src/embed/EmbedApp.tsx src/embed/embed.css
git commit -m "feat(embed): add main EmbedApp component and base styles"
```

---

### Task 7: Composants UI Communs

**Files:**
- Create: `src/embed/components/WidgetHeader.tsx`
- Create: `src/embed/components/LoadingSpinner.tsx`
- Create: `src/embed/components/ErrorMessage.tsx`
- Create: `src/embed/components/StepIndicator.tsx`

**Step 1: Créer WidgetHeader**

```tsx
// src/embed/components/WidgetHeader.tsx
import { useEmbedStore } from '../store/embedStore';
import type { BookingStep } from '../types';

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'services', label: 'Service' },
  { key: 'datetime', label: 'Date & Heure' },
  { key: 'form', label: 'Informations' },
  { key: 'confirmation', label: 'Confirmation' },
];

export function WidgetHeader() {
  const { studio, currentStep, goBack } = useEmbedStore();
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  const canGoBack = currentIndex > 0 && currentStep !== 'confirmation';

  return (
    <header className="rooom-header">
      <div className="rooom-header-top">
        {canGoBack && (
          <button
            className="rooom-back-btn"
            onClick={goBack}
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="rooom-studio-info">
          {studio?.logo_url && (
            <img
              src={studio.logo_url}
              alt={studio.name}
              className="rooom-studio-logo"
            />
          )}
          <span className="rooom-studio-name">{studio?.name}</span>
        </div>
      </div>

      {currentStep !== 'confirmation' && (
        <div className="rooom-steps">
          {STEPS.slice(0, -1).map((step, index) => (
            <div
              key={step.key}
              className={`rooom-step ${
                index < currentIndex
                  ? 'rooom-step-complete'
                  : index === currentIndex
                  ? 'rooom-step-active'
                  : ''
              }`}
            >
              <div className="rooom-step-indicator">
                {index < currentIndex ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="rooom-step-label">{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .rooom-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--border-light);
          background-color: var(--bg-primary);
        }

        .rooom-header-top {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .rooom-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rooom-back-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .rooom-studio-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .rooom-studio-logo {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .rooom-studio-name {
          font-family: var(--font-display);
          font-size: 18px;
          font-style: italic;
          color: var(--text-primary);
        }

        .rooom-steps {
          display: flex;
          gap: var(--space-2);
        }

        .rooom-step {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
        }

        .rooom-step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .rooom-step-active .rooom-step-indicator {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        .rooom-step-complete .rooom-step-indicator {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        .rooom-step-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .rooom-step-active .rooom-step-label {
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .rooom-step-label {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
```

**Step 2: Créer LoadingSpinner**

```tsx
// src/embed/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="rooom-loading">
      <div className="rooom-spinner" />
      <p>Chargement...</p>

      <style>{`
        .rooom-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          gap: var(--space-4);
        }

        .rooom-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-light);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: rooom-spin 0.8s linear infinite;
        }

        @keyframes rooom-spin {
          to { transform: rotate(360deg); }
        }

        .rooom-loading p {
          font-size: 14px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
```

**Step 3: Créer ErrorMessage**

```tsx
// src/embed/components/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rooom-error">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        className="rooom-error-icon"
      >
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 16V26M24 32V32.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <h3>Une erreur est survenue</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="rooom-btn rooom-btn-primary" onClick={onRetry}>
          Réessayer
        </button>
      )}

      <style>{`
        .rooom-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          text-align: center;
          gap: var(--space-3);
        }

        .rooom-error-icon {
          color: #EF4444;
          margin-bottom: var(--space-2);
        }

        .rooom-error h3 {
          font-size: 18px;
          color: var(--text-primary);
        }

        .rooom-error p {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 300px;
        }
      `}</style>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/embed/components/
git commit -m "feat(embed): add common UI components (Header, Loading, Error)"
```

---

### Task 8: Composant Sélection de Service

**Files:**
- Create: `src/embed/components/ServiceSelection.tsx`

**Step 1: Créer le composant**

```tsx
// src/embed/components/ServiceSelection.tsx
import { useEmbedStore } from '../store/embedStore';
import type { EmbedService } from '../types';

export function ServiceSelection() {
  const { services, selectedService, selectService, isLoading } = useEmbedStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="rooom-services">
      <h2 className="rooom-mb-4">Choisissez un espace</h2>

      <div className="rooom-services-grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => selectService(service)}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      {services.length === 0 && !isLoading && (
        <div className="rooom-text-center rooom-text-muted rooom-mt-6">
          Aucun espace disponible pour le moment.
        </div>
      )}

      <style>{`
        .rooom-services h2 {
          font-size: 22px;
        }

        .rooom-services-grid {
          display: grid;
          gap: var(--space-4);
        }

        @media (min-width: 480px) {
          .rooom-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

interface ServiceCardProps {
  service: EmbedService;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
}

function ServiceCard({
  service,
  isSelected,
  onSelect,
  formatPrice,
}: ServiceCardProps) {
  return (
    <button
      className={`rooom-service-card ${isSelected ? 'rooom-card-selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      {service.image_url && (
        <img
          src={service.image_url}
          alt={service.name}
          className="rooom-service-image"
        />
      )}
      <div className="rooom-service-content">
        <h3 className="rooom-service-name">{service.name}</h3>
        {service.description && (
          <p className="rooom-service-description">{service.description}</p>
        )}
        <div className="rooom-service-meta">
          <span className="rooom-service-price">
            {formatPrice(service.hourly_rate)}/h
          </span>
          {service.amenities.length > 0 && (
            <span className="rooom-service-amenities">
              {service.amenities.slice(0, 3).join(' • ')}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .rooom-service-card {
          display: flex;
          flex-direction: column;
          text-align: left;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rooom-service-card:hover {
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .rooom-service-card.rooom-card-selected {
          border-color: var(--accent-primary);
          background: var(--accent-primary-light);
        }

        .rooom-service-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .rooom-service-content {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .rooom-service-name {
          font-family: var(--font-display);
          font-size: 16px;
          font-style: italic;
          color: var(--text-primary);
        }

        .rooom-service-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rooom-service-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-1);
        }

        .rooom-service-price {
          font-weight: 600;
          color: var(--accent-primary);
        }

        .rooom-service-amenities {
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </button>
  );
}
```

**Step 2: Vérifier le composant**

Run: `npx tsc src/embed/components/ServiceSelection.tsx --noEmit --skipLibCheck --jsx react-jsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/components/ServiceSelection.tsx
git commit -m "feat(embed): add ServiceSelection component"
```

---

### Task 9: Composant Sélection Date/Heure

**Files:**
- Create: `src/embed/components/DateTimeSelection.tsx`
- Create: `src/embed/components/Calendar.tsx`
- Create: `src/embed/components/TimeSlots.tsx`

**Step 1: Créer le composant Calendar**

```tsx
// src/embed/components/Calendar.tsx
import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function Calendar({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(minDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const isDateDisabled = (date: Date) => {
    const dayStart = startOfDay(date);
    if (isBefore(dayStart, startOfDay(minDate))) return true;
    if (maxDate && isBefore(maxDate, dayStart)) return true;
    return false;
  };

  return (
    <div className="rooom-calendar">
      <div className="rooom-calendar-header">
        <button
          className="rooom-calendar-nav"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={isSameMonth(currentMonth, minDate)}
          aria-label="Mois précédent"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="rooom-calendar-month">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>
        <button
          className="rooom-calendar-nav"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={maxDate ? isSameMonth(currentMonth, maxDate) : false}
          aria-label="Mois suivant"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="rooom-calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="rooom-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="rooom-calendar-days">
        {days.map((day) => {
          const disabled = isDateDisabled(day) || !isSameMonth(day, currentMonth);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              className={`rooom-calendar-day ${
                disabled ? 'rooom-day-disabled' : ''
              } ${selected ? 'rooom-day-selected' : ''} ${
                today ? 'rooom-day-today' : ''
              } ${!isSameMonth(day, currentMonth) ? 'rooom-day-outside' : ''}`}
              onClick={() => !disabled && onSelectDate(day)}
              disabled={disabled}
              type="button"
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <style>{`
        .rooom-calendar {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .rooom-calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .rooom-calendar-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rooom-calendar-nav:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .rooom-calendar-nav:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .rooom-calendar-month {
          font-family: var(--font-display);
          font-size: 16px;
          font-style: italic;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .rooom-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: var(--space-2);
        }

        .rooom-calendar-weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          padding: var(--space-2);
        }

        .rooom-calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .rooom-calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rooom-calendar-day:hover:not(:disabled) {
          background: var(--bg-secondary);
        }

        .rooom-day-outside {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .rooom-day-disabled {
          color: var(--text-muted);
          opacity: 0.3;
          cursor: not-allowed;
        }

        .rooom-day-today {
          font-weight: 700;
          color: var(--accent-primary);
        }

        .rooom-day-selected {
          background: var(--accent-primary) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}
```

**Step 2: Créer le composant TimeSlots**

```tsx
// src/embed/components/TimeSlots.tsx
import type { TimeSlot } from '../types';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading: boolean;
}

export function TimeSlots({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotsProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="rooom-timeslots-loading">
        <div className="rooom-spinner-small" />
        <span>Chargement des créneaux...</span>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);

  if (availableSlots.length === 0) {
    return (
      <div className="rooom-timeslots-empty">
        <p>Aucun créneau disponible pour cette date.</p>
        <p className="rooom-text-muted">Essayez une autre date.</p>
      </div>
    );
  }

  return (
    <div className="rooom-timeslots">
      <h4 className="rooom-timeslots-title">Créneaux disponibles</h4>
      <div className="rooom-timeslots-grid">
        {availableSlots.map((slot) => {
          const isSelected =
            selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

          return (
            <button
              key={`${slot.start}-${slot.end}`}
              className={`rooom-timeslot ${isSelected ? 'rooom-timeslot-selected' : ''}`}
              onClick={() => onSelectSlot(slot)}
              type="button"
            >
              <span className="rooom-timeslot-time">
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </span>
              <span className="rooom-timeslot-price">
                {formatPrice(slot.price)}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        .rooom-timeslots {
          margin-top: var(--space-4);
        }

        .rooom-timeslots-title {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: var(--space-3);
        }

        .rooom-timeslots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--space-2);
        }

        .rooom-timeslot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-3);
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rooom-timeslot:hover {
          border-color: var(--accent-primary);
          background: var(--accent-primary-light);
        }

        .rooom-timeslot-selected {
          background: var(--accent-primary) !important;
          border-color: var(--accent-primary) !important;
          color: white;
        }

        .rooom-timeslot-time {
          font-size: 14px;
          font-weight: 600;
        }

        .rooom-timeslot-price {
          font-size: 12px;
          opacity: 0.8;
        }

        .rooom-timeslot-selected .rooom-timeslot-price {
          color: rgba(255, 255, 255, 0.9);
        }

        .rooom-timeslots-loading,
        .rooom-timeslots-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          text-align: center;
          gap: var(--space-2);
          color: var(--text-secondary);
        }

        .rooom-spinner-small {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-light);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: rooom-spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
```

**Step 3: Créer DateTimeSelection**

```tsx
// src/embed/components/DateTimeSelection.tsx
import { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { useEmbedStore } from '../store/embedStore';
import { embedApi } from '../services/embedApi';
import { Calendar } from './Calendar';
import { TimeSlots } from './TimeSlots';
import type { TimeSlot } from '../types';

export function DateTimeSelection() {
  const {
    config,
    studio,
    selectedService,
    selectedDate,
    selectedSlot,
    availability,
    selectDate,
    selectSlot,
    setAvailability,
  } = useEmbedStore();

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const minDate = new Date();
  const maxDate = studio?.settings.booking_max_advance_days
    ? addDays(new Date(), studio.settings.booking_max_advance_days)
    : addDays(new Date(), 90);

  useEffect(() => {
    if (selectedDate && selectedService && config) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, selectedService?.id]);

  const loadAvailability = async (date: Date) => {
    if (!config || !selectedService) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    if (availability.has(dateStr)) return;

    setIsLoadingSlots(true);

    const response = await embedApi.getAvailability(
      config.studioId,
      selectedService.id,
      dateStr,
      dateStr
    );

    if (response.data?.[0]) {
      setAvailability(dateStr, response.data[0].slots);
    }

    setIsLoadingSlots(false);
  };

  const handleDateSelect = (date: Date) => {
    selectDate(format(date, 'yyyy-MM-dd'));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    selectSlot(slot);
  };

  const currentSlots = selectedDate
    ? availability.get(selectedDate) || []
    : [];

  return (
    <div className="rooom-datetime">
      <h2 className="rooom-mb-4">Choisissez une date et un horaire</h2>

      <div className="rooom-datetime-selected">
        <span className="rooom-datetime-service">
          {selectedService?.name}
        </span>
      </div>

      <div className="rooom-datetime-grid">
        <Calendar
          selectedDate={selectedDate ? new Date(selectedDate) : null}
          onSelectDate={handleDateSelect}
          minDate={minDate}
          maxDate={maxDate}
        />

        {selectedDate && (
          <TimeSlots
            slots={currentSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSlotSelect}
            isLoading={isLoadingSlots}
          />
        )}
      </div>

      <style>{`
        .rooom-datetime h2 {
          font-size: 22px;
        }

        .rooom-datetime-selected {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--accent-primary-light);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
        }

        .rooom-datetime-service {
          font-size: 13px;
          font-weight: 500;
          color: var(--accent-primary);
        }

        .rooom-datetime-grid {
          display: grid;
          gap: var(--space-5);
        }

        @media (min-width: 640px) {
          .rooom-datetime-grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/embed/components/Calendar.tsx src/embed/components/TimeSlots.tsx src/embed/components/DateTimeSelection.tsx
git commit -m "feat(embed): add date/time selection components with calendar"
```

---

### Task 10: Formulaire de Réservation

**Files:**
- Create: `src/embed/components/BookingForm.tsx`

**Step 1: Créer le composant BookingForm**

```tsx
// src/embed/components/BookingForm.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';
import { embedApi } from '../services/embedApi';

export function BookingForm() {
  const {
    config,
    studio,
    selectedService,
    selectedDate,
    selectedSlot,
    formData,
    updateFormData,
    setBookingResult,
    setLoading,
    setError,
    isLoading,
  } = useEmbedStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName?.trim()) {
      newErrors.clientName = 'Le nom est requis';
    }

    if (!formData.clientEmail?.trim()) {
      newErrors.clientEmail = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "L'email n'est pas valide";
    }

    if (!formData.clientPhone?.trim()) {
      newErrors.clientPhone = 'Le téléphone est requis';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !config || !selectedService || !selectedSlot) return;

    setLoading(true);
    setError(null);

    const response = await embedApi.createBooking(config.studioId, {
      serviceId: selectedService.id,
      date: selectedDate!,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      clientName: formData.clientName!,
      clientEmail: formData.clientEmail!,
      clientPhone: formData.clientPhone!,
      notes: formData.notes || '',
      acceptTerms: formData.acceptTerms!,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setBookingResult(response.data);

      // Notify parent
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: 'ROOOM_BOOKING_COMPLETE', payload: response.data },
          '*'
        );
      }
    }
  };

  const formatDateTime = () => {
    if (!selectedDate || !selectedSlot) return '';
    const date = new Date(selectedDate);
    const startTime = new Date(selectedSlot.start).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = new Date(selectedSlot.end).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${format(date, 'EEEE d MMMM yyyy', { locale: fr })} • ${startTime} - ${endTime}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: studio?.currency || 'EUR',
    }).format(price);
  };

  return (
    <div className="rooom-form">
      <h2 className="rooom-mb-4">Vos informations</h2>

      <div className="rooom-form-summary">
        <div className="rooom-form-summary-item">
          <span className="rooom-form-summary-label">Espace</span>
          <span className="rooom-form-summary-value">{selectedService?.name}</span>
        </div>
        <div className="rooom-form-summary-item">
          <span className="rooom-form-summary-label">Date & Heure</span>
          <span className="rooom-form-summary-value">{formatDateTime()}</span>
        </div>
        <div className="rooom-form-summary-item">
          <span className="rooom-form-summary-label">Prix</span>
          <span className="rooom-form-summary-value rooom-form-summary-price">
            {formatPrice(selectedSlot?.price || 0)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rooom-form-fields">
        <div className="rooom-form-group">
          <label htmlFor="clientName">Nom complet *</label>
          <input
            id="clientName"
            type="text"
            className={`rooom-input ${errors.clientName ? 'rooom-input-error' : ''}`}
            value={formData.clientName || ''}
            onChange={(e) => updateFormData({ clientName: e.target.value })}
            placeholder="Jean Dupont"
          />
          {errors.clientName && (
            <span className="rooom-form-error">{errors.clientName}</span>
          )}
        </div>

        <div className="rooom-form-row">
          <div className="rooom-form-group">
            <label htmlFor="clientEmail">Email *</label>
            <input
              id="clientEmail"
              type="email"
              className={`rooom-input ${errors.clientEmail ? 'rooom-input-error' : ''}`}
              value={formData.clientEmail || ''}
              onChange={(e) => updateFormData({ clientEmail: e.target.value })}
              placeholder="jean@exemple.fr"
            />
            {errors.clientEmail && (
              <span className="rooom-form-error">{errors.clientEmail}</span>
            )}
          </div>

          <div className="rooom-form-group">
            <label htmlFor="clientPhone">Téléphone *</label>
            <input
              id="clientPhone"
              type="tel"
              className={`rooom-input ${errors.clientPhone ? 'rooom-input-error' : ''}`}
              value={formData.clientPhone || ''}
              onChange={(e) => updateFormData({ clientPhone: e.target.value })}
              placeholder="06 12 34 56 78"
            />
            {errors.clientPhone && (
              <span className="rooom-form-error">{errors.clientPhone}</span>
            )}
          </div>
        </div>

        <div className="rooom-form-group">
          <label htmlFor="notes">Notes (optionnel)</label>
          <textarea
            id="notes"
            className="rooom-input rooom-textarea"
            value={formData.notes || ''}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            placeholder="Informations supplémentaires..."
            rows={3}
          />
        </div>

        <div className="rooom-form-checkbox">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={formData.acceptTerms || false}
            onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
          />
          <label htmlFor="acceptTerms">
            J'accepte les{' '}
            <a href="#" target="_blank" rel="noopener">
              conditions générales
            </a>{' '}
            et la{' '}
            <a href="#" target="_blank" rel="noopener">
              politique d'annulation
            </a>
          </label>
        </div>
        {errors.acceptTerms && (
          <span className="rooom-form-error">{errors.acceptTerms}</span>
        )}

        <button
          type="submit"
          className="rooom-btn rooom-btn-primary rooom-btn-full"
          disabled={isLoading}
        >
          {isLoading ? 'Réservation en cours...' : 'Confirmer la réservation'}
        </button>
      </form>

      <style>{`
        .rooom-form h2 {
          font-size: 22px;
        }

        .rooom-form-summary {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .rooom-form-summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rooom-form-summary-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .rooom-form-summary-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          text-align: right;
        }

        .rooom-form-summary-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .rooom-form-fields {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .rooom-form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .rooom-form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .rooom-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        @media (max-width: 480px) {
          .rooom-form-row {
            grid-template-columns: 1fr;
          }
        }

        .rooom-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .rooom-input-error {
          border-color: #EF4444;
        }

        .rooom-form-error {
          font-size: 12px;
          color: #EF4444;
        }

        .rooom-form-checkbox {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .rooom-form-checkbox input {
          margin-top: 4px;
        }

        .rooom-form-checkbox label {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .rooom-form-checkbox a {
          color: var(--accent-primary);
          text-decoration: underline;
        }

        .rooom-btn-full {
          width: 100%;
          padding: var(--space-4);
          font-size: 16px;
          margin-top: var(--space-2);
        }
      `}</style>
    </div>
  );
}
```

**Step 2: Vérifier le composant**

Run: `npx tsc src/embed/components/BookingForm.tsx --noEmit --skipLibCheck --jsx react-jsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/embed/components/BookingForm.tsx
git commit -m "feat(embed): add booking form component with validation"
```

---

### Task 11: Pages Paiement et Confirmation

**Files:**
- Create: `src/embed/components/PaymentStep.tsx`
- Create: `src/embed/components/Confirmation.tsx`

**Step 1: Créer PaymentStep**

```tsx
// src/embed/components/PaymentStep.tsx
import { useEffect } from 'react';
import { useEmbedStore } from '../store/embedStore';

export function PaymentStep() {
  const { bookingResult, goToStep } = useEmbedStore();

  useEffect(() => {
    // If there's a payment URL, redirect to it
    if (bookingResult?.paymentUrl) {
      window.location.href = bookingResult.paymentUrl;
    }
  }, [bookingResult?.paymentUrl]);

  // If no payment required, go directly to confirmation
  useEffect(() => {
    if (bookingResult && !bookingResult.paymentUrl) {
      goToStep('confirmation');
    }
  }, [bookingResult]);

  return (
    <div className="rooom-payment">
      <div className="rooom-payment-loading">
        <div className="rooom-spinner" />
        <h3>Redirection vers le paiement...</h3>
        <p>Vous allez être redirigé vers notre plateforme de paiement sécurisée.</p>
      </div>

      <style>{`
        .rooom-payment {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .rooom-payment-loading {
          text-align: center;
        }

        .rooom-payment-loading h3 {
          font-size: 20px;
          margin: var(--space-4) 0 var(--space-2);
        }

        .rooom-payment-loading p {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .rooom-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto;
          border: 3px solid var(--border-light);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: rooom-spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
```

**Step 2: Créer Confirmation**

```tsx
// src/embed/components/Confirmation.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEmbedStore } from '../store/embedStore';

export function Confirmation() {
  const { bookingResult, studio, reset } = useEmbedStore();

  if (!bookingResult) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: studio?.currency || 'EUR',
    }).format(price);
  };

  return (
    <div className="rooom-confirmation">
      <div className="rooom-confirmation-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M16 24L22 30L32 18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2>Réservation confirmée !</h2>
      <p className="rooom-confirmation-ref">
        Référence : <strong>{bookingResult.reference}</strong>
      </p>

      <div className="rooom-confirmation-details">
        <div className="rooom-confirmation-row">
          <span className="rooom-confirmation-label">Espace</span>
          <span className="rooom-confirmation-value">
            {bookingResult.service.name}
          </span>
        </div>
        <div className="rooom-confirmation-row">
          <span className="rooom-confirmation-label">Date</span>
          <span className="rooom-confirmation-value">
            {formatDate(bookingResult.date)}
          </span>
        </div>
        <div className="rooom-confirmation-row">
          <span className="rooom-confirmation-label">Horaire</span>
          <span className="rooom-confirmation-value">
            {formatTime(bookingResult.startTime)} -{' '}
            {formatTime(bookingResult.endTime)}
          </span>
        </div>
        <div className="rooom-confirmation-row rooom-confirmation-total">
          <span className="rooom-confirmation-label">Total</span>
          <span className="rooom-confirmation-value">
            {formatPrice(bookingResult.totalAmount)}
          </span>
        </div>
      </div>

      <p className="rooom-confirmation-email">
        Un email de confirmation a été envoyé avec tous les détails de votre
        réservation.
      </p>

      <button
        className="rooom-btn rooom-btn-secondary rooom-btn-full"
        onClick={reset}
      >
        Faire une nouvelle réservation
      </button>

      <style>{`
        .rooom-confirmation {
          text-align: center;
          padding: var(--space-4) 0;
        }

        .rooom-confirmation-icon {
          color: #10B981;
          margin-bottom: var(--space-4);
        }

        .rooom-confirmation h2 {
          font-size: 24px;
          margin-bottom: var(--space-2);
        }

        .rooom-confirmation-ref {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: var(--space-5);
        }

        .rooom-confirmation-ref strong {
          color: var(--text-primary);
          font-family: monospace;
        }

        .rooom-confirmation-details {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-5);
          text-align: left;
        }

        .rooom-confirmation-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-2) 0;
          border-bottom: 1px solid var(--border-light);
        }

        .rooom-confirmation-row:last-child {
          border-bottom: none;
        }

        .rooom-confirmation-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .rooom-confirmation-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .rooom-confirmation-total {
          padding-top: var(--space-3);
          margin-top: var(--space-2);
          border-top: 2px solid var(--border-default);
        }

        .rooom-confirmation-total .rooom-confirmation-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .rooom-confirmation-email {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: var(--space-5);
        }

        .rooom-btn-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/embed/components/PaymentStep.tsx src/embed/components/Confirmation.tsx
git commit -m "feat(embed): add payment redirect and confirmation components"
```

---

## Phase 4: API Endpoints Supabase

### Task 12: Edge Functions Setup

**Files:**
- Create: `supabase/functions/embed-config/index.ts`
- Create: `supabase/functions/embed-services/index.ts`
- Create: `supabase/functions/embed-availability/index.ts`
- Create: `supabase/functions/embed-booking/index.ts`

**Step 1: Créer embed-config**

```typescript
// supabase/functions/embed-config/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const studioId = url.searchParams.get('studioId')

    if (!studioId) {
      return new Response(
        JSON.stringify({ error: 'studioId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: studio, error } = await supabaseClient
      .from('studios')
      .select('id, name, slug, logo_url, timezone, currency, settings')
      .eq('id', studioId)
      .single()

    if (error || !studio) {
      return new Response(
        JSON.stringify({ error: 'Studio not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(studio),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 2: Créer embed-services**

```typescript
// supabase/functions/embed-services/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const studioId = url.searchParams.get('studioId')
    const serviceIds = url.searchParams.get('services')?.split(',').filter(Boolean)

    if (!studioId) {
      return new Response(
        JSON.stringify({ error: 'studioId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let query = supabaseClient
      .from('spaces')
      .select(`
        id,
        name,
        description,
        hourly_rate,
        half_day_rate,
        full_day_rate,
        min_booking_hours,
        max_booking_hours,
        image_url,
        amenities
      `)
      .eq('studio_id', studioId)
      .eq('is_active', true)

    if (serviceIds && serviceIds.length > 0) {
      query = query.in('id', serviceIds)
    }

    const { data: services, error } = await query

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(services || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 3: Créer embed-availability**

```typescript
// supabase/functions/embed-availability/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const studioId = url.searchParams.get('studioId')
    const serviceId = url.searchParams.get('serviceId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    if (!studioId || !serviceId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get space info
    const { data: space, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('hourly_rate, min_booking_hours')
      .eq('id', serviceId)
      .single()

    if (spaceError || !space) {
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing bookings for the date range
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('start_time, end_time')
      .eq('space_id', serviceId)
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`)
      .in('status', ['pending', 'confirmed'])

    if (bookingsError) {
      return new Response(
        JSON.stringify({ error: bookingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate time slots (9am to 9pm, hourly)
    const availability = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const slots = []

      for (let hour = 9; hour < 21; hour++) {
        const slotStart = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`)
        const slotEnd = new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`)

        // Check if slot conflicts with any booking
        const isBooked = bookings?.some((booking) => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)
          return slotStart < bookingEnd && slotEnd > bookingStart
        })

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isBooked,
          price: space.hourly_rate,
        })
      }

      availability.push({ date: dateStr, slots })
      current.setDate(current.getDate() + 1)
    }

    return new Response(
      JSON.stringify(availability),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 4: Créer embed-booking**

```typescript
// supabase/functions/embed-booking/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateReference() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'RB-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const {
      studioId,
      serviceId,
      date,
      startTime,
      endTime,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = body

    if (!studioId || !serviceId || !startTime || !endTime || !clientName || !clientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get space info for pricing
    const { data: space, error: spaceError } = await supabaseClient
      .from('spaces')
      .select('id, name, description, hourly_rate, image_url, amenities')
      .eq('id', serviceId)
      .single()

    if (spaceError || !space) {
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate duration and price
    const start = new Date(startTime)
    const end = new Date(endTime)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const totalAmount = hours * space.hourly_rate

    // Find or create client
    let { data: client } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', clientEmail)
      .eq('studio_id', studioId)
      .single()

    if (!client) {
      const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          studio_id: studioId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
        })
        .select('id')
        .single()

      if (clientError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create client' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      client = newClient
    }

    // Create booking
    const reference = generateReference()
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        studio_id: studioId,
        space_id: serviceId,
        client_id: client.id,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        total_amount: totalAmount,
        paid_amount: 0,
        notes: notes || null,
        source: 'embed_widget',
      })
      .select('id')
      .single()

    if (bookingError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Create Stripe checkout session if payment required
    // For now, return without payment URL

    const result = {
      id: booking.id,
      reference,
      status: 'pending',
      service: {
        id: space.id,
        name: space.name,
        description: space.description,
        hourly_rate: space.hourly_rate,
        image_url: space.image_url,
        amenities: space.amenities || [],
      },
      date,
      startTime,
      endTime,
      totalAmount,
      depositAmount: null,
      paymentUrl: null,
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 5: Commit**

```bash
git add supabase/
git commit -m "feat(embed): add Supabase Edge Functions for embed API"
```

---

## Phase 5: Page de Test et Build

### Task 13: Page de Démo/Test

**Files:**
- Create: `public/embed-demo.html`

**Step 1: Créer la page de démo**

```html
<!-- public/embed-demo.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rooom OS - Embed Widget Demo</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 8px;
      color: #1a1a2e;
    }

    .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 40px;
    }

    .demo-section {
      background: white;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .demo-section h2 {
      font-size: 20px;
      margin-bottom: 16px;
      color: #1a1a2e;
    }

    .code-block {
      background: #1a1a2e;
      color: #e5e5e5;
      padding: 20px;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin-bottom: 24px;
    }

    .code-block .comment {
      color: #6b7280;
    }

    .code-block .string {
      color: #a5d6ff;
    }

    .code-block .keyword {
      color: #ff7b72;
    }

    .widget-container {
      border: 2px dashed #e5e5e5;
      border-radius: 12px;
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .widget-placeholder {
      text-align: center;
      color: #999;
    }

    .config-panel {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .config-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .config-field label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
    }

    .config-field input,
    .config-field select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #1E3A5F;
      color: white;
    }

    .btn-primary:hover {
      background: #2a4a75;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover {
      background: #eee;
    }

    .btn-group {
      display: flex;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Rooom OS - Widget Embed</h1>
    <p class="subtitle">Intégrez facilement un système de réservation sur votre site web</p>

    <!-- Configuration -->
    <div class="demo-section">
      <h2>Configuration</h2>
      <div class="config-panel">
        <div class="config-field">
          <label>Studio ID</label>
          <input type="text" id="studioId" value="demo-studio-123" />
        </div>
        <div class="config-field">
          <label>Thème</label>
          <select id="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div class="config-field">
          <label>Couleur accent</label>
          <input type="color" id="accentColor" value="#1E3A5F" />
        </div>
        <div class="config-field">
          <label>Locale</label>
          <select id="locale">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="loadWidget()">
          Charger le widget
        </button>
        <button class="btn btn-secondary" onclick="copyCode()">
          Copier le code
        </button>
      </div>
    </div>

    <!-- Code Example -->
    <div class="demo-section">
      <h2>Code d'intégration</h2>
      <div class="code-block" id="codeBlock">
<span class="comment">&lt;!-- Ajoutez ce code où vous voulez afficher le widget --&gt;</span>
&lt;<span class="keyword">div</span>
  <span class="keyword">id</span>=<span class="string">"rooom-booking"</span>
  <span class="keyword">data-rooom-studio-id</span>=<span class="string">"demo-studio-123"</span>
  <span class="keyword">data-rooom-theme</span>=<span class="string">"light"</span>
  <span class="keyword">data-rooom-accent-color</span>=<span class="string">"#1E3A5F"</span>
  <span class="keyword">data-rooom-locale</span>=<span class="string">"fr"</span>
&gt;&lt;/<span class="keyword">div</span>&gt;

<span class="comment">&lt;!-- Chargez le script (avant &lt;/body&gt;) --&gt;</span>
&lt;<span class="keyword">script</span> <span class="keyword">src</span>=<span class="string">"https://embed.rooom-os.com/loader.js"</span>&gt;&lt;/<span class="keyword">script</span>&gt;
      </div>
    </div>

    <!-- Live Preview -->
    <div class="demo-section">
      <h2>Aperçu en direct</h2>
      <div class="widget-container" id="widgetContainer">
        <div class="widget-placeholder">
          <p>Cliquez sur "Charger le widget" pour voir l'aperçu</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    function loadWidget() {
      const studioId = document.getElementById('studioId').value;
      const theme = document.getElementById('theme').value;
      const accentColor = document.getElementById('accentColor').value;
      const locale = document.getElementById('locale').value;

      const container = document.getElementById('widgetContainer');
      container.innerHTML = '';

      // Create widget container
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'rooom-booking';
      widgetDiv.dataset.rooomStudioId = studioId;
      widgetDiv.dataset.rooomTheme = theme;
      widgetDiv.dataset.rooomAccentColor = accentColor;
      widgetDiv.dataset.rooomLocale = locale;
      container.appendChild(widgetDiv);

      // Load widget script (for demo, use local dev server)
      const existingScript = document.querySelector('script[data-rooom]');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.src = '/src/embed/main.tsx';
      script.type = 'module';
      script.dataset.rooom = 'true';
      document.body.appendChild(script);

      // Update code block
      updateCodeBlock();
    }

    function updateCodeBlock() {
      const studioId = document.getElementById('studioId').value;
      const theme = document.getElementById('theme').value;
      const accentColor = document.getElementById('accentColor').value;
      const locale = document.getElementById('locale').value;

      document.getElementById('codeBlock').innerHTML = `<span class="comment">&lt;!-- Ajoutez ce code où vous voulez afficher le widget --&gt;</span>
&lt;<span class="keyword">div</span>
  <span class="keyword">id</span>=<span class="string">"rooom-booking"</span>
  <span class="keyword">data-rooom-studio-id</span>=<span class="string">"${studioId}"</span>
  <span class="keyword">data-rooom-theme</span>=<span class="string">"${theme}"</span>
  <span class="keyword">data-rooom-accent-color</span>=<span class="string">"${accentColor}"</span>
  <span class="keyword">data-rooom-locale</span>=<span class="string">"${locale}"</span>
&gt;&lt;/<span class="keyword">div</span>&gt;

<span class="comment">&lt;!-- Chargez le script (avant &lt;/body&gt;) --&gt;</span>
&lt;<span class="keyword">script</span> <span class="keyword">src</span>=<span class="string">"https://embed.rooom-os.com/loader.js"</span>&gt;&lt;/<span class="keyword">script</span>&gt;`;
    }

    function copyCode() {
      const studioId = document.getElementById('studioId').value;
      const theme = document.getElementById('theme').value;
      const accentColor = document.getElementById('accentColor').value;
      const locale = document.getElementById('locale').value;

      const code = `<!-- Widget Rooom OS -->
<div
  id="rooom-booking"
  data-rooom-studio-id="${studioId}"
  data-rooom-theme="${theme}"
  data-rooom-accent-color="${accentColor}"
  data-rooom-locale="${locale}"
></div>
<script src="https://embed.rooom-os.com/loader.js"><\/script>`;

      navigator.clipboard.writeText(code).then(() => {
        alert('Code copié !');
      });
    }

    // Update code on config change
    document.querySelectorAll('.config-field input, .config-field select').forEach(el => {
      el.addEventListener('change', updateCodeBlock);
    });
  </script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add public/embed-demo.html
git commit -m "feat(embed): add demo page for widget testing"
```

---

### Task 14: Index des composants et build final

**Files:**
- Create: `src/embed/components/index.ts`
- Update: `src/embed/main.tsx` (imports)

**Step 1: Créer l'index des composants**

```typescript
// src/embed/components/index.ts
export { WidgetHeader } from './WidgetHeader';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorMessage } from './ErrorMessage';
export { ServiceSelection } from './ServiceSelection';
export { DateTimeSelection } from './DateTimeSelection';
export { Calendar } from './Calendar';
export { TimeSlots } from './TimeSlots';
export { BookingForm } from './BookingForm';
export { PaymentStep } from './PaymentStep';
export { Confirmation } from './Confirmation';
```

**Step 2: Vérifier le build complet**

Run: `npm run build`
Expected: Build successful sans erreurs

**Step 3: Vérifier que l'app principale fonctionne toujours**

Run: `npm run dev`
Expected: App démarre sur localhost:5173 ou port suivant

**Step 4: Commit final**

```bash
git add .
git commit -m "feat(embed): complete widget embed implementation

- Multi-entry Vite build config
- Loader script with auto-init
- Full booking flow (services → datetime → form → confirmation)
- Zustand store for state management
- API service layer
- Supabase Edge Functions for backend
- Demo page for testing
- PostMessage API for parent communication
- Light/dark theme support
- Responsive design"
```

---

## Checklist Finale

- [ ] Vite multi-entry build configuré
- [ ] Loader script avec auto-init
- [ ] Types TypeScript complets
- [ ] Store Zustand pour le flow de booking
- [ ] Service API pour les endpoints embed
- [ ] Composant EmbedApp principal
- [ ] WidgetHeader avec stepper
- [ ] ServiceSelection avec cards
- [ ] Calendar component
- [ ] TimeSlots component
- [ ] DateTimeSelection composé
- [ ] BookingForm avec validation
- [ ] PaymentStep (redirection)
- [ ] Confirmation page
- [ ] Supabase Edge Functions (4 endpoints)
- [ ] Page de démo
- [ ] Build et tests réussis
