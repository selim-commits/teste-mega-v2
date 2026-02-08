// Authentication
export { useAuth } from './useAuth';
export type {
  AuthState,
  SignUpCredentials,
  SignInCredentials,
  ResetPasswordCredentials,
  UpdatePasswordCredentials,
} from './useAuth';

// Bookings
export {
  useBookings,
  useBooking,
  useBookingWithRelations,
  useUpcomingBookings,
  useTodayBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useUpdateBookingStatus,
  useCheckAvailability,
} from './useBookings';
export type { BookingFilters } from './useBookings';

// Clients
export {
  useClients,
  useActiveClients,
  useClient,
  useSearchClients,
  useClientByEmail,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useUpdateClientTier,
  useUpdateClientScore,
  useAddClientTags,
  useRemoveClientTags,
  useDeactivateClient,
  useActivateClient,
} from './useClients';
export type { ClientFilters } from './useClients';

// Equipment
export {
  useEquipment,
  useAvailableEquipment,
  useMaintenanceNeeded,
  useEquipmentItem,
  useEquipmentByQrCode,
  useEquipmentBySerialNumber,
  useEquipmentCategories,
  useSearchEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useUpdateEquipmentStatus,
  useUpdateEquipmentCondition,
  useUpdateEquipmentLocation,
  useRetireEquipment,
  useSetEquipmentForMaintenance,
} from './useEquipment';
export type { EquipmentFilters } from './useEquipment';

// Invoices
export {
  useInvoices,
  useOverdueInvoices,
  usePendingInvoices,
  useInvoice,
  useInvoiceWithRelations,
  useInvoiceByBooking,
  useInvoiceByNumber,
  useTotalRevenue,
  useGenerateInvoiceNumber,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useUpdateInvoiceStatus,
  useMarkInvoiceAsPaid,
  useMarkInvoiceAsSent,
  useMarkInvoiceAsOverdue,
  useCancelInvoice,
  useUpdatePaidAmount,
} from './useInvoices';
export type { InvoiceFilters } from './useInvoices';

// Payments
export {
  usePayments,
  usePayment,
  usePaymentsByInvoice,
  usePaymentWithInvoice,
  useRecentPayments,
  useTotalReceived,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from './usePayments';
export type { PaymentFilters } from './usePayments';

// Team
export {
  useTeamMembers,
  useActiveTeamMembers,
  useTeamMember,
  useTeamMembersByUser,
  useTeamMemberByStudioAndUser,
  useTeamMemberByEmail,
  useStudioOwner,
  useStudioAdmins,
  useSearchTeamMembers,
  useHasPermission,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useUpdateTeamMemberRole,
  useUpdateTeamMemberPermissions,
  useDeactivateTeamMember,
  useActivateTeamMember,
} from './useTeam';
export type { TeamFilters } from './useTeam';

// Statistics
export {
  useDashboardStats,
  useRevenueByPeriod,
  useTopClients,
  useSpaceUtilization,
  useBookingCountByStatus,
  useInvoiceSummary,
} from './useStats';
export type {
  DashboardStats,
  RevenueByPeriod,
  TopClient,
  SpaceUtilization,
} from './useStats';

// Spaces
export {
  useSpaces,
  useActiveSpaces,
  useSpace,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useToggleSpaceActive,
} from './useSpaces';
export type { SpaceFilters } from './useSpaces';

// Pricing
export {
  usePricingProducts,
  useActivePricingProducts,
  usePricingProductsByType,
  usePricingProduct,
  useCreatePricingProduct,
  useUpdatePricingProduct,
  useDeletePricingProduct,
  useTogglePricingProduct,
  useUpdatePricingSortOrder,
  pricingKeys,
} from './usePricing';

// Wallet
export {
  useClientWallet,
  useGetOrCreateWallet,
  useWallet,
  useStudioWallets,
  useWalletTransactions,
  useCreditWallet,
  useDebitWallet,
  useRefundWallet,
  useAdjustWallet,
  walletKeys,
} from './useWallet';

// Purchases
export {
  useClientPurchases,
  useStudioPurchases,
  useActiveClientPurchases,
  usePurchase,
  usePurchaseWithProduct,
  useCreatePurchase,
  useUpdatePurchase,
  useUseCredits,
  useCancelPurchase,
  useRefundPurchase,
  useActiveSubscriptions,
  useClientSubscriptions,
  useSubscription,
  useCreateSubscription,
  useCancelSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useStudioGiftCertificates,
  useGiftCertificateByCode,
  useCreateGiftCertificate,
  useRedeemGiftCertificate,
  purchaseKeys,
} from './usePurchases';

// Widget Config
export {
  useWidgetConfigs,
  useActiveWidgetConfigs,
  useWidgetConfigsByType,
  useWidgetConfig,
  useCreateWidgetConfig,
  useUpdateWidgetConfig,
  useUpdateWidgetTheme,
  useUpdateWidgetCustomCSS,
  useDeleteWidgetConfig,
  useDuplicateWidgetConfig,
  useToggleWidgetConfig,
  useIncrementEmbedCount,
  useUpdateAllowedDomains,
  useGenerateEmbedCode,
  widgetConfigKeys,
} from './useWidgetConfig';

// Packs (additional pack-specific hooks)
export {
  usePacks,
  usePacksByType,
  useActivePacks,
  usePack,
  usePackStats,
  useCreatePack,
  useUpdatePack,
  useDeletePack,
  useTogglePackActive,
  useTogglePackFeatured,
  useUpdatePackOrder,
  packQueryKeys,
  purchaseQueryKeys,
} from './usePacks';

// Push Notifications
export {
  usePushNotifications,
  CATEGORY_LABELS as PUSH_CATEGORY_LABELS,
} from './usePushNotifications';
export type {
  PushPermissionStatus,
  PushCategory,
  PushPreferences,
  PushNotificationPayload,
} from './usePushNotifications';

// Chat
export {
  // Conversation hooks
  useConversation,
  useConversationWithRelations,
  useStudioConversations,
  useActiveConversations,
  useWaitingConversations,
  useAssignedConversations,
  // Message hooks
  useMessages,
  useSendMessage,
  useSendMessageWithAI,
  useMarkMessagesRead,
  // Management hooks
  useCreateConversation,
  useEscalateToHuman,
  useAssignConversation,
  useUnassignConversation,
  useResolveConversation,
  useCloseConversation,
  useReopenConversation,
  useAddConversationTags,
  useRemoveConversationTags,
  useLinkConversationToClient,
  // Stats hooks
  useUnreadCount,
  useConversationCounts,
  useActiveConversationsCount,
  useWaitingForHumanCount,
  // Utility hooks
  useLiveChat,
  // Query keys
  chatQueryKeys,
} from './useChat';
