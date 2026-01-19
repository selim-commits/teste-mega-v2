import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Zap,
  Brain,
  Shield,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  Settings,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar,
  Package,
  Users,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import styles from './AIConsole.module.css';

const agents = [
  {
    id: 'yoda',
    name: 'YODA',
    role: 'Intelligence Stratégique',
    description: 'Analyse prédictive et recommandations business basées sur vos données.',
    icon: Brain,
    color: '#FF4400',
    status: 'active',
    lastAction: 'Analyse des tendances de réservation',
    metrics: { insights: 12, accuracy: 94 },
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'Automatisation Opérationnelle',
    description: 'Optimise vos workflows et automatise les tâches répétitives.',
    icon: Zap,
    color: '#1890CC',
    status: 'active',
    lastAction: 'Synchronisation inventaire',
    metrics: { tasks: 47, saved: '12h' },
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'Assistant Créatif',
    description: 'Génère du contenu, analyse les tendances et inspire vos projets.',
    icon: Sparkles,
    color: '#7C3AED',
    status: 'idle',
    lastAction: 'Génération de mood boards',
    metrics: { created: 28, approved: 92 },
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'Sécurité & Compliance',
    description: 'Surveille les anomalies et assure la conformité de vos opérations.',
    icon: Shield,
    color: '#00B83D',
    status: 'monitoring',
    lastAction: 'Scan de sécurité terminé',
    metrics: { alerts: 0, score: 98 },
  },
];

const insights = [
  {
    agent: 'YODA',
    type: 'insight',
    title: 'Opportunité de revenus',
    message: 'Les créneaux du samedi matin sont sous-utilisés. Proposer une offre "Early Bird" pourrait générer +15% de revenus.',
    time: 'Il y a 5 min',
    icon: TrendingUp,
    color: 'var(--accent-orange)',
  },
  {
    agent: 'NEXUS',
    type: 'automation',
    title: 'Tâche automatisée',
    message: 'Factures mensuelles générées et envoyées à 23 clients.',
    time: 'Il y a 1h',
    icon: CheckCircle,
    color: 'var(--accent-green)',
  },
  {
    agent: 'SENTINEL',
    type: 'alert',
    title: 'Alerte maintenance',
    message: 'Le flash Profoto B10X nécessite une révision dans 7 jours.',
    time: 'Il y a 2h',
    icon: AlertCircle,
    color: 'var(--accent-yellow)',
  },
  {
    agent: 'NOVA',
    type: 'suggestion',
    title: 'Tendance détectée',
    message: 'Les shootings "lifestyle" sont en hausse de 40%. Considérez un package dédié.',
    time: 'Il y a 3h',
    icon: Sparkles,
    color: 'var(--accent-purple)',
  },
];

const quickActions = [
  { label: 'Analyser les revenus', icon: BarChart3, agent: 'YODA' },
  { label: 'Optimiser le planning', icon: Calendar, agent: 'NEXUS' },
  { label: 'Vérifier l\'inventaire', icon: Package, agent: 'SENTINEL' },
  { label: 'Suggestions clients', icon: Users, agent: 'NOVA' },
];

export function AIConsole() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedAgent) return;

    setConversation([...conversation, { role: 'user', content: message }]);
    setMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `En tant que ${selectedAgent.toUpperCase()}, je vais analyser votre demande. Basé sur les données actuelles, je recommande d'optimiser vos créneaux du weekend pour maximiser l'occupation.`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm" dot>Actif</Badge>;
      case 'idle':
        return <Badge variant="default" size="sm">En veille</Badge>;
      case 'monitoring':
        return <Badge variant="info" size="sm" dot>Surveillance</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="AI Console"
        subtitle="Vos agents intelligents au service de votre studio"
      />

      <div className={styles.content}>
        {/* Agents Grid */}
        <div className={styles.agentsGrid}>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                padding="lg"
                hoverable
                className={`${styles.agentCard} ${selectedAgent === agent.id ? styles.selected : ''}`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className={styles.agentHeader}>
                  <div className={styles.agentIcon} style={{ backgroundColor: `${agent.color}15` }}>
                    <agent.icon size={24} color={agent.color} />
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                <div className={styles.agentInfo}>
                  <h3 className={styles.agentName}>{agent.name}</h3>
                  <span className={styles.agentRole}>{agent.role}</span>
                  <p className={styles.agentDescription}>{agent.description}</p>
                </div>

                <div className={styles.agentMeta}>
                  <div className={styles.agentLastAction}>
                    <Activity size={12} />
                    <span>{agent.lastAction}</span>
                  </div>
                </div>

                <div className={styles.agentMetrics}>
                  {Object.entries(agent.metrics).map(([key, value]) => (
                    <div key={key} className={styles.metric}>
                      <span className={styles.metricValue}>{value}</span>
                      <span className={styles.metricLabel}>{key}</span>
                    </div>
                  ))}
                </div>

                <button className={styles.agentAction}>
                  <span>Utiliser</span>
                  <ChevronRight size={14} />
                </button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Chat Interface */}
          <Card padding="none" className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <div className={styles.chatAgent}>
                <Bot size={20} />
                <span>
                  {selectedAgent
                    ? `Conversation avec ${agents.find((a) => a.id === selectedAgent)?.name}`
                    : 'Sélectionnez un agent'}
                </span>
              </div>
              <Button variant="ghost" size="sm" icon={<Settings size={16} />} />
            </div>

            <div className={styles.chatMessages}>
              {conversation.length === 0 ? (
                <div className={styles.chatEmpty}>
                  <div className={styles.chatEmptyIcon}>
                    <MessageSquare size={40} />
                  </div>
                  <h4>Démarrez une conversation</h4>
                  <p>Sélectionnez un agent et posez votre question</p>
                  <div className={styles.quickActions}>
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        className={styles.quickAction}
                        onClick={() => {
                          setSelectedAgent(action.agent.toLowerCase());
                          setMessage(action.label);
                        }}
                      >
                        <action.icon size={16} />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {conversation.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${styles.message} ${styles[msg.role]}`}
                    >
                      {msg.content}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`${styles.message} ${styles.ai} ${styles.loading}`}
                    >
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Analyse en cours...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            <div className={styles.chatInput}>
              <input
                type="text"
                placeholder={
                  selectedAgent
                    ? `Demandez quelque chose à ${agents.find((a) => a.id === selectedAgent)?.name}...`
                    : 'Sélectionnez d\'abord un agent...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!selectedAgent}
              />
              <Button
                variant="primary"
                size="sm"
                icon={<Send size={16} />}
                onClick={handleSendMessage}
                disabled={!selectedAgent || !message.trim()}
              />
            </div>
          </Card>

          {/* Activity Feed */}
          <Card padding="lg" className={styles.feedCard}>
            <CardHeader
              title="Activité des agents"
              subtitle="Dernières actions et insights"
            />
            <CardContent>
              <div className={styles.feedList}>
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    className={styles.feedItem}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={styles.feedIcon} style={{ backgroundColor: `${insight.color}15` }}>
                      <insight.icon size={16} color={insight.color} />
                    </div>
                    <div className={styles.feedContent}>
                      <div className={styles.feedHeader}>
                        <span className={styles.feedAgent}>{insight.agent}</span>
                        <span className={styles.feedTime}>{insight.time}</span>
                      </div>
                      <h4 className={styles.feedTitle}>{insight.title}</h4>
                      <p className={styles.feedMessage}>{insight.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
