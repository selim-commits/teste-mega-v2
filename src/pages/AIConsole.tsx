import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Brain,
  Zap,
  Heart,
  Shield,
  Plus,
  MessageSquare,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { supabase, isDemoMode } from '../lib/supabase';
import styles from './AIConsole.module.css';

// Studio ID for now (will be dynamic later)
const STUDIO_ID = '11111111-1111-1111-1111-111111111111';

// Agent definitions
type AgentId = 'yoda' | 'nexus' | 'nova' | 'sentinel';

interface Agent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  welcomeMessage: string;
  quickQuestions: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  agent: AgentId;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const agents: Agent[] = [
  {
    id: 'yoda',
    name: 'YODA',
    role: 'Analytics & Insights',
    description: 'Data analysis, reports, KPIs, and business intelligence',
    icon: Brain,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    welcomeMessage: "Greetings! YODA, I am. Deep insights into your studio's performance, I can provide. Revenue trends, client behavior patterns, and optimization opportunities - analyze them all, I shall. What wisdom do you seek today?",
    quickQuestions: [
      'What are my revenue trends this month?',
      'Which services are most profitable?',
      'Show me client retention analytics',
      'What are my peak booking hours?',
    ],
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'Automation',
    description: 'Workflows, automations, integrations, and system optimization',
    icon: Zap,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    welcomeMessage: "Hello! I'm NEXUS, your automation specialist. I can help you streamline operations, set up automated workflows, and optimize your studio's efficiency. From booking reminders to invoice automation - let's make your studio run smoother. What would you like to automate?",
    quickQuestions: [
      'Set up automatic booking confirmations',
      'Create a follow-up reminder workflow',
      'Automate invoice generation',
      'Configure equipment maintenance alerts',
    ],
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'Client Success',
    description: 'Client relationships, communications, and satisfaction',
    icon: Heart,
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    welcomeMessage: "Hi there! I'm NOVA, dedicated to helping you build amazing client relationships. I can assist with personalized communications, follow-ups, feedback collection, and ensuring every client has a stellar experience. How can I help you delight your clients today?",
    quickQuestions: [
      'Draft a thank you email for recent clients',
      'Which clients need follow-up?',
      'Show client satisfaction scores',
      'Suggest loyalty program ideas',
    ],
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'Security',
    description: 'Access control, monitoring, compliance, and data protection',
    icon: Shield,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    welcomeMessage: "Greetings. I'm SENTINEL, your security guardian. I monitor system access, protect sensitive data, ensure compliance, and keep your studio operations secure. From access logs to security recommendations - I've got you covered. What security concerns can I address?",
    quickQuestions: [
      'Review recent access logs',
      'Check data backup status',
      'Audit user permissions',
      'Show security recommendations',
    ],
  },
];

// Mock AI responses based on agent and context
const getMockResponse = (agentId: AgentId, userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  const responses: Record<AgentId, Record<string, string>> = {
    yoda: {
      revenue: "Analyzing your revenue data, I have been. **This month's performance:**\n\n- Total Revenue: **$12,450** (+18% vs last month)\n- Average booking value: **$285**\n- Highest revenue day: Tuesday\n\nStrong momentum, you have. Continue this path, you should.",
      clients: "Examined your client data, I have. **Key insights:**\n\n- Active clients: **156**\n- New clients this month: **23**\n- Retention rate: **78%**\n- VIP clients: **12**\n\nNurture relationships, you must. Loyal clients, the foundation of success they are.",
      services: "Your services analyzed, I have:\n\n1. **Portrait Sessions** - 45% of bookings\n2. **Product Photography** - 28% of bookings\n3. **Event Coverage** - 18% of bookings\n4. **Video Production** - 9% of bookings\n\nDiversify offerings, consider you should.",
      default: "Hmm, interesting question this is. Analyze your studio data, I shall. Patterns emerging, I see. What specific metrics interest you - revenue, clients, or services?",
    },
    nexus: {
      booking: "I can set up an **automated booking confirmation system** for you:\n\n1. Instant email confirmation on booking\n2. SMS reminder 24 hours before\n3. Calendar invite attachment\n4. Preparation checklist included\n\nWant me to configure this workflow?",
      reminder: "Here's a **follow-up reminder workflow** I recommend:\n\n- **Day 1**: Thank you email with photos preview\n- **Day 3**: Full gallery delivery notification\n- **Day 7**: Feedback request\n- **Day 30**: Re-booking incentive\n\nShall I activate this automation?",
      invoice: "I can automate your **invoice generation**:\n\n- Auto-create invoice on booking completion\n- Apply correct tax rates automatically\n- Send payment reminders at 3, 7, 14 days\n- Mark as paid when payment received\n\nThis could save you 5+ hours per week!",
      default: "I'm ready to help automate your studio operations. I can set up workflows for bookings, communications, invoicing, and equipment management. What process would you like to streamline?",
    },
    nova: {
      email: "Here's a **personalized thank you template** I've drafted:\n\n---\n*Dear [Client Name],*\n\n*Thank you for choosing our studio! It was a pleasure working with you on your [session type].*\n\n*Your gallery will be ready within [X] days. We can't wait to share the results!*\n\n*Warmly,*\n*[Your Studio]*\n\n---\nWant me to personalize this further?",
      followup: "I've identified **8 clients** who need follow-up:\n\n- **Sarah Chen** - Awaiting gallery delivery (2 days overdue)\n- **TechCorp** - Payment pending\n- **The Johnsons** - No feedback received\n- **5 others** - Re-booking window open\n\nShall I draft messages for each?",
      satisfaction: "Here's your **client satisfaction overview**:\n\n- Overall rating: **4.8/5** stars\n- Response rate: **72%**\n- Net Promoter Score: **+65**\n\n**Top feedback themes:**\n- \"Professional and friendly\"\n- \"Beautiful results\"\n- \"Easy booking process\"",
      default: "I'm here to help you create amazing client experiences! I can assist with personalized communications, track satisfaction, manage follow-ups, and suggest ways to increase client loyalty. What would you like to focus on?",
    },
    sentinel: {
      access: "Here's your **recent access log summary**:\n\n- Total logins today: **12**\n- Unique users: **4**\n- Failed attempts: **0**\n- Unusual activity: **None detected**\n\nAll access patterns appear normal. Your studio is secure.",
      backup: "**Backup Status Report:**\n\n- Last backup: **2 hours ago**\n- Backup frequency: **Every 6 hours**\n- Storage used: **45.2 GB / 100 GB**\n- Recovery point: **Ready**\n\nAll systems operational. Your data is protected.",
      permissions: "**User Permission Audit:**\n\n| User | Role | Last Active |\n|------|------|-------------|\n| Admin | Owner | Today |\n| Sarah | Manager | Today |\n| Mike | Staff | Yesterday |\n| Guest | Viewer | 3 days ago |\n\nNo permission anomalies detected.",
      default: "I'm monitoring your studio's security 24/7. I can review access logs, check backup status, audit permissions, and provide security recommendations. What security aspect would you like me to examine?",
    },
  };

  const agentResponses = responses[agentId];

  // Find matching response based on keywords
  for (const [key, response] of Object.entries(agentResponses)) {
    if (key !== 'default' && lowerMessage.includes(key)) {
      return response;
    }
  }

  return agentResponses.default;
};

