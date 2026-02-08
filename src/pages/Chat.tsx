import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
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
  Trash2,
  CheckCheck,
  Smartphone,
  Users,
  Zap,
  StickyNote,
  Settings,
  Eye,
  Lock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '../components/ui/Dropdown';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
import { useAuthStore } from '../stores/authStore';
import { useNotifications } from '../stores/uiStore';
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

// ==================== TYPES ====================

type ChannelType = 'email' | 'sms' | 'chat' | 'internal';
type PriorityLevel = 'haute' | 'normale' | 'basse';
type ChannelFilter = 'all' | ChannelType;
type StatusFilterType = 'unread' | 'assigned' | 'waiting' | 'resolved';
type InputMode = 'message' | 'note';

interface ExtendedConversation extends ChatConversation {
  channel?: ChannelType;
  priority?: PriorityLevel;
}

// ==================== CONSTANTS ====================

const statusLabels: Record<ConversationStatus, string> = {
  active: 'Actif',
  waiting_human: 'En attente',
  with_human: 'Assigne',
  resolved: 'Resolu',
  closed: 'Ferme',
};

const statusColors: Record<ConversationStatus, BadgeVariant> = {
  active: 'info',
  waiting_human: 'warning',
  with_human: 'info',
  resolved: 'success',
  closed: 'default',
};

const channelIcons: Record<ChannelType, typeof Mail> = {
  email: Mail,
  sms: Smartphone,
  chat: MessageCircle,
  internal: Users,
};

const channelLabels: Record<ChannelType, string> = {
  email: 'Email',
  sms: 'SMS',
  chat: 'Chat',
  internal: 'Interne',
};

const channelStyleMap: Record<ChannelType, string> = {
  email: styles.channelEmail,
  sms: styles.channelSms,
  chat: styles.channelChat,
  internal: styles.channelInternal,
};

const priorityStyleMap: Record<PriorityLevel, string> = {
  haute: styles.priorityHaute,
  normale: styles.priorityNormale,
  basse: styles.priorityBasse,
};

const QUICK_REPLIES = [
  'Bonjour ! Merci pour votre message. Je reviens vers vous rapidement.',
  'Votre reservation est confirmee pour le [date]. A bientot !',
  'Merci pour votre paiement. Votre facture est disponible dans votre espace.',
  'Notre studio est disponible aux horaires suivants : [horaires].',
  "N'hesitez pas a nous contacter pour toute question supplementaire.",
  'Nous vous remercions pour votre fidelite. Voici un code promo : MERCI10',
];

// ==================== HELPERS ====================

/** Assign channel and priority to raw conversations for demo display */
function enrichConversations(conversations: ChatConversation[]): ExtendedConversation[] {
  const channels: ChannelType[] = ['email', 'sms', 'chat', 'internal'];
  const priorities: PriorityLevel[] = ['haute', 'normale', 'normale', 'basse'];

  return conversations.map((conv, index) => ({
    ...conv,
    channel: channels[index % channels.length],
    priority: priorities[index % priorities.length],
  }));
}

// ==================== COMPONENT ====================

