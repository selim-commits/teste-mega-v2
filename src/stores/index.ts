// Auth store
export { useAuthStore } from './authStore';

// Booking store
export {
  useBookingStore,
  selectFilteredBookings,
  selectBookingsByDate,
  type ViewMode,
} from './bookingStore';

// Client store
export {
  useClientStore,
  selectFilteredClients,
  selectPaginatedClients,
  selectClientsByTier,
  selectActiveClients,
} from './clientStore';

// Equipment store
export {
  useEquipmentStore,
  selectFilteredEquipment,
  selectPaginatedEquipment,
  selectEquipmentByStatus,
  selectEquipmentByCategory,
  selectAvailableEquipment,
  selectEquipmentValue,
} from './equipmentStore';

// Finance store
export {
  useFinanceStore,
  selectFilteredInvoices,
  selectPaginatedInvoices,
  selectInvoicesByStatus,
  selectOverdueInvoices,
  selectRecentPayments,
  selectPaymentsByInvoice,
  type Quote,
} from './financeStore';

// Team store
export {
  useTeamStore,
  selectFilteredMembers,
  selectMembersByRole,
  selectActiveMembers,
  selectMemberByUserId,
  selectOwners,
  selectAdmins,
} from './teamStore';

// UI store
export {
  useUIStore,
  useNotifications,
  useModals,
  useTheme,
  type Theme,
  type NotificationType,
  type Notification,
  type ModalConfig,
} from './uiStore';
