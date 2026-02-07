import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

beforeEach(() => {
  useUIStore.setState({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    theme: 'system',
    openModals: [],
    notifications: [],
    commandPaletteOpen: false,
    globalSearchOpen: false,
    globalSearchQuery: '',
    globalLoading: false,
    loadingMessage: null,
  });
});

describe('uiStore - sidebar', () => {
  it('toggle le sidebar', () => {
    const { toggleSidebar } = useUIStore.getState();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('set le sidebar collapsed', () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});

describe('uiStore - theme', () => {
  it('cycle le theme: system → light → dark → system', () => {
    const store = useUIStore.getState();
    expect(store.theme).toBe('system');

    store.toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');

    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');

    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('set un theme specifique', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });
});

describe('uiStore - modals', () => {
  it('ouvre et ferme un modal', () => {
    const store = useUIStore.getState();
    store.openModal({ id: 'test-modal', component: 'TestModal' });
    expect(useUIStore.getState().openModals).toHaveLength(1);
    expect(useUIStore.getState().isModalOpen('test-modal')).toBe(true);

    useUIStore.getState().closeModal('test-modal');
    expect(useUIStore.getState().openModals).toHaveLength(0);
    expect(useUIStore.getState().isModalOpen('test-modal')).toBe(false);
  });

  it('ferme tous les modals', () => {
    const store = useUIStore.getState();
    store.openModal({ id: 'modal-1', component: 'A' });
    store.openModal({ id: 'modal-2', component: 'B' });
    expect(useUIStore.getState().openModals).toHaveLength(2);

    useUIStore.getState().closeAllModals();
    expect(useUIStore.getState().openModals).toHaveLength(0);
  });
});

describe('uiStore - notifications', () => {
  it('ajoute une notification avec ID', () => {
    const id = useUIStore.getState().addNotification({
      type: 'success',
      title: 'Test',
    });
    expect(id).toBeTruthy();
    expect(useUIStore.getState().notifications).toHaveLength(1);
    expect(useUIStore.getState().notifications[0].type).toBe('success');
  });

  it('supprime une notification', () => {
    const id = useUIStore.getState().addNotification({
      type: 'error',
      title: 'Erreur',
      duration: 0, // pas d'auto-remove
    });
    expect(useUIStore.getState().notifications).toHaveLength(1);

    useUIStore.getState().removeNotification(id);
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });

  it('clear toutes les notifications', () => {
    useUIStore.getState().addNotification({ type: 'info', title: 'A', duration: 0 });
    useUIStore.getState().addNotification({ type: 'warning', title: 'B', duration: 0 });
    expect(useUIStore.getState().notifications).toHaveLength(2);

    useUIStore.getState().clearNotifications();
    expect(useUIStore.getState().notifications).toHaveLength(0);
  });
});

describe('uiStore - command palette & search', () => {
  it('toggle la command palette', () => {
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('toggle et set la recherche globale', () => {
    useUIStore.getState().toggleGlobalSearch();
    expect(useUIStore.getState().globalSearchOpen).toBe(true);

    useUIStore.getState().setGlobalSearchQuery('test');
    expect(useUIStore.getState().globalSearchQuery).toBe('test');
  });
});

describe('uiStore - loading', () => {
  it('set le loading global avec message', () => {
    useUIStore.getState().setGlobalLoading(true, 'Chargement...');
    expect(useUIStore.getState().globalLoading).toBe(true);
    expect(useUIStore.getState().loadingMessage).toBe('Chargement...');

    useUIStore.getState().setGlobalLoading(false);
    expect(useUIStore.getState().globalLoading).toBe(false);
    expect(useUIStore.getState().loadingMessage).toBe(null);
  });
});
