import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalConfig {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Theme
  theme: Theme;

  // Modals
  openModals: ModalConfig[];

  // Notifications
  notifications: Notification[];

  // Command palette
  commandPaletteOpen: boolean;

  // Search
  globalSearchOpen: boolean;
  globalSearchQuery: string;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;

  // Theme actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Modal actions
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Command palette actions
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Search actions
  toggleGlobalSearch: () => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
}

const generateId = (): string => {
  return crypto.randomUUID();
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial sidebar state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,

      // Initial theme - default to light to avoid unexpected dark mode
      theme: 'light',

      // Initial modals
      openModals: [],

      // Initial notifications
      notifications: [],

      // Initial command palette
      commandPaletteOpen: false,

      // Initial search
      globalSearchOpen: false,
      globalSearchQuery: '',

      // Initial loading
      globalLoading: false,
      loadingMessage: null,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

      setMobileSidebarOpen: (open) => set({ sidebarMobileOpen: open }),

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document via data-theme attribute
        if (typeof document !== 'undefined') {
          const root = document.documentElement;

          if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
          } else if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
          } else {
            // 'system' - detect OS preference and apply via JS
            const prefersDark =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          }
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme: Theme =
          currentTheme === 'light'
            ? 'dark'
            : currentTheme === 'dark'
            ? 'system'
            : 'light';
        get().setTheme(newTheme);
      },

      // Modal actions
      openModal: (config) =>
        set((state) => ({
          openModals: [...state.openModals, config],
        })),

      closeModal: (id) => {
        const modal = get().openModals.find((m) => m.id === id);
        if (modal?.onClose) {
          modal.onClose();
        }
        set((state) => ({
          openModals: state.openModals.filter((m) => m.id !== id),
        }));
      },

      closeAllModals: () => {
        get().openModals.forEach((modal) => {
          if (modal.onClose) {
            modal.onClose();
          }
        });
        set({ openModals: [] });
      },

      isModalOpen: (id) => get().openModals.some((m) => m.id === id),

      // Notification actions
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Command palette actions
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Search actions
      toggleGlobalSearch: () =>
        set((state) => ({ globalSearchOpen: !state.globalSearchOpen })),

      setGlobalSearchOpen: (open) =>
        set({ globalSearchOpen: open, globalSearchQuery: open ? '' : '' }),

      setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

      // Loading actions
      setGlobalLoading: (loading, message = null) =>
        set({ globalLoading: loading, loadingMessage: message }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Helper hooks for common UI operations
export const useNotifications = () => {
  const { addNotification, removeNotification, clearNotifications, notifications } =
    useUIStore();

  return {
    notifications,
    notify: addNotification,
    dismiss: removeNotification,
    clear: clearNotifications,
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message }),
  };
};

export const useModals = () => {
  const { openModal, closeModal, closeAllModals, openModals, isModalOpen } =
    useUIStore();

  return {
    modals: openModals,
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
    isOpen: isModalOpen,
  };
};

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useUIStore();

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark:
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
};
