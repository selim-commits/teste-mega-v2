import { supabase } from '../lib/supabase';
import type {
  ClientWallet,
  WalletTransaction,
  WalletTransactionType,
  Json
} from '../types/database';

// Re-export types for external use
export type { ClientWallet, WalletTransaction };
export type TransactionType = WalletTransactionType;

export const walletService = {
  // Get wallet by client and studio
  async getByClientId(clientId: string, studioId: string): Promise<ClientWallet | null> {
    const { data, error } = await supabase
      .from('client_wallets')
      .select('*')
      .eq('client_id', clientId)
      .eq('studio_id', studioId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as ClientWallet | null;
  },

  // Get or create wallet for a client
  async getOrCreate(clientId: string, studioId: string, creditsType: string = 'hours'): Promise<ClientWallet> {
    let wallet = await this.getByClientId(clientId, studioId);

    if (!wallet) {
      const { data, error } = await supabase
        .from('client_wallets')
        .insert({
          client_id: clientId,
          studio_id: studioId,
          credits_balance: 0,
          credits_type: creditsType,
        })
        .select()
        .single();
      if (error) throw error;
      wallet = data as ClientWallet;
    }

    return wallet;
  },

  // Get wallet by ID
  async getById(id: string): Promise<ClientWallet | null> {
    const { data, error } = await supabase
      .from('client_wallets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ClientWallet;
  },

  // Get all wallets for a studio
  async getByStudioId(studioId: string): Promise<ClientWallet[]> {
    const { data, error } = await supabase
      .from('client_wallets')
      .select('*')
      .eq('studio_id', studioId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as ClientWallet[]) || [];
  },

  // Get wallet transactions
  async getTransactions(walletId: string, limit: number = 50): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as WalletTransaction[]) || [];
  },

  // Credit wallet (add funds)
  async credit(
    walletId: string,
    amount: number,
    description: string,
    createdBy?: string,
    purchaseId?: string,
    bookingId?: string,
    metadata?: Json
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    if (amount <= 0) throw new Error('Credit amount must be positive');

    const wallet = await this.getById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const oldBalance = wallet.credits_balance;
    const newBalance = oldBalance + amount;
    const now = new Date().toISOString();

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('client_wallets')
      .update({
        credits_balance: newBalance,
        total_credits_purchased: wallet.total_credits_purchased + amount,
        updated_at: now,
      })
      .eq('id', walletId)
      .select()
      .single();
    if (walletError) throw walletError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        studio_id: wallet.studio_id,
        client_id: wallet.client_id,
        wallet_id: walletId,
        type: 'credit' as WalletTransactionType,
        amount,
        balance_before: oldBalance,
        balance_after: newBalance,
        description,
        purchase_id: purchaseId,
        booking_id: bookingId,
        created_by: createdBy,
        metadata: metadata || {},
      })
      .select()
      .single();
    if (txError) throw txError;

    return {
      wallet: updatedWallet as ClientWallet,
      transaction: transaction as WalletTransaction
    };
  },

  // Debit wallet (spend funds)
  async debit(
    walletId: string,
    amount: number,
    description: string,
    createdBy?: string,
    purchaseId?: string,
    bookingId?: string,
    metadata?: Json
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    if (amount <= 0) throw new Error('Debit amount must be positive');

    const wallet = await this.getById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.credits_balance < amount) {
      throw new Error('Insufficient balance');
    }

    const oldBalance = wallet.credits_balance;
    const newBalance = oldBalance - amount;
    const now = new Date().toISOString();

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('client_wallets')
      .update({
        credits_balance: newBalance,
        total_credits_used: wallet.total_credits_used + amount,
        updated_at: now,
      })
      .eq('id', walletId)
      .select()
      .single();
    if (walletError) throw walletError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        studio_id: wallet.studio_id,
        client_id: wallet.client_id,
        wallet_id: walletId,
        type: 'debit' as WalletTransactionType,
        amount,
        balance_before: oldBalance,
        balance_after: newBalance,
        description,
        purchase_id: purchaseId,
        booking_id: bookingId,
        created_by: createdBy,
        metadata: metadata || {},
      })
      .select()
      .single();
    if (txError) throw txError;

    return {
      wallet: updatedWallet as ClientWallet,
      transaction: transaction as WalletTransaction
    };
  },

  // Refund to wallet
  async refund(
    walletId: string,
    amount: number,
    description: string,
    createdBy?: string,
    purchaseId?: string,
    bookingId?: string,
    metadata?: Json
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    if (amount <= 0) throw new Error('Refund amount must be positive');

    const wallet = await this.getById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const oldBalance = wallet.credits_balance;
    const newBalance = oldBalance + amount;
    const now = new Date().toISOString();

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('client_wallets')
      .update({
        credits_balance: newBalance,
        updated_at: now,
      })
      .eq('id', walletId)
      .select()
      .single();
    if (walletError) throw walletError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        studio_id: wallet.studio_id,
        client_id: wallet.client_id,
        wallet_id: walletId,
        type: 'refund' as WalletTransactionType,
        amount,
        balance_before: oldBalance,
        balance_after: newBalance,
        description,
        purchase_id: purchaseId,
        booking_id: bookingId,
        created_by: createdBy,
        metadata: metadata || {},
      })
      .select()
      .single();
    if (txError) throw txError;

    return {
      wallet: updatedWallet as ClientWallet,
      transaction: transaction as WalletTransaction
    };
  },

  // Adjust wallet balance (admin function)
  async adjust(
    walletId: string,
    amount: number,
    description: string,
    createdBy: string,
    metadata?: Json
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    const wallet = await this.getById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const oldBalance = wallet.credits_balance;
    const newBalance = oldBalance + amount;
    if (newBalance < 0) throw new Error('Adjustment would result in negative balance');

    const now = new Date().toISOString();

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('client_wallets')
      .update({
        credits_balance: newBalance,
        updated_at: now,
      })
      .eq('id', walletId)
      .select()
      .single();
    if (walletError) throw walletError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        studio_id: wallet.studio_id,
        client_id: wallet.client_id,
        wallet_id: walletId,
        type: 'adjustment' as WalletTransactionType,
        amount: Math.abs(amount),
        balance_before: oldBalance,
        balance_after: newBalance,
        description,
        created_by: createdBy,
        metadata: metadata || {},
      })
      .select()
      .single();
    if (txError) throw txError;

    return {
      wallet: updatedWallet as ClientWallet,
      transaction: transaction as WalletTransaction
    };
  },

  // Get transaction by ID
  async getTransactionById(id: string): Promise<WalletTransaction | null> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as WalletTransaction;
  },

  // Alias for getOrCreate - Get or create wallet for a client
  async getWallet(clientId: string, studioId: string): Promise<ClientWallet> {
    return this.getOrCreate(clientId, studioId);
  },

  // Get current balance for a client at a studio
  async getBalance(clientId: string, studioId: string): Promise<number> {
    const wallet = await this.getOrCreate(clientId, studioId);
    return wallet.credits_balance;
  },

  // Credit hours to a wallet (alias for credit with purchase reference)
  async creditHours(
    walletId: string,
    hours: number,
    purchaseId: string | null,
    description: string
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    return this.credit(
      walletId,
      hours,
      description,
      undefined,
      purchaseId ? 'purchase' : undefined,
      purchaseId || undefined
    );
  },

  // Debit hours from a wallet (alias for debit with booking reference)
  async debitHours(
    walletId: string,
    hours: number,
    bookingId: string | null,
    description: string
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    return this.debit(
      walletId,
      hours,
      description,
      undefined,
      bookingId ? 'booking' : undefined,
      bookingId || undefined
    );
  },

  // Mark hours as expired
  async expireHours(
    walletId: string,
    hours: number,
    description: string
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    if (hours <= 0) throw new Error('Expiry amount must be positive');

    const wallet = await this.getById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    // Can't expire more than available
    const oldBalance = wallet.credits_balance;
    const hoursToExpire = Math.min(hours, oldBalance);
    const newBalance = oldBalance - hoursToExpire;
    const now = new Date().toISOString();

    // Update wallet balance
    const { data: updatedWallet, error: walletError } = await supabase
      .from('client_wallets')
      .update({
        credits_balance: newBalance,
        total_credits_expired: wallet.total_credits_expired + hoursToExpire,
        updated_at: now,
      })
      .eq('id', walletId)
      .select()
      .single();
    if (walletError) throw walletError;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        studio_id: wallet.studio_id,
        client_id: wallet.client_id,
        wallet_id: walletId,
        type: 'expire' as WalletTransactionType,
        amount: hoursToExpire,
        balance_before: oldBalance,
        balance_after: newBalance,
        description,
        metadata: {},
      })
      .select()
      .single();
    if (txError) throw txError;

    return {
      wallet: updatedWallet as ClientWallet,
      transaction: transaction as WalletTransaction
    };
  },

  // Alias for adjust - Manual balance adjustment
  async adjustBalance(
    walletId: string,
    hours: number,
    performedBy: string,
    description: string
  ): Promise<{ wallet: ClientWallet; transaction: WalletTransaction }> {
    return this.adjust(walletId, hours, description, performedBy);
  },
};
