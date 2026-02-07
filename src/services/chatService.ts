import { supabase } from '../lib/supabase';
import type { Json } from '../types/database';

// Note: chatService uses custom types that don't match the DB schema exactly
// (e.g. 'waiting_for_human' vs DB's 'waiting_human'). Using `as any` until
// the local types are aligned with the generated DB types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Chat conversation status
export type ConversationStatus = 'active' | 'waiting_for_human' | 'assigned' | 'resolved' | 'closed';

// Message sender type
export type MessageSender = 'visitor' | 'ai' | 'team_member';

// Visitor data for starting a conversation
export interface VisitorData {
  name?: string;
  email?: string;
  phone?: string;
  clientId?: string; // If linked to existing client
  metadata?: Json;
}

// Chat message structure
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: MessageSender;
  sender_id: string | null; // team_member_id if human, null for AI/visitor
  content: string;
  metadata?: Json; // AI context, attachments, etc.
  is_read: boolean;
  created_at: string;
}

// Insert type for messages
export interface ChatMessageInsert {
  conversation_id: string;
  sender_type: MessageSender;
  sender_id?: string | null;
  content: string;
  metadata?: Json;
  is_read?: boolean;
}

// Conversation structure
export interface ChatConversation {
  id: string;
  studio_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  client_id: string | null;
  status: ConversationStatus;
  assigned_to: string | null; // team_member_id
  escalation_reason: string | null;
  ai_summary: string | null;
  tags: string[];
  metadata: Json;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// Insert type for conversations
export interface ChatConversationInsert {
  studio_id: string;
  visitor_name?: string | null;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  client_id?: string | null;
  status?: ConversationStatus;
  assigned_to?: string | null;
  metadata?: Json;
  tags?: string[];
}

// Update type for conversations
export interface ChatConversationUpdate {
  visitor_name?: string | null;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  client_id?: string | null;
  status?: ConversationStatus;
  assigned_to?: string | null;
  escalation_reason?: string | null;
  ai_summary?: string | null;
  tags?: string[];
  metadata?: Json;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
}

// Filters for listing conversations
export interface ConversationFilters {
  studioId?: string;
  status?: ConversationStatus | ConversationStatus[];
  assignedTo?: string;
  clientId?: string;
  hasUnread?: boolean;
  search?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

// Conversation with messages included
export interface ConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}

// Conversation with relations (client, assigned team member)
export interface ConversationWithRelations extends ChatConversation {
  client?: {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
  } | null;
  assigned_team_member?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export const chatService = {
  // ================== CONVERSATIONS ==================

  /**
   * Create a new chat conversation
   */
  async createConversation(
    studioId: string,
    visitorData: VisitorData
  ): Promise<ChatConversation> {
    const conversationData: ChatConversationInsert = {
      studio_id: studioId,
      visitor_name: visitorData.name || null,
      visitor_email: visitorData.email || null,
      visitor_phone: visitorData.phone || null,
      client_id: visitorData.clientId || null,
      status: 'active',
      metadata: visitorData.metadata || {},
      tags: [],
    };

    const { data, error } = await db
      .from('chat_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<ChatConversation | null> {
    const { data, error } = await db
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as ChatConversation;
  },

  /**
   * Get a conversation with all its messages
   */
  async getConversationWithMessages(id: string): Promise<ConversationWithMessages | null> {
    const { data, error } = await db
      .from('chat_conversations')
      .select(`
        *,
        messages:chat_messages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Sort messages by created_at
    if (data?.messages) {
      data.messages.sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return data as ConversationWithMessages;
  },

  /**
   * Get a conversation with related client and assigned team member
   */
  async getConversationWithRelations(id: string): Promise<ConversationWithRelations | null> {
    const { data, error } = await db
      .from('chat_conversations')
      .select(`
        *,
        client:clients(id, name, email, avatar_url),
        assigned_team_member:team_members!chat_conversations_assigned_to_fkey(id, name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ConversationWithRelations;
  },

  /**
   * Get conversations for a studio with filters
   */
  async getConversationsByStudio(
    studioId: string,
    filters?: Omit<ConversationFilters, 'studioId'>
  ): Promise<ConversationWithRelations[]> {
    let query = db
      .from('chat_conversations')
      .select(`
        *,
        client:clients(id, name, email, avatar_url),
        assigned_team_member:team_members!chat_conversations_assigned_to_fkey(id, name, avatar_url)
      `)
      .eq('studio_id', studioId);

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.hasUnread) {
      query = query.gt('unread_count', 0);
    }

    if (filters?.search) {
      query = query.or(
        `visitor_name.ilike.%${filters.search}%,visitor_email.ilike.%${filters.search}%,last_message_preview.ilike.%${filters.search}%`
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Order by last message (most recent first)
    query = query.order('last_message_at', { ascending: false, nullsFirst: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as ConversationWithRelations[]) || [];
  },

  /**
   * Update a conversation
   */
  async updateConversation(
    id: string,
    updates: ChatConversationUpdate
  ): Promise<ChatConversation> {
    const { data, error } = await db
      .from('chat_conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  /**
   * Escalate conversation to human support
   */
  async escalateToHuman(id: string, reason: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'waiting_for_human',
      escalation_reason: reason,
    });
  },

  /**
   * Assign conversation to a team member
   */
  async assignToTeamMember(
    id: string,
    teamMemberId: string
  ): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'assigned',
      assigned_to: teamMemberId,
    });
  },

  /**
   * Unassign conversation
   */
  async unassignConversation(id: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'waiting_for_human',
      assigned_to: null,
    });
  },

  /**
   * Mark conversation as resolved
   */
  async resolveConversation(id: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'resolved',
    });
  },