export function Chat() {
  const { studioId } = useAuthStore();
  const { info, warning } = useNotifications();

  // Selection state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);

  // Channel filter
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  // Status filters (multi-select)
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<StatusFilterType>>(new Set());

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('message');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickRepliesRef = useRef<HTMLDivElement>(null);

  // Data hooks
  const { data: conversationsData } = useStudioConversations(studioId || '');
  const rawConversations = useMemo(
    () => (conversationsData || []) as ChatConversation[],
    [conversationsData],
  );
  const conversations = useMemo(() => enrichConversations(rawConversations), [rawConversations]);

  const { data: selectedConversationData } = useConversation(selectedConversationId || '');
  const selectedConversation = selectedConversationData as
    | (ChatConversation & {
        messages?: Array<{
          id: string;
          sender_type: string;
          content: string;
          created_at: string;
          is_internal?: boolean;
          metadata?: Record<string, unknown>;
        }>;
      })
    | null;
  const sendMessage = useSendMessage();
  const resolveConversation = useResolveConversation();
  const assignConversation = useAssignConversation();

  // Find the enriched version of the selected conversation for channel/priority display
  const selectedExtended = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  // ==================== FILTERING ====================

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch =
        debouncedSearch === '' ||
        conv.visitor_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        conv.visitor_email?.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Channel filter
      const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;

      // Status filters (if none selected, show all)
      let matchesStatus = true;
      if (activeStatusFilters.size > 0) {
        const checks: boolean[] = [];
        if (activeStatusFilters.has('unread')) {
          checks.push(conv.unread_count > 0);
        }
        if (activeStatusFilters.has('assigned')) {
          checks.push(conv.status === 'with_human');
        }
        if (activeStatusFilters.has('waiting')) {
          checks.push(conv.status === 'waiting_human');
        }
        if (activeStatusFilters.has('resolved')) {
          checks.push(conv.status === 'resolved' || conv.status === 'closed');
        }
        matchesStatus = checks.some(Boolean);
      }

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [conversations, debouncedSearch, channelFilter, activeStatusFilters]);

  // ==================== STATS ====================

  const stats = useMemo(() => {
    const active = conversations.filter(
      (c) => c.status === 'active' || c.status === 'with_human',
    ).length;
    const waiting = conversations.filter((c) => c.status === 'waiting_human').length;
    const resolved = conversations.filter(
      (c) => c.status === 'resolved' || c.status === 'closed',
    ).length;
    return { active, waiting, resolved, total: conversations.length };
  }, [conversations]);

  // Channel counts
  const channelCounts = useMemo(() => {
    const counts: Record<ChannelType | 'all', number> = {
      all: conversations.length,
      email: 0,
      sms: 0,
      chat: 0,
      internal: 0,
    };
    conversations.forEach((conv) => {
      if (conv.channel) {
        counts[conv.channel]++;
      }
    });
    return counts;
  }, [conversations]);

  // ==================== EFFECTS ====================

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation]);

  // Close quick replies on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickRepliesRef.current && !quickRepliesRef.current.contains(event.target as Node)) {
        setShowQuickReplies(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==================== HANDLERS ====================

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        message: {
          sender_type: 'human',
          sender_id: studioId || undefined,
          content: inputMode === 'note' ? `[NOTE INTERNE] ${newMessage.trim()}` : newMessage.trim(),
          metadata: inputMode === 'note' ? { is_internal_note: true } : undefined,
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

  const toggleStatusFilter = useCallback((filter: StatusFilterType) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  const handleQuickReply = useCallback(
    (template: string) => {
      setNewMessage(template);
      setShowQuickReplies(false);
    },
    [],
  );

  const handleManageTemplates = useCallback(() => {
    info('Bientot disponible', 'La gestion des templates sera disponible prochainement.');
    setShowQuickReplies(false);
  }, [info]);

  // ==================== HELPERS (message detection) ====================

  const isInternalNote = (msg: { content: string; metadata?: Record<string, unknown> }): boolean => {
    return (
      msg.content.startsWith('[NOTE INTERNE]') ||
      (msg.metadata != null && 'is_internal_note' in msg.metadata && msg.metadata.is_internal_note === true)
    );
  };

  const getCleanContent = (msg: { content: string }): string => {
    return msg.content.replace(/^\[NOTE INTERNE\]\s*/, '');
  };

  // ==================== RENDER ====================

  return (
    <div className={styles.page}>
      <Header
        title="Boite de reception"
        subtitle="Gerez toutes vos conversations clients en un seul endroit"
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

              {/* Channel Tabs */}
              <div className={styles.channelTabs}>
                <button
                  className={`${styles.channelTab} ${channelFilter === 'all' ? styles.active : ''}`}
                  onClick={() => setChannelFilter('all')}
                >
                  Tous
                  <span className={styles.channelTabCount}>{channelCounts.all}</span>
                </button>
                {(Object.keys(channelLabels) as ChannelType[]).map((channel) => {
                  const Icon = channelIcons[channel];
                  return (
                    <button
                      key={channel}
                      className={`${styles.channelTab} ${channelFilter === channel ? styles.active : ''}`}
                      onClick={() => setChannelFilter(channel)}
                    >
                      <Icon size={14} />
                      {channelLabels[channel]}
                      <span className={styles.channelTabCount}>{channelCounts[channel]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Pills */}
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterBtn} ${activeStatusFilters.has('unread') ? styles.active : ''}`}
                  onClick={() => toggleStatusFilter('unread')}
                >
                  Non lu
                </button>
                <button
                  className={`${styles.filterBtn} ${activeStatusFilters.has('assigned') ? styles.active : ''}`}
                  onClick={() => toggleStatusFilter('assigned')}
                >
                  Assigne a moi
                </button>
                <button
                  className={`${styles.filterBtn} ${activeStatusFilters.has('waiting') ? styles.active : ''}`}
                  onClick={() => toggleStatusFilter('waiting')}
                >
                  <AlertCircle size={14} />
                  En attente
                </button>
                <button
                  className={`${styles.filterBtn} ${activeStatusFilters.has('resolved') ? styles.active : ''}`}
                  onClick={() => toggleStatusFilter('resolved')}
                >
                  Resolu
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
                    } ${conv.status === 'waiting_human' ? styles.urgent : ''}`}
                    onClick={() => setSelectedConversationId(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedConversationId(conv.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Priority Dot */}
                    {conv.priority && conv.priority !== 'normale' && (
                      <span
                        className={`${styles.priorityDot} ${priorityStyleMap[conv.priority]}`}
                      />
                    )}

                    <div className={styles.convAvatar}>
                      <User size={20} />
                      {/* Channel indicator badge */}
                      {conv.channel && (
                        <span
                          className={`${styles.channelIndicator} ${channelStyleMap[conv.channel]}`}
                        >
                          {(() => {
                            const ChIcon = channelIcons[conv.channel];
                            return <ChIcon size={10} />;
                          })()}
                        </span>
                      )}
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
                        {selectedExtended?.channel && (
                          <Badge variant="default" size="sm">
                            {channelLabels[selectedExtended.channel]}
                          </Badge>
                        )}
                        {selectedExtended?.priority && selectedExtended.priority !== 'normale' && (
                          <Badge
                            variant={selectedExtended.priority === 'haute' ? 'error' : 'default'}
                            size="sm"
                          >
                            {selectedExtended.priority === 'haute' ? 'Priorite haute' : 'Priorite basse'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.chatHeaderActions}>
                    {selectedConversation.status === 'waiting_human' && (
                      <Button size="sm" onClick={handleTakeOver}>
                        Prendre en charge
                      </Button>
                    )}
                    {selectedConversation.status !== 'resolved' &&
                      selectedConversation.status !== 'closed' && (
                        <Button size="sm" variant="ghost" onClick={handleResolve}>
                          <CheckCircle2 size={16} />
                          Resoudre
                        </Button>
                      )}
                    <Dropdown
                      trigger={
                        <Button size="sm" variant="ghost">
                          <MoreVertical size={16} />
                        </Button>
                      }
                      align="end"
                    >
                      <DropdownItem
                        icon={<CheckCheck size={16} />}
                        onClick={() => info('Conversation marquee comme lue')}
                      >
                        Marquer comme lu
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 size={16} />}
                        destructive
                        onClick={() =>
                          warning(
                            'Fonctionnalite bientot disponible',
                            'La suppression de conversations sera disponible prochainement',
                          )
                        }
                      >
                        Supprimer conversation
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>

                {/* Messages */}
                <div className={styles.messagesArea}>
                  {selectedConversation.messages?.map((msg) => {
                    const noteMsg = isInternalNote(msg);
                    const msgClass = noteMsg
                      ? styles.internalNoteMsg
                      : msg.sender_type === 'visitor'
                        ? styles.clientMsg
                        : styles.supportMsg;

                    return (
                      <div
                        key={msg.id}
                        className={`${styles.message} ${msgClass}`}
                      >
                        <div className={styles.msgAvatar}>
                          {noteMsg ? (
                            <StickyNote size={16} />
                          ) : msg.sender_type === 'ai' ? (
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
                              {noteMsg
                                ? 'Note interne'
                                : msg.sender_type === 'ai'
                                  ? 'YODA AI'
                                  : msg.sender_type === 'visitor'
                                    ? selectedConversation.visitor_name || 'Visiteur'
                                    : 'Support'}
                            </span>
                            <span className={styles.msgTime}>
                              {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {noteMsg && (
                            <span className={styles.internalNoteLabel}>
                              <Lock size={10} />
                              Note visible uniquement par l&apos;equipe
                            </span>
                          )}
                          <div className={styles.msgText}>
                            {noteMsg ? getCleanContent(msg) : msg.content}
                          </div>
                          {msg.metadata &&
                            typeof msg.metadata === 'object' &&
                            'space_name' in msg.metadata && (
                              <div className={styles.msgCard}>
                                <Calendar size={16} />
                                <div>
                                  <strong>Reservation proposee</strong>
                                  <p>
                                    {String(
                                      (msg.metadata as Record<string, unknown>).space_name,
                                    )}{' '}
                                    -{' '}
                                    {String(
                                      (msg.metadata as Record<string, unknown>).date || '',
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          {msg.metadata &&
                            typeof msg.metadata === 'object' &&
                            'pack_name' in msg.metadata && (
                              <div className={styles.msgCard}>
                                <Package size={16} />
                                <div>
                                  <strong>Pack suggere</strong>
                                  <p>
                                    {String(
                                      (msg.metadata as Record<string, unknown>).pack_name,
                                    )}{' '}
                                    -{' '}
                                    {String(
                                      (msg.metadata as Record<string, unknown>).price || '',
                                    )}
                                    $
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Wrapper */}
                <div className={styles.inputWrapper}>
                  {/* Input Mode Toggle */}
                  <div className={styles.inputModeBar}>
                    <div className={styles.inputModeToggle}>
                      <button
                        className={`${styles.inputModeBtn} ${inputMode === 'message' ? styles.active : ''}`}
                        onClick={() => setInputMode('message')}
                      >
                        <Send size={12} />
                        Message
                      </button>
                      <button
                        className={`${styles.inputModeBtn} ${inputMode === 'note' ? styles.activeNote : ''}`}
                        onClick={() => setInputMode('note')}
                      >
                        <StickyNote size={12} />
                        Note interne
                      </button>
                    </div>
                    {inputMode === 'note' && (
                      <span className={styles.internalNoteHint}>
                        <Eye size={12} />
                        Note visible uniquement par l&apos;equipe
                      </span>
                    )}
                  </div>

                  {/* Quick Replies */}
                  <div className={styles.quickRepliesBar}>
                    <div className={styles.quickRepliesDropdown} ref={quickRepliesRef}>
                      <button
                        className={styles.quickReplyBtn}
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                      >
                        <Zap size={14} />
                        Reponses rapides
                      </button>
                      {showQuickReplies && (
                        <div className={styles.quickRepliesMenu}>
                          <div className={styles.quickRepliesHeader}>
                            <span>Reponses rapides</span>
                          </div>
                          {QUICK_REPLIES.map((template, index) => (
                            <button
                              key={index}
                              className={styles.quickReplyItem}
                              onClick={() => handleQuickReply(template)}
                            >
                              {template}
                            </button>
                          ))}
                          <div className={styles.quickRepliesFooter}>
                            <button
                              className={styles.quickRepliesFooterBtn}
                              onClick={handleManageTemplates}
                            >
                              <Settings size={12} />
                              Gerer les templates
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div
                    className={`${styles.inputArea} ${inputMode === 'note' ? styles.noteMode : ''}`}
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        inputMode === 'note'
                          ? 'Ecrire une note interne...'
                          : 'Tapez votre message...'
                      }
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
                      {inputMode === 'note' ? <StickyNote size={18} /> : <Send size={18} />}
                    </Button>
                  </div>
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