// Generate title from first message
const generateTitle = (message: string): string => {
  const words = message.split(' ').slice(0, 5).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
};

// Simple markdown renderer
const renderMarkdown = (text: string): React.ReactElement => {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, index) => {
        // Bold text
        let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic text
        processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Inline code
        processedLine = processedLine.replace(/`(.+?)`/g, '<code>$1</code>');

        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={index} className={styles.markdownH4}>{line.substring(4)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={index} className={styles.markdownH3}>{line.substring(3)}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={index} className={styles.markdownH2}>{line.substring(2)}</h2>;
        }

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div
              key={index}
              className={styles.listItem}
              dangerouslySetInnerHTML={{ __html: '&bull; ' + processedLine.substring(2) }}
            />
          );
        }

        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            <div
              key={index}
              className={styles.listItem}
              dangerouslySetInnerHTML={{ __html: numberedMatch[1] + '. ' + processedLine.substring(numberedMatch[0].indexOf(' ') + 1) }}
            />
          );
        }

        // Horizontal rule
        if (line === '---') {
          return <hr key={index} className={styles.markdownHr} />;
        }

        // Empty line
        if (line.trim() === '') {
          return <div key={index} className={styles.emptyLine} />;
        }

        // Regular paragraph
        return (
          <p
            key={index}
            className={styles.markdownP}
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        );
      })}
    </>
  );
};

