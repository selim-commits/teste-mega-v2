// Base service
export { createBaseService } from './base';

// Domain services
export { studioService } from './studios';
export { settingsService } from './settings';
export type { StudioSettings } from './settings';
export { spaceService } from './spaces';
export type { SpaceFilters } from './spaces';
export { bookingService } from './bookings';
export type { BookingFilters } from './bookings';
export { clientService } from './clients';
export { equipmentService } from './equipment';
export { invoiceService } from './invoices';
export { paymentService } from './payments';
export type { PaymentFilters } from './payments';
export { teamService } from './team';

// Chat services
export { chatService } from './chatService';
export type {
  ConversationStatus,
  MessageSender,
  VisitorData,
  ChatMessage,
  ChatMessageInsert,
  ChatConversation,
  ChatConversationInsert,
  ChatConversationUpdate,
  ConversationFilters,
  ConversationWithMessages,
  ConversationWithRelations,
} from './chatService';

export { chatAIService } from './chatAIService';
export type {
  UserIntent,
  EscalationReason,
  StudioContext,
  AIResponse,
  AvailabilityResponse,
  PackResponse,
  PricingResponse,
  IntentResult,
} from './chatAIService';

// Widget configuration service
export { widgetConfigService } from './widgetConfig';
export type {
  WidgetType,
  WidgetTheme,
  WidgetConfig,
} from './widgetConfig';

// Pricing service
export { pricingService } from './pricing';
export type {
  PricingType,
  BillingInterval,
  PricingProduct,
  PricingProductInsert,
  PricingProductUpdate,
} from './pricing';

// Wallet service
export { walletService } from './wallet';
export type {
  TransactionType,
  ClientWallet,
  WalletTransaction,
} from './wallet';

// Purchases service
export { purchaseService } from './purchases';
export type {
  PurchaseStatus,
  SubscriptionStatus,
  ClientPurchase,
  ClientPurchaseInsert,
  ClientPurchaseUpdate,
  ClientSubscription,
  ClientSubscriptionInsert,
  GiftCertificate,
  GiftCertificateInsert,
} from './purchases';

// AI service
export { aiService, AI_SYSTEM_PROMPTS } from './ai';
export type {
  AIMessage,
  AIStreamOptions,
  AICompletionOptions,
} from './ai';
