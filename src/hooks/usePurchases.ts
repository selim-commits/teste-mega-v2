import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '../services/purchases';
import type {
  ClientPurchaseInsert,
  ClientPurchaseUpdate,
  ClientSubscriptionInsert,
  GiftCertificateInsert,
} from '../services/purchases';

// Query keys for purchases
export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
  byClient: (clientId: string) => [...purchaseKeys.all, 'client', clientId] as const,
  byStudio: (studioId: string) => [...purchaseKeys.all, 'studio', studioId] as const,
  activeByClient: (clientId: string) => [...purchaseKeys.all, 'active', clientId] as const,
  subscriptions: {
    all: ['subscriptions'] as const,
    byClient: (clientId: string) => ['subscriptions', 'client', clientId] as const,
    active: (clientId: string) => ['subscriptions', 'active', clientId] as const,
    detail: (id: string) => ['subscriptions', 'detail', id] as const,
  },
  giftCertificates: {
    all: ['giftCertificates'] as const,
    byStudio: (studioId: string) => ['giftCertificates', 'studio', studioId] as const,
    byCode: (studioId: string, code: string) => ['giftCertificates', 'code', studioId, code] as const,
  },
};

// Get all purchases for a client
export function useClientPurchases(clientId: string) {
  return useQuery({
    queryKey: purchaseKeys.byClient(clientId),
    queryFn: () => purchaseService.getByClientId(clientId),
    enabled: !!clientId,
  });
}

// Get all purchases for a studio
export function useStudioPurchases(studioId: string) {
  return useQuery({
    queryKey: purchaseKeys.byStudio(studioId),
    queryFn: () => purchaseService.getByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get active purchases for a client
export function useActiveClientPurchases(clientId: string) {
  return useQuery({
    queryKey: purchaseKeys.activeByClient(clientId),
    queryFn: () => purchaseService.getActiveByClientId(clientId),
    enabled: !!clientId,
  });
}

// Get a single purchase by ID
export function usePurchase(id: string) {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: () => purchaseService.getById(id),
    enabled: !!id,
  });
}

// Get purchase with product details
export function usePurchaseWithProduct(id: string) {
  return useQuery({
    queryKey: [...purchaseKeys.detail(id), 'withProduct'],
    queryFn: () => purchaseService.getWithProduct(id),
    enabled: !!id,
  });
}

// Create purchase mutation
export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchase: ClientPurchaseInsert) => purchaseService.create(purchase),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.byClient(data.client_id) });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.byStudio(data.studio_id) });
    },
  });
}

// Update purchase mutation
export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientPurchaseUpdate }) =>
      purchaseService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables.id) });
    },
  });
}

// Use credits from purchase mutation
export function useUseCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      purchaseService.useCredits(id, credits),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.byClient(data.client_id) });
    },
  });
}

// Cancel purchase mutation
export function useCancelPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.cancel(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables) });
    },
  });
}

// Cancel and refund purchase mutation (uses cancel with refund logic)
export function useRefundPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.cancel(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(variables) });
    },
  });
}

// ==================== Subscriptions ====================

// Get active subscriptions for a client
export function useActiveSubscriptions(clientId: string) {
  return useQuery({
    queryKey: purchaseKeys.subscriptions.active(clientId),
    queryFn: () => purchaseService.getActiveSubscriptions(clientId),
    enabled: !!clientId,
  });
}

// Get all subscriptions for a client
export function useClientSubscriptions(clientId: string) {
  return useQuery({
    queryKey: purchaseKeys.subscriptions.byClient(clientId),
    queryFn: () => purchaseService.getSubscriptionsByClientId(clientId),
    enabled: !!clientId,
  });
}

// Get subscription by ID
export function useSubscription(id: string) {
  return useQuery({
    queryKey: purchaseKeys.subscriptions.detail(id),
    queryFn: () => purchaseService.getSubscriptionById(id),
    enabled: !!id,
  });
}

// Create subscription mutation
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscription: ClientSubscriptionInsert) =>
      purchaseService.createSubscription(subscription),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.byClient(data.client_id) });
    },
  });
}

// Cancel subscription mutation
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, immediate }: { id: string; immediate?: boolean }) =>
      purchaseService.cancelSubscription(id, immediate),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.byClient(data.client_id) });
    },
  });
}

// Pause subscription mutation
export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.pauseSubscription(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.detail(variables) });
    },
  });
}

// Resume subscription mutation
export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.resumeSubscription(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.subscriptions.detail(variables) });
    },
  });
}

// ==================== Gift Certificates ====================

// Get gift certificates for a studio
export function useStudioGiftCertificates(studioId: string) {
  return useQuery({
    queryKey: purchaseKeys.giftCertificates.byStudio(studioId),
    queryFn: () => purchaseService.getGiftCertificatesByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get gift certificate by code
export function useGiftCertificateByCode(studioId: string, code: string) {
  return useQuery({
    queryKey: purchaseKeys.giftCertificates.byCode(studioId, code),
    queryFn: () => purchaseService.getGiftCertificateByCode(studioId, code),
    enabled: !!studioId && !!code,
  });
}

// Create gift certificate mutation
export function useCreateGiftCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificate: GiftCertificateInsert) =>
      purchaseService.createGiftCertificate(certificate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.giftCertificates.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.giftCertificates.byStudio(data.studio_id) });
    },
  });
}

// Redeem gift certificate mutation
export function useRedeemGiftCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studioId,
      code,
      clientId,
    }: {
      studioId: string;
      code: string;
      clientId: string;
    }) => purchaseService.redeemGiftCertificate(studioId, code, clientId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.giftCertificates.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.giftCertificates.byStudio(data.studio_id) });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.giftCertificates.byCode(data.studio_id, data.gift_code) });
    },
  });
}
