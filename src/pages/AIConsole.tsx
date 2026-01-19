import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  Wrench,
  AlertTriangle,
  Package,
  MessageSquare,
  Bell,
  Star,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import styles from './AIConsole.module.css';

// Agent definitions
type AgentId = 'mia' | 'nova' | 'max' | 'eva';

interface Agent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
  status: 'online' | 'offline';
  quickActions: { label: string; icon: React.ElementType }[];
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: AgentId;
}

const agents: Agent[] = [
  {
    id: 'mia',
    name: 'MIA',
    role: 'Manager',
    description: 'General assistant, scheduling, recommendations',
    avatar: 'M',
    color: '#FF4400',
    status: 'online',
    quickActions: [
      { label: 'Schedule a booking', icon: Calendar },
      { label: "Today's summary", icon: FileText },
      { label: 'Recommend time slot', icon: Clock },
    ],
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'Analyzer',
    description: 'Analytics, reports, insights, forecasting',
    avatar: 'N',
    color: '#7C3AED',
    status: 'online',
    quickActions: [
      { label: 'Weekly report', icon: BarChart3 },
      { label: 'Revenue trends', icon: TrendingUp },
      { label: 'Client insights', icon: Users },
    ],
  },
  {
    id: 'max',
    name: 'MAX',
    role: 'Operations',
    description: 'Inventory, maintenance, equipment tracking',
    avatar: 'X',
    color: '#1890CC',
    status: 'online',
    quickActions: [
      { label: 'Equipment status', icon: Wrench },
      { label: 'Maintenance due', icon: AlertTriangle },
      { label: 'Low inventory', icon: Package },
    ],
  },
  {
    id: 'eva',
    name: 'EVA',
    role: 'Relations',
    description: 'Client communication, follow-ups, feedback',
    avatar: 'E',
    color: '#00B83D',
    status: 'offline',
    quickActions: [
      { label: 'Client follow-ups', icon: MessageSquare },
      { label: 'Send reminder', icon: Bell },
      { label: 'Satisfaction survey', icon: Star },
    ],
  },
];

// Mock conversation data for demo
const mockConversations: Record<AgentId, Message[]> = {
  mia: [
    {
      id: '1',
      role: 'agent',
      content: "Hello! I'm MIA, your studio manager assistant. I can help you with scheduling, bookings, and general studio management. What can I help you with today?",
      timestamp: new Date(Date.now() - 3600000),
      agentId: 'mia',
    },
    {
      id: '2',
      role: 'user',
      content: "What's my schedule looking like for tomorrow?",
      timestamp: new Date(Date.now() - 3500000),
    },
    {
      id: '3',
      role: 'agent',
      content: "Tomorrow you have 3 bookings scheduled:\n\n• 9:00 AM - Portrait session with Sarah Chen (Studio A)\n• 2:00 PM - Product shoot for TechCorp (Studio B)\n• 5:30 PM - Family portraits for the Johnsons (Studio A)\n\nYou also have a 30-minute gap at 12:30 PM that could be used for a quick shoot or meeting.",
      timestamp: new Date(Date.now() - 3400000),
      agentId: 'mia',
    },
  ],
  nova: [
    {
      id: '1',
      role: 'agent',
      content: "Hi there! I'm NOVA, your analytics specialist. I analyze your studio data to provide insights, reports, and forecasts. Ready to dive into the numbers?",
      timestamp: new Date(Date.now() - 7200000),
      agentId: 'nova',
    },
    {
      id: '2',
      role: 'user',
      content: 'How did we perform this week compared to last week?',
      timestamp: new Date(Date.now() - 7100000),
    },
    {
      id: '3',
      role: 'agent',
      content: "Great question! Here's your weekly comparison:\n\n📈 Revenue: $12,450 (+18% vs last week)\n📸 Sessions completed: 24 (+4 from last week)\n⭐ Client satisfaction: 4.8/5 (stable)\n🕐 Studio utilization: 72% (+8%)\n\nNotable trend: Portrait sessions are up 30% this week. Consider promoting this service!",
      timestamp: new Date(Date.now() - 7000000),
      agentId: 'nova',
    },
  ],
  max: [
    {
      id: '1',
      role: 'agent',
      content: "Hello! I'm MAX, your operations specialist. I track equipment, inventory, and maintenance schedules. Everything running smoothly?",
      timestamp: new Date(Date.now() - 1800000),
      agentId: 'max',
    },
    {
      id: '2',
      role: 'user',
      content: 'Any equipment issues I should know about?',
      timestamp: new Date(Date.now() - 1700000),
    },
    {
      id: '3',
      role: 'agent',
      content: "Here's your equipment status update:\n\n⚠️ Attention needed:\n• Profoto B10X #2 - Firmware update available\n• Backdrop stand A3 - Scheduled maintenance in 5 days\n\n✅ All clear:\n• All cameras operational\n• Lighting equipment (12/12 items) working\n• Props inventory at 85% capacity\n\nWould you like me to schedule the maintenance or update?",
      timestamp: new Date(Date.now() - 1600000),
      agentId: 'max',
    },
  ],
  eva: [
    {
      id: '1',
      role: 'agent',
      content: "Hi! I'm EVA, your client relations specialist. I help manage client communications, follow-ups, and feedback collection. How can I assist?",
      timestamp: new Date(Date.now() - 86400000),
      agentId: 'eva',
    },
  ],
};

