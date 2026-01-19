import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
  type ConversationFilters,
  type ConversationWithMessages,
  type ConversationWithRelations,
  type VisitorData,
  type ChatMessageInsert,
  type ConversationStatus,
} from '../services/chatService';
import {
  chatAIService,
  type AIResponse,
  type StudioContext,
} from '../services/chatAIService';

// Extend query keys for chat
const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversationList: (studioId: string, filters?: ConversationFilters) =>
    [...chatQueryKeys.conversations(), 'list', studioId, filters] as const,
  conversationDetail: (id: string) =>
    [...chatQueryKeys.conversations(), 'detail', id] as const,
  conversationWithMessages: (id: string) =>
    [...chatQueryKeys.conversations(), 'withMessages', id] as const,
  messages: (conversationId: string) =>
    [...chatQueryKeys.all, 'messages', conversationId] as const,
  unreadCount: (studioId: string) =>
    [...chatQueryKeys.all, 'unread', studioId] as const,
  conversationCounts: (studioId: string) =>
    [...chatQueryKeys.all, 'counts', studioId] as const,
};

// ==================== CONVERSATION HOOKS ====================

/**
 * Subscribe to a single conversation with real-time updates
 */
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initial fetch
  const query = useQuery({
    queryKey: chatQueryKeys.conversationWithMessages(conversationId),
    queryFn: () => chatService.getConversationWithMessages(conversationId),
    enabled: !!conversationId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          // Update the conversation in cache
          queryClient.setQueryData<ConversationWithMessages>(
            chatQueryKeys.conversationWithMessages(conversationId),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                ...payload.new,
              } as ConversationWithMessages;
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add new message to cache
          queryClient.setQueryData<ConversationWithMessages>(
            chatQueryKeys.conversationWithMessages(conversationId),
            (old) => {
              if (!old) return old;
              const newMessage = payload.new as ChatMessage;
              // Avoid duplicates
              if (old.messages.some((m) => m.id === newMessage.id)) {
                return old;
              }
              return {
                ...old,
                messages: [...old.messages, newMessage],
                last_message_at: newMessage.created_at,
                last_message_preview: newMessage.content.substring(0, 100),
              };
            }
          );
        }
      )
      .subscribe();

    channelRef.current = conversationChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, queryClient]);

  return query;
}

/**
 * Get a conversation with relations (client, team member)
 */
export function useConversationWithRelations(conversationId: string) {
  return useQuery({
    queryKey: [...chatQueryKeys.conversationDetail(conversationId), 'relations'],
    queryFn: () => chatService.getConversationWithRelations(conversationId),
    enabled: !!conversationId,
  });
}

/**
 * Subscribe to conversations list for a studio with real-time updates
 */
