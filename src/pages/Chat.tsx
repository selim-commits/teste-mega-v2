import { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Search,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Mail,
  Calendar,
  Package,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
import { useAuthStore } from '../stores/authStore';
import {
  useStudioConversations,
  useSendMessage,
  useConversation,
  useResolveConversation,
  useAssignConversation,
} from '../hooks/useChat';
import type {
  ChatConversation,
  ConversationStatus,
} from '../services/chatService';

import styles from './Chat.module.css';

const statusLabels: Record<ConversationStatus, string> = {
  active: 'Actif',
  waiting_for_human: 'En attente',
  assigned: 'Assigne',
  resolved: 'Resolu',
  closed: 'Ferme',
};

const statusColors: Record<ConversationStatus, BadgeVariant> = {
  active: 'info',
  waiting_for_human: 'warning',
  assigned: 'info',
  resolved: 'success',
  closed: 'default',
};

export function Chat() {
  const { studioId } = useAuthStore();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useStudioConversations(studioId || '');
  const conversations = (conversationsData || []) as ChatConversation[];
  const { data: selectedConversationData } = useConversation(selectedConversationId || '');
  const selectedConversation = selectedConversationData as (ChatConversation & { messages?: Array<{ id: string; sender_type: string; content: string; created_at: string; metadata?: Record<string, unknown> }> }) | null;
  const sendMessage = useSendMessage();
  const resolveConversation = useResolveConversation();
  const assignConversation = useAssignConversation();

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch =
        searchQuery === '' ||
        conv.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = conversations.filter((c) => c.status === 'active' || c.status === 'assigned').length;
    const waiting = conversations.filter((c) => c.status === 'waiting_for_human').length;
    const resolved = conversations.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
    return { active, waiting, resolved, total: conversations.length };
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        message: {
          sender_type: 'team_member',
          sender_id: studioId || undefined,
          content: newMessage.trim(),
        },
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleResolve = async () => {
    if (!selectedConversationId || !studioId) return;
    await resolveConversation.mutateAsync(selectedConversationId);
  };

  const handleTakeOver = async () => {
    if (!selectedConversationId || !studioId) return;
    await assignConversation.mutateAsync({
      conversationId: selectedConversationId,
      teamMemberId: studioId,
    });
  };

  return (
    <div className={styles.page}>
      <Header
        title="Conversations"
        subtitle="Gerez vos conversations clients et chatbot"
      />

      <div className={styles.content}>
        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <Card className={styles.statCard}>
            <MessageCircle size={20} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </Card>
          <Card className={`${styles.statCard} ${styles.active}`}>
            <Bot size={20} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.active}</span>
              <span className={styles.statLabel}>Actives</span>
            </div>
          </Card>
          <Card className={`${styles.statCard} ${styles.waiting}`}>
            <AlertCircle size={20} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.waiting}</span>
              <span className={styles.statLabel}>En attente</span>
            </div>
          </Card>
          <Card className={`${styles.statCard} ${styles.resolved}`}>
            <CheckCircle2 size={20} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.resolved}</span>
              <span className={styles.statLabel}>Resolues</span>
            </div>
          </Card>
        </div>

        <div className={styles.layout}>
          {/* Conversations List */}
          <Card className={styles.conversationsList}>
            <div className={styles.listHeader}>
              <div className={styles.searchBar}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.active : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Tous
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'waiting_for_human' ? styles.active : ''}`}
                  onClick={() => setStatusFilter('waiting_for_human')}
                >
                  <AlertCircle size={14} />
                  En attente
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'active' ? styles.active : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  Actives
                </button>
              </div>
            </div>

            <div className={styles.listContent}>
              {filteredConversations.length === 0 ? (
                <div className={styles.emptyList}>
                  <MessageCircle size={48} strokeWidth={1} />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`${styles.conversationItem} ${
                      selectedConversationId === conv.id ? styles.selected : ''
                    } ${conv.status === 'waiting_for_human' ? styles.urgent : ''}`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <div className={styles.convAvatar}>
                      <User size={20} />
                    </div>
                    <div className={styles.convInfo}>
                      <div className={styles.convHeader}>
                        <span className={styles.convName}>
                          {conv.visitor_name || 'Visiteur'}
                        </span>
                        <span className={styles.convTime}>
                          {formatDistanceToNow(new Date(conv.updated_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className={styles.convPreview}>
                        {conv.last_message_preview || 'Nouvelle conversation'}
                      </div>
                      <div className={styles.convMeta}>
                        <Badge variant={statusColors[conv.status]} size="sm">
                          {statusLabels[conv.status]}
                        </Badge>
                        {conv.unread_count > 0 && (
                          <span className={styles.unreadBadge}>{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className={styles.chatArea}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderInfo}>
                    <div className={styles.chatAvatar}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3>{selectedConversation.visitor_name || 'Visiteur'}</h3>
                      <div className={styles.chatHeaderMeta}>
                        {selectedConversation.visitor_email && (
                          <span>
                            <Mail size={12} />
                            {selectedConversation.visitor_email}
                          </span>
                        )}
                        <Badge variant={statusColors[selectedConversation.status]} size="sm">
                          {statusLabels[selectedConversation.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={styles.chatHeaderActions}>
                    {selectedConversation.status === 'waiting_for_human' && (
                      <Button size="sm" onClick={handleTakeOver}>
                        Prendre en charge
                      </Button>
                    )}
                    {selectedConversation.status !== 'resolved' && selectedConversation.status !== 'closed' && (
                      <Button size="sm" variant="ghost" onClick={handleResolve}>
                        <CheckCircle2 size={16} />
                        Resoudre
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className={styles.messagesArea}>
                  {selectedConversation.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.message} ${
                        msg.sender_type === 'visitor' ? styles.clientMsg : styles.supportMsg
                      }`}
                    >
                      <div className={styles.msgAvatar}>
                        {msg.sender_type === 'ai' ? (
                          <Bot size={16} />
                        ) : msg.sender_type === 'visitor' ? (
                          <User size={16} />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className={styles.msgContent}>
                        <div className={styles.msgHeader}>
                          <span className={styles.msgSender}>
                            {msg.sender_type === 'ai'
                              ? 'YODA AI'
                              : msg.sender_type === 'visitor'
                              ? selectedConversation.visitor_name || 'Visiteur'
                              : 'Support'}
                          </span>
                          <span className={styles.msgTime}>
                            {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <div className={styles.msgText}>{msg.content}</div>
                        {msg.metadata && typeof msg.metadata === 'object' && 'space_name' in msg.metadata && (
                          <div className={styles.msgCard}>
                            <Calendar size={16} />
                            <div>
                              <strong>Reservation proposee</strong>
                              <p>{String((msg.metadata as Record<string, unknown>).space_name)} - {String((msg.metadata as Record<string, unknown>).date || '')}</p>
                            </div>
                          </div>
                        )}
                        {msg.metadata && typeof msg.metadata === 'object' && 'pack_name' in msg.metadata && (
                          <div className={styles.msgCard}>
                            <Package size={16} />
                            <div>
                              <strong>Pack suggere</strong>
                              <p>{String((msg.metadata as Record<string, unknown>).pack_name)} - {String((msg.metadata as Record<string, unknown>).price || '')}$</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={styles.inputArea}>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                <MessageCircle size={64} strokeWidth={1} />
                <h3>Selectionnez une conversation</h3>
                <p>Choisissez une conversation dans la liste pour voir les messages</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
