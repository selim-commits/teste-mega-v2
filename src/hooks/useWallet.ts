import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/wallet';
import type { Json } from '../types/database';

// Query keys for wallets
export const walletKeys = {
  all: ['wallets'] as const,
  lists: () => [...walletKeys.all, 'list'] as const,
  details: () => [...walletKeys.all, 'detail'] as const,
  detail: (id: string) => [...walletKeys.details(), id] as const,
  byClient: (clientId: string, studioId: string) => [...walletKeys.all, 'client', clientId, studioId] as const,
  byStudio: (studioId: string) => [...walletKeys.all, 'studio', studioId] as const,
  transactions: (walletId: string) => [...walletKeys.all, 'transactions', walletId] as const,
};

// Get wallet for a client
export function useClientWallet(clientId: string, studioId: string) {
  return useQuery({
    queryKey: walletKeys.byClient(clientId, studioId),
    queryFn: () => walletService.getByClientId(clientId, studioId),
    enabled: !!clientId && !!studioId,
  });
}

// Get or create wallet for a client
export function useGetOrCreateWallet(clientId: string, studioId: string, currency?: string) {
  return useQuery({
    queryKey: [...walletKeys.byClient(clientId, studioId), 'getOrCreate'],
    queryFn: () => walletService.getOrCreate(clientId, studioId, currency),
    enabled: !!clientId && !!studioId,
  });
}

// Get wallet by ID
export function useWallet(id: string) {
  return useQuery({
    queryKey: walletKeys.detail(id),
    queryFn: () => walletService.getById(id),
    enabled: !!id,
  });
}

// Get all wallets for a studio
export function useStudioWallets(studioId: string) {
  return useQuery({
    queryKey: walletKeys.byStudio(studioId),
    queryFn: () => walletService.getByStudioId(studioId),
    enabled: !!studioId,
  });
}

// Get wallet transactions
export function useWalletTransactions(walletId: string, limit: number = 50) {
  return useQuery({
    queryKey: [...walletKeys.transactions(walletId), limit],
    queryFn: () => walletService.getTransactions(walletId, limit),
    enabled: !!walletId,
  });
}

// Credit wallet mutation
export function useCreditWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      amount,
      description,
      createdBy,
      referenceType,
      referenceId,
      metadata,
    }: {
      walletId: string;
      amount: number;
      description: string;
      createdBy?: string;
      referenceType?: string;
      referenceId?: string;
      metadata?: Json;
    }) => walletService.credit(walletId, amount, description, createdBy, referenceType, referenceId, metadata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(data.wallet.id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(data.wallet.id) });
    },
  });
}

// Debit wallet mutation
export function useDebitWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      amount,
      description,
      createdBy,
      referenceType,
      referenceId,
      metadata,
    }: {
      walletId: string;
      amount: number;
      description: string;
      createdBy?: string;
      referenceType?: string;
      referenceId?: string;
      metadata?: Json;
    }) => walletService.debit(walletId, amount, description, createdBy, referenceType, referenceId, metadata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(data.wallet.id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(data.wallet.id) });
    },
  });
}

// Refund to wallet mutation
export function useRefundWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      amount,
      description,
      createdBy,
      referenceType,
      referenceId,
      metadata,
    }: {
      walletId: string;
      amount: number;
      description: string;
      createdBy?: string;
      referenceType?: string;
      referenceId?: string;
      metadata?: Json;
    }) => walletService.refund(walletId, amount, description, createdBy, referenceType, referenceId, metadata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(data.wallet.id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(data.wallet.id) });
    },
  });
}

// Adjust wallet balance mutation
export function useAdjustWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      amount,
      description,
      createdBy,
      metadata,
    }: {
      walletId: string;
      amount: number;
      description: string;
      createdBy: string;
      metadata?: Json;
    }) => walletService.adjust(walletId, amount, description, createdBy, metadata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(data.wallet.id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(data.wallet.id) });
    },
  });
}
