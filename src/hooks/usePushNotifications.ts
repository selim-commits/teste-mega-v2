import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

export type PushPermissionStatus = 'default' | 'granted' | 'denied';

export type PushCategory = 'bookings' | 'messages' | 'alerts';

export interface PushPreferences {
  enabled: boolean;
  categories: Record<PushCategory, boolean>;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  category: PushCategory;
}

interface UsePushNotificationsReturn {
  /** Whether the browser supports the Notification API */
  isSupported: boolean;
  /** Current permission status */
  permissionStatus: PushPermissionStatus;
  /** User preferences (enabled + per-category toggles) */
  preferences: PushPreferences;
  /** Request notification permission from the browser */
  requestPermission: () => Promise<PushPermissionStatus>;
  /** Toggle the global push enabled state */
  toggleEnabled: () => void;
  /** Toggle a specific category */
  toggleCategory: (category: PushCategory) => void;
  /** Send a browser notification (respects preferences) */
  sendNotification: (payload: PushNotificationPayload) => void;
  /** Send a test notification for a given category */
  sendTestNotification: (category: PushCategory) => void;
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY = 'rooom-push-preferences';

const DEFAULT_PREFERENCES: PushPreferences = {
  enabled: true,
  categories: {
    bookings: true,
    messages: true,
    alerts: true,
  },
};

const CATEGORY_LABELS: Record<PushCategory, string> = {
  bookings: 'Réservations',
  messages: 'Messages',
  alerts: 'Alertes système',
};

const TEST_NOTIFICATIONS: Record<PushCategory, Omit<PushNotificationPayload, 'category'>> = {
  bookings: {
    title: 'Nouvelle réservation',
    body: 'Marie Dupont a réservé le Studio A pour demain 14h-16h.',
    tag: 'test-booking',
  },
  messages: {
    title: 'Nouveau message',
    body: 'Vous avez reçu un message de Jean Martin concernant sa séance.',
    tag: 'test-message',
  },
  alerts: {
    title: 'Alerte système',
    body: 'Le Flash Profoto A1 a été signalé comme indisponible.',
    tag: 'test-alert',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function loadPreferences(): PushPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as PushPreferences;
    }
  } catch {
    // Ignore invalid JSON
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: PushPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

function getPermissionStatus(): PushPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission as PushPermissionStatus;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function usePushNotifications(): UsePushNotificationsReturn {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>(
    getPermissionStatus
  );
  const [preferences, setPreferences] = useState<PushPreferences>(loadPreferences);

  // Keep a ref in sync so callbacks always read the latest preferences
  const prefsRef = useRef(preferences);
  useEffect(() => {
    prefsRef.current = preferences;
  }, [preferences]);

  // Persist preferences when they change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const requestPermission = useCallback(async (): Promise<PushPermissionStatus> => {
    if (!isSupported) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      const status = result as PushPermissionStatus;
      setPermissionStatus(status);
      return status;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  const toggleEnabled = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  const toggleCategory = useCallback((category: PushCategory) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
  }, []);

  const sendNotification = useCallback(
    (payload: PushNotificationPayload) => {
      const currentPrefs = prefsRef.current;

      // Respect global + per-category preferences
      if (!currentPrefs.enabled || !currentPrefs.categories[payload.category]) {
        return;
      }

      if (!isSupported || permissionStatus !== 'granted') {
        return;
      }

      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon ?? '/favicon.ico',
          tag: payload.tag,
        });
      } catch {
        // Notification constructor can throw in some environments
      }
    },
    [isSupported, permissionStatus]
  );

  const sendTestNotification = useCallback(
    (category: PushCategory) => {
      const testData = TEST_NOTIFICATIONS[category];
      // For the test, we temporarily bypass the category check
      if (!isSupported || permissionStatus !== 'granted') {
        return;
      }

      try {
        new Notification(testData.title, {
          body: testData.body,
          icon: '/favicon.ico',
          tag: testData.tag,
        });
      } catch {
        // Notification constructor can throw in some environments
      }
    },
    [isSupported, permissionStatus]
  );

  return {
    isSupported,
    permissionStatus,
    preferences,
    requestPermission,
    toggleEnabled,
    toggleCategory,
    sendNotification,
    sendTestNotification,
  };
}

// Re-export for convenience
export { CATEGORY_LABELS };
export type { PushNotificationPayload };