  /**
   * Close conversation
   */
  async closeConversation(id: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'closed',
    });
  },

  /**
   * Reopen a closed/resolved conversation
   */
  async reopenConversation(id: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      status: 'active',
      escalation_reason: null,
    });
  },

  /**
   * Update AI summary for a conversation
   */
  async updateAISummary(id: string, summary: string): Promise<ChatConversation> {
    return this.updateConversation(id, {
      ai_summary: summary,
    });
  },

  /**
   * Add tags to a conversation
   */
  async addTags(id: string, tags: string[]): Promise<ChatConversation> {
    const conversation = await this.getConversation(id);
    if (!conversation) throw new Error('Conversation not found');

    const existingTags = conversation.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return this.updateConversation(id, { tags: newTags });
  },

  /**
   * Remove tags from a conversation
   */
  async removeTags(id: string, tagsToRemove: string[]): Promise<ChatConversation> {
    const conversation = await this.getConversation(id);
    if (!conversation) throw new Error('Conversation not found');

    const newTags = (conversation.tags || []).filter(
      (tag) => !tagsToRemove.includes(tag)
    );

    return this.updateConversation(id, { tags: newTags });
  },

  /**
   * Link conversation to a client
   */
  async linkToClient(id: string, clientId: string): Promise<ChatConversation> {
    return this.updateConversation(id, { client_id: clientId });
  },

  // ================== MESSAGES ==================

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessageInsert, 'conversation_id'>
  ): Promise<ChatMessage> {
    const messageData: ChatMessageInsert = {
      conversation_id: conversationId,
      sender_type: message.sender_type,
      sender_id: message.sender_id || null,
      content: message.content,
      metadata: message.metadata || {},
      is_read: message.sender_type !== 'visitor', // Mark non-visitor messages as read
    };

    const { data, error } = await db
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last message info
    const preview = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');

    // For visitor messages, increment unread count
    if (message.sender_type === 'visitor') {
      // Get current unread count and increment
      const { data: conv } = await db
        .from('chat_conversations')
        .select('unread_count')
        .eq('id', conversationId)
        .single();

      await db
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: preview,
          updated_at: new Date().toISOString(),
          unread_count: (conv?.unread_count || 0) + 1,
        })
        .eq('id', conversationId);
    } else {
      await db
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: preview,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    }

    return data as ChatMessage;
  },

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string // cursor: message ID to fetch before
  ): Promise<ChatMessage[]> {
    let query = db
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      // Get the timestamp of the cursor message
      const { data: cursorMessage } = await db
        .from('chat_messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (cursorMessage) {
        query = query.lt('created_at', cursorMessage.created_at);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    // Reverse to get chronological order
    return ((data as ChatMessage[]) || []).reverse();
  },

  /**
   * Mark messages as read up to a specific message
   */
  async markMessagesRead(
    conversationId: string,
    upToMessageId: string
  ): Promise<void> {
    // Get the timestamp of the target message
    const { data: targetMessage, error: fetchError } = await db
      .from('chat_messages')
      .select('created_at')
      .eq('id', upToMessageId)
      .single();

    if (fetchError) throw fetchError;

    // Mark all messages up to this point as read
    const { error: updateError } = await db
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .lte('created_at', targetMessage.created_at)
      .eq('is_read', false);

    if (updateError) throw updateError;

    // Reset unread count on conversation
    await db
      .from('chat_conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  },

  /**
   * Mark all messages in a conversation as read
   */
  async markAllMessagesRead(conversationId: string): Promise<void> {
    const { error: updateError } = await db
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false);

    if (updateError) throw updateError;

    await db
      .from('chat_conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  },

  /**
   * Get a single message by ID
   */
  async getMessage(id: string): Promise<ChatMessage | null> {
    const { data, error } = await db
      .from('chat_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ChatMessage;
  },

  // ================== STATS & COUNTS ==================

  /**
   * Get unread count for a studio
   */
  async getUnreadCount(studioId: string): Promise<number> {
    const { data, error } = await db
      .from('chat_conversations')
      .select('unread_count')
      .eq('studio_id', studioId)
      .not('status', 'in', '("closed","resolved")');

    if (error) throw error;

    return (data || []).reduce(
      (sum: number, conv: { unread_count: number }) => sum + (conv.unread_count || 0),
      0
    );
  },

  /**
   * Get conversation counts by status for a studio
   */
  async getConversationCounts(
    studioId: string
  ): Promise<Record<ConversationStatus, number>> {
    const { data, error } = await db
      .from('chat_conversations')
      .select('status')
      .eq('studio_id', studioId);

    if (error) throw error;

    const counts: Record<ConversationStatus, number> = {
      active: 0,
      waiting_for_human: 0,
      assigned: 0,
      resolved: 0,
      closed: 0,
    };

    (data || []).forEach((conv: { status: ConversationStatus }) => {
      counts[conv.status]++;
    });

    return counts;
  },

  /**
   * Get active conversations count (not resolved/closed)
   */
  async getActiveConversationsCount(studioId: string): Promise<number> {
    const { count, error } = await db
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .not('status', 'in', '("closed","resolved")');

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get conversations waiting for human response
   */
  async getWaitingForHumanCount(studioId: string): Promise<number> {
    const { count, error } = await db
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'waiting_for_human');

    if (error) throw error;
    return count || 0;
  },
};