// Mock AI responses for demo
const mockResponses: Record<AgentId, string[]> = {
  mia: [
    "I've checked the calendar and found 3 available slots this week. Would you like me to suggest the best times based on typical client preferences?",
    "Based on your booking history, I recommend offering a 10% discount for weekday morning sessions to increase utilization.",
    "I've prepared a summary of today's activities. You completed 4 sessions with an average duration of 2 hours each.",
  ],
  nova: [
    "Analyzing your revenue data... I see a strong correlation between social media posts and bookings within 48 hours. Consider posting more frequently!",
    "Your client retention rate is 78%, which is above industry average. Top returning clients: Chen family, TechCorp, and Style Magazine.",
    "Forecast for next month: Expected revenue of $48,000 based on current booking trends and seasonal patterns.",
  ],
  max: [
    "I've run a full inventory check. You're running low on backdrop paper (white) - only 2 rolls remaining. Shall I add it to the order list?",
    "Equipment utilization report: Camera A is used 85% of the time, while Camera C only 20%. Consider reassigning or selling Camera C.",
    "Maintenance alert cleared. All equipment is now up to date and ready for the upcoming busy season.",
  ],
  eva: [
    "I've identified 5 clients who haven't booked in over 3 months. Would you like me to draft a re-engagement email?",
    "Satisfaction survey results are in: 92% of clients rated their experience as excellent. Main feedback: 'Great lighting' and 'Professional service'.",
    "Reminder scheduled for Sarah Chen's booking tomorrow. I'll send her the preparation guide 2 hours before the session.",
  ],
};

export function AIConsole() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('mia');
  const [conversations, setConversations] = useState<Record<AgentId, Message[]>>(mockConversations);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = agents.find((a) => a.id === selectedAgent)!;
  const currentMessages = conversations[selectedAgent] || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  const handleSendMessage = (content?: string) => {
    const messageContent = content || message;
    if (!messageContent.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), newUserMessage],
    }));
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = mockResponses[selectedAgent];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const newAgentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: randomResponse,
        timestamp: new Date(),
        agentId: selectedAgent,
      };

      setConversations((prev) => ({
        ...prev,
        [selectedAgent]: [...(prev[selectedAgent] || []), newAgentMessage],
      }));
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.page}>
      <Header
        title="AI Console"
        subtitle="Your intelligent studio assistants"
      />

      <div className={styles.consoleLayout}>
        {/* Left Sidebar - Agent Selection */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Agents</h3>
          </div>
          <div className={styles.agentList}>
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: agents.indexOf(agent) * 0.05 }}
              >
                <Card
                  padding="md"
                  hoverable
                  className={`${styles.agentCard} ${selectedAgent === agent.id ? styles.selected : ''}`}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <div className={styles.agentCardContent}>
                    <div
                      className={styles.agentAvatar}
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.avatar}
                    </div>
                    <div className={styles.agentInfo}>
                      <div className={styles.agentNameRow}>
                        <span className={styles.agentName}>{agent.name}</span>
                        <span
                          className={`${styles.statusDot} ${styles[agent.status]}`}
                        />
                      </div>
                      <span className={styles.agentRole}>{agent.role}</span>
                      <p className={styles.agentDescription}>{agent.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className={styles.chatArea}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderAgent}>
              <div
                className={styles.chatHeaderAvatar}
                style={{ backgroundColor: currentAgent.color }}
              >
                {currentAgent.avatar}
              </div>
              <div className={styles.chatHeaderInfo}>
                <h2>{currentAgent.name}</h2>
                <span>{currentAgent.role}</span>
              </div>
            </div>
            <Badge
              variant={currentAgent.status === 'online' ? 'success' : 'default'}
              size="sm"
              dot
            >
              {currentAgent.status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Messages List */}
          <div className={styles.messagesContainer}>
            <div className={styles.messagesList}>
              <AnimatePresence mode="popLayout">
                {currentMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`${styles.messageWrapper} ${styles[msg.role]}`}
                  >
                    {msg.role === 'agent' && (
                      <div
                        className={styles.messageAvatar}
                        style={{ backgroundColor: currentAgent.color }}
                      >
                        {currentAgent.avatar}
                      </div>
                    )}
                    <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
                      <p className={styles.messageContent}>{msg.content}</p>
                      <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`${styles.messageWrapper} ${styles.agent}`}
                  >
                    <div
                      className={styles.messageAvatar}
                      style={{ backgroundColor: currentAgent.color }}
                    >
                      {currentAgent.avatar}
                    </div>
                    <div className={`${styles.messageBubble} ${styles.agent} ${styles.typing}`}>
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

          {/* Quick Actions */}
          <div className={styles.quickActionsBar}>
            {currentAgent.quickActions.map((action) => (
              <button
                key={action.label}
                className={styles.quickActionChip}
                onClick={() => handleQuickAction(action.label)}
                disabled={isTyping}
              >
                <action.icon size={14} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder={`Message ${currentAgent.name}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isTyping || currentAgent.status === 'offline'}
              className={styles.messageInput}
            />
            <Button
              variant="primary"
              size="md"
              icon={isTyping ? <Loader2 size={18} className={styles.spinnerIcon} /> : <Send size={18} />}
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isTyping || currentAgent.status === 'offline'}
              className={styles.sendButton}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