export function useStudioConversations(
  studioId: string,
  filters?: Omit<ConversationFilters, 'studioId'>
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initial fetch
  const query = useQuery({
    queryKey: chatQueryKeys.conversationList(studioId, filters),
    queryFn: () => chatService.getConversationsByStudio(studioId, filters),
    enabled: !!studioId,
  });

  // Set up real-time subscription for conversation list
  useEffect(() => {
    if (!studioId) return;

    const channel = supabase
      .channel(`studio-conversations:${studioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `studio_id=eq.${studioId}`,
        },
        (payload) => {
          // Invalidate and refetch the list
          queryClient.invalidateQueries({
            queryKey: chatQueryKeys.conversationList(studioId, filters),
          });

          // Also update unread count
          queryClient.invalidateQueries({
            queryKey: chatQueryKeys.unreadCount(studioId),
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [studioId, filters, queryClient]);

  return query;
}

/**
 * Get active (not closed/resolved) conversations for a studio
 */
export function useActiveConversations(studioId: string) {
  return useStudioConversations(studioId, {
    status: ['active', 'waiting_for_human', 'assigned'],
  });
}

/**
 * Get conversations waiting for human response
 */
export function useWaitingConversations(studioId: string) {
  return useStudioConversations(studioId, {
    status: 'waiting_for_human',
  });
}

/**
 * Get conversations assigned to a specific team member
 */
export function useAssignedConversations(studioId: string, teamMemberId: string) {
  return useStudioConversations(studioId, {
    assignedTo: teamMemberId,
  });
}

// ==================== MESSAGE HOOKS ====================

/**
 * Get messages for a conversation with pagination
 */
export function useMessages(
  conversationId: string,
  options?: { limit?: number; before?: string }
) {
  return useQuery({
    queryKey: [...chatQueryKeys.messages(conversationId), options],
    queryFn: () =>
      chatService.getMessages(conversationId, options?.limit, options?.before),
    enabled: !!conversationId,
  });
}

/**
 * Send a message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: Omit<ChatMessageInsert, 'conversation_id'>;
    }) => {
      return chatService.sendMessage(conversationId, message);
    },
    onSuccess: (newMessage, variables) => {
      // Optimistically add the message to the cache
      queryClient.setQueryData<ConversationWithMessages>(
        chatQueryKeys.conversationWithMessages(variables.conversationId),
        (old) => {
          if (!old) return old;
          // Avoid duplicates
          if (old.messages.some((m) => m.id === newMessage.id)) {
            return old;
          }
          return {
            ...old,
            messages: [...old.messages, newMessage],
            last_message_at: newMessage.created_at,
            last_message_preview: newMessage.content.substring(0, 100),
          };
        }
      );

      // Invalidate conversation lists
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Send a message with AI response
 */
export function useSendMessageWithAI() {
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      studioContext,
      conversation,
      previousMessages,
    }: {
      conversationId: string;
      content: string;
      studioContext: StudioContext;
      conversation: ChatConversation;
      previousMessages?: ChatMessage[];
    }): Promise<{ userMessage: ChatMessage; aiResponse: AIResponse; aiMessage: ChatMessage }> => {
      // 1. Send the visitor message
      const userMessage = await chatService.sendMessage(conversationId, {
        sender_type: 'visitor',
        content,
      });

      // 2. Generate AI response
      const aiResponse = await chatAIService.generateResponse(
        conversation,
        content,
        studioContext,
        previousMessages
      );

      // 3. Send AI response as a message
      const aiMessage = await chatService.sendMessage(conversationId, {
        sender_type: 'ai',
        content: aiResponse.content,
        metadata: {
          intent: aiResponse.intent,
          confidence: aiResponse.confidence,
          suggestedActions: aiResponse.suggestedActions,
        },
      });

      // 4. If escalation needed, update conversation status
      if (aiResponse.shouldEscalate) {
        await chatService.escalateToHuman(
          conversationId,
          aiResponse.escalationReason || 'AI determined escalation needed'
        );
      }

      return { userMessage, aiResponse, aiMessage };
    },
    onSuccess: (result, variables) => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationWithMessages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      upToMessageId,
    }: {
      conversationId: string;
      upToMessageId?: string;
    }) => {
      if (upToMessageId) {
        return chatService.markMessagesRead(conversationId, upToMessageId);
      } else {
        return chatService.markAllMessagesRead(conversationId);
      }
    },
    onSuccess: (_, variables) => {
      // Update local cache
      queryClient.setQueryData<ConversationWithMessages>(
        chatQueryKeys.conversationWithMessages(variables.conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            unread_count: 0,
            messages: old.messages.map((m) => ({ ...m, is_read: true })),
          };
        }
      );

      // Invalidate unread counts
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'chat' &&
          (query.queryKey[1] === 'unread' || query.queryKey[1] === 'conversations'),
      });
    },
  });
}

// ==================== CONVERSATION MANAGEMENT HOOKS ====================

/**
 * Create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studioId,
      visitorData,
    }: {
      studioId: string;
      visitorData: VisitorData;
    }) => chatService.createConversation(studioId, visitorData),
    onSuccess: (newConversation) => {
      // Invalidate conversation lists for this studio
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationList(newConversation.studio_id),
      });
    },
  });
}

/**
 * Escalate conversation to human
 */
export function useEscalateToHuman() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      chatService.escalateToHuman(id, reason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Assign conversation to team member
 */
export function useAssignConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      teamMemberId,
    }: {
      conversationId: string;
      teamMemberId: string;
    }) => chatService.assignToTeamMember(conversationId, teamMemberId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Unassign conversation
 */
export function useUnassignConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      chatService.unassignConversation(conversationId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Resolve conversation
 */
export function useResolveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatService.resolveConversation(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Close conversation
 */
export function useCloseConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatService.closeConversation(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Reopen a closed/resolved conversation
 */
export function useReopenConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatService.reopenConversation(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Add tags to conversation
 */
export function useAddConversationTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      chatService.addTags(id, tags),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
    },
  });
}

/**
 * Remove tags from conversation
 */
export function useRemoveConversationTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      chatService.removeTags(id, tags),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
    },
  });
}

/**
 * Link conversation to a client
 */
export function useLinkConversationToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      clientId,
    }: {
      conversationId: string;
      clientId: string;
    }) => chatService.linkToClient(conversationId, clientId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversationDetail(updated.id),
      });
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
  });
}

// ==================== STATS & COUNTS HOOKS ====================

/**
 * Get unread count for a studio with real-time updates
 */
export function useUnreadCount(studioId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const query = useQuery({
    queryKey: chatQueryKeys.unreadCount(studioId),
    queryFn: () => chatService.getUnreadCount(studioId),
    enabled: !!studioId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Real-time subscription for unread count updates
  useEffect(() => {
    if (!studioId) return;

    const channel = supabase
      .channel(`unread:${studioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `studio_id=eq.${studioId}`,
        },
        () => {
          // Invalidate and refetch unread count
          queryClient.invalidateQueries({
            queryKey: chatQueryKeys.unreadCount(studioId),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          // Only invalidate if it's a visitor message (increases unread)
          const newMessage = payload.new as ChatMessage;
          if (newMessage.sender_type === 'visitor') {
            queryClient.invalidateQueries({
              queryKey: chatQueryKeys.unreadCount(studioId),
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [studioId, queryClient]);

  return query;
}

/**
 * Get conversation counts by status
 */
export function useConversationCounts(studioId: string) {
  return useQuery({
    queryKey: chatQueryKeys.conversationCounts(studioId),
    queryFn: () => chatService.getConversationCounts(studioId),
    enabled: !!studioId,
  });
}

/**
 * Get count of active conversations
 */
export function useActiveConversationsCount(studioId: string) {
  return useQuery({
    queryKey: [...chatQueryKeys.conversationCounts(studioId), 'active'],
    queryFn: () => chatService.getActiveConversationsCount(studioId),
    enabled: !!studioId,
  });
}

/**
 * Get count of conversations waiting for human
 */
export function useWaitingForHumanCount(studioId: string) {
  return useQuery({
    queryKey: [...chatQueryKeys.conversationCounts(studioId), 'waiting'],
    queryFn: () => chatService.getWaitingForHumanCount(studioId),
    enabled: !!studioId,
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Custom hook for managing a live chat session
 * Combines conversation, messages, and sending in one hook
 */
export function useLiveChat(conversationId: string, studioContext?: StudioContext) {
  const conversation = useConversation(conversationId);
  const sendMessage = useSendMessage();
  const sendWithAI = useSendMessageWithAI();
  const markRead = useMarkMessagesRead();

  // Auto-mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversation.data && conversation.data.unread_count > 0) {
      markRead.mutate({ conversationId });
    }
  }, [conversationId, conversation.data?.unread_count]);

  const send = useCallback(
    async (content: string, useAI: boolean = false) => {
      if (!conversation.data) return;

      if (useAI && studioContext) {
        return sendWithAI.mutateAsync({
          conversationId,
          content,
          studioContext,
          conversation: conversation.data,
          previousMessages: conversation.data.messages,
        });
      } else {
        return sendMessage.mutateAsync({
          conversationId,
          message: {
            sender_type: 'visitor',
            content,
          },
        });
      }
    },
    [conversationId, conversation.data, studioContext, sendMessage, sendWithAI]
  );

  const sendAsTeamMember = useCallback(
    async (content: string, teamMemberId: string) => {
      return sendMessage.mutateAsync({
        conversationId,
        message: {
          sender_type: 'team_member',
          sender_id: teamMemberId,
          content,
        },
      });
    },
    [conversationId, sendMessage]
  );

  return {
    conversation: conversation.data,
    messages: conversation.data?.messages || [],
    isLoading: conversation.isLoading,
    error: conversation.error,
    send,
    sendAsTeamMember,
    isSending: sendMessage.isPending || sendWithAI.isPending,
  };
}

// Export query keys for external use
export { chatQueryKeys };