export function AIConsole() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('yoda');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = agents.find((a) => a.id === selectedAgent)!;
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const agentConversations = conversations.filter((c) => c.agent === selectedAgent);

  // Load conversations from Supabase
  const loadConversations = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('studio_id', STUDIO_ID)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const loadedConversations: Conversation[] = data.map((conv) => ({
          id: conv.id,
          title: conv.title || 'Untitled',
          agent: conv.agent as AgentId,
          messages: (conv.messages as unknown as Message[]) || [],
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
        }));
        setConversations(loadedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isTyping]);

  // Save conversation to Supabase
  const saveConversation = async (conversation: Conversation) => {
    if (isDemoMode) return;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .upsert({
          id: conversation.id,
          studio_id: STUDIO_ID,
          user_id: STUDIO_ID, // Placeholder - should be actual user ID
          agent: conversation.agent,
          title: conversation.title,
          messages: JSON.parse(JSON.stringify(conversation.messages)),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Create new conversation
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      agent: selectedAgent,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    saveConversation(newConversation);
  };

  // Delete conversation
  const deleteConversation = async (id: string) => {
    if (!isDemoMode) {
      try {
        const { error } = await supabase
          .from('ai_conversations')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  // Send message
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || message;
    if (!messageContent.trim()) return;

    let conversationId = activeConversationId;
    let conversation = activeConversation;

    // Create new conversation if none active
    if (!conversation) {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: generateTitle(messageContent),
        agent: selectedAgent,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      conversationId = newConversation.id;
      conversation = newConversation;
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    }

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    // Update conversation with user message
    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, newUserMessage],
      updatedAt: new Date(),
      title: conversation.messages.length === 0 ? generateTitle(messageContent) : conversation.title,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updatedConversation : c))
    );
    setMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = getMockResponse(selectedAgent, messageContent);

      const newAssistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, newAssistantMessage],
        updatedAt: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? finalConversation : c))
      );
      setIsTyping(false);
      saveConversation(finalConversation);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const AgentIcon = currentAgent.icon;

  return (
    <div className={styles.page}>
      <Header
        title="AI Console"
        subtitle="Your intelligent studio assistants"
      />

      <div className={styles.consoleLayout}>
        {/* Left Sidebar - Agents & History */}
        <aside className={styles.sidebar}>
          {/* Agent Selection */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Agents</h3>
            <div className={styles.agentGrid}>
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <motion.button
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: agents.indexOf(agent) * 0.05 }}
                    className={`${styles.agentButton} ${selectedAgent === agent.id ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setActiveConversationId(null);
                    }}
                    style={{
                      '--agent-color': agent.color,
                      '--agent-gradient': agent.gradient,
                    } as React.CSSProperties}
                  >
                    <div className={styles.agentIconWrapper}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.agentButtonInfo}>
                      <span className={styles.agentButtonName}>{agent.name}</span>
                      <span className={styles.agentButtonRole}>{agent.role}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Conversation History */}
          <div className={styles.sidebarSection}>
            <div className={styles.historyHeader}>
              <h3 className={styles.sectionTitle}>History</h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={16} />}
                onClick={createNewConversation}
                className={styles.newChatButton}
              >
                New
              </Button>
            </div>
            <div className={styles.conversationList}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={20} className={styles.spinnerIcon} />
                  <span>Loading...</span>
                </div>
              ) : agentConversations.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare size={24} />
                  <span>No conversations yet</span>
                </div>
              ) : (
                agentConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${styles.conversationItem} ${activeConversationId === conv.id ? styles.active : ''}`}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <div className={styles.conversationInfo}>
                      <span className={styles.conversationTitle}>{conv.title}</span>
                      <span className={styles.conversationDate}>{formatDate(conv.updatedAt)}</span>
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className={styles.chatArea}>
          {/* Chat Header */}
          <div className={styles.chatHeader} style={{ '--agent-gradient': currentAgent.gradient } as React.CSSProperties}>
            <div className={styles.chatHeaderAgent}>
              <div
                className={styles.chatHeaderAvatar}
                style={{ background: currentAgent.gradient }}
              >
                <AgentIcon size={24} />
              </div>
              <div className={styles.chatHeaderInfo}>
                <h2>{currentAgent.name}</h2>
                <span>{currentAgent.role}</span>
              </div>
            </div>
            <Badge variant="success" size="sm" dot>
              Online
            </Badge>
          </div>

          {/* Messages List */}
          <div className={styles.messagesContainer}>
            <div className={styles.messagesList}>
              <AnimatePresence mode="popLayout">
                {/* Welcome Message or Conversation Messages */}
                {!activeConversation || activeConversation.messages.length === 0 ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.welcomeContainer}
                  >
                    <div
                      className={styles.welcomeIcon}
                      style={{ background: currentAgent.gradient }}
                    >
                      <AgentIcon size={40} />
                    </div>
                    <h3 className={styles.welcomeTitle}>Meet {currentAgent.name}</h3>
                    <p className={styles.welcomeDescription}>{currentAgent.description}</p>
                    <div className={styles.welcomeMessage}>
                      {renderMarkdown(currentAgent.welcomeMessage)}
                    </div>
                    <div className={styles.quickQuestionsSection}>
                      <h4>Quick questions</h4>
                      <div className={styles.quickQuestions}>
                        {currentAgent.quickQuestions.map((question) => (
                          <button
                            key={question}
                            className={styles.quickQuestion}
                            onClick={() => handleQuickQuestion(question)}
                            disabled={isTyping}
                          >
                            <ChevronRight size={14} />
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {activeConversation.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`${styles.messageWrapper} ${styles[msg.role]}`}
                      >
                        {msg.role === 'assistant' && (
                          <div
                            className={styles.messageAvatar}
                            style={{ background: currentAgent.gradient }}
                          >
                            <AgentIcon size={16} />
                          </div>
                        )}
                        <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
                          <div className={styles.messageContent}>
                            {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                          </div>
                          <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`${styles.messageWrapper} ${styles.assistant}`}
                  >
                    <div
                      className={styles.messageAvatar}
                      style={{ background: currentAgent.gradient }}
                    >
                      <AgentIcon size={16} />
                    </div>
                    <div className={`${styles.messageBubble} ${styles.assistant} ${styles.typing}`}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder={`Ask ${currentAgent.name} something...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isTyping}
              className={styles.messageInput}
            />
            <Button
              variant="primary"
              size="md"
              icon={isTyping ? <Loader2 size={18} className={styles.spinnerIcon} /> : <Send size={18} />}
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isTyping}
              className={styles.sendButton}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
