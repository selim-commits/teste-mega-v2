import { useState, useMemo, useCallback } from 'react';
import {
  Zap,
  Search,
  Plus,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Bell,
  FileText,
  ClipboardList,
  UserPlus,
  CalendarCheck,
  CreditCard,
  XCircle,
  ArrowRight,
  BarChart3,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Users,
  Star,
  Sparkles,
  Lock,
  SmilePlus,
  Heart,
  Gift,
  Filter,
  Edit3,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Checkbox';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { useNotifications } from '../stores/uiStore';
import { useDebounce } from '../hooks/useDebounce';
import styles from './Automations.module.css';

// ===== Types =====

type AutomationStatus = 'active' | 'paused' | 'error';
type AutomationCategory = 'reservation' | 'paiement' | 'communication' | 'tache';
type PageTab = 'automations' | 'journeys';
type JourneyChannel = 'email' | 'sms' | 'push';

interface Automation {
  id: string;
  name: string;
  description: string;
  active: boolean;
  status: AutomationStatus;
  category: AutomationCategory;
  trigger: string;
  triggerIcon: React.ElementType;
  condition?: string;
  action: string;
  actionIcon: React.ElementType;
  lastExecuted: string | null;
  executionCount: number;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  trigger: string;
  action: string;
  category: AutomationCategory;
}

interface JourneyStep {
  id: string;
  name: string;
  description: string;
  channel: JourneyChannel;
  delay: string;
  delayLabel: string;
  template: string;
  condition?: string;
  active: boolean;
  icon: React.ElementType;
}

interface GuestJourney {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: 'standard' | 'vip' | 'express';
  steps: JourneyStep[];
  active: boolean;
  lastModified: string;
}

// ===== Mock data - Automations =====

const STORAGE_KEY = 'rooom_automations';
const JOURNEY_STORAGE_KEY = 'rooom_guest_journeys';

function loadAutomations(): Automation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Automation[];
    }
  } catch {
    // Ignore
  }
  return defaultAutomations;
}

function saveAutomations(automations: Automation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
  } catch {
    // Ignore
  }
}

const defaultAutomations: Automation[] = [
  {
    id: '1',
    name: 'Confirmation de reservation',
    description: 'Envoie un email de confirmation automatique a chaque nouvelle reservation',
    active: true,
    status: 'active',
    category: 'reservation',
    trigger: 'Nouvelle reservation',
    triggerIcon: CalendarCheck,
    condition: 'Reservation confirmee',
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-08T14:30:00',
    executionCount: 247,
  },
  {
    id: '2',
    name: 'Rappel J-1',
    description: 'Envoie un SMS de rappel 24 heures avant le rendez-vous',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: '24h avant RDV',
    triggerIcon: Clock,
    action: 'Envoyer SMS',
    actionIcon: MessageSquare,
    lastExecuted: '2026-02-08T08:00:00',
    executionCount: 189,
  },
  {
    id: '3',
    name: 'Suivi post-session',
    description: 'Demande un avis client par email apres chaque session terminee',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: 'Fin de session',
    triggerIcon: CheckCircle,
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-07T18:00:00',
    executionCount: 156,
  },
  {
    id: '4',
    name: 'Rappel de paiement',
    description: 'Relance automatique par email pour les factures impayees depuis 7 jours',
    active: true,
    status: 'active',
    category: 'paiement',
    trigger: 'Facture impayee 7j',
    triggerIcon: CreditCard,
    condition: 'Montant > 0',
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-06T09:00:00',
    executionCount: 34,
  },
  {
    id: '5',
    name: 'Tache de nettoyage',
    description: 'Cree automatiquement une tache de nettoyage apres chaque session',
    active: false,
    status: 'paused',
    category: 'tache',
    trigger: 'Fin de session',
    triggerIcon: CheckCircle,
    action: 'Creer tache',
    actionIcon: ClipboardList,
    lastExecuted: '2026-01-15T17:00:00',
    executionCount: 89,
  },
  {
    id: '6',
    name: 'Bienvenue nouveau client',
    description: 'Envoie un email de bienvenue personnalise aux nouveaux clients',
    active: true,
    status: 'active',
    category: 'communication',
    trigger: 'Nouveau client',
    triggerIcon: UserPlus,
    action: 'Envoyer email',
    actionIcon: Mail,
    lastExecuted: '2026-02-08T11:00:00',
    executionCount: 78,
  },
  {
    id: '7',
    name: 'Alerte annulation',
    description: 'Notifie toute l\'equipe en cas d\'annulation de reservation',
    active: true,
    status: 'error',
    category: 'reservation',
    trigger: 'Annulation',
    triggerIcon: XCircle,
    action: 'Notification equipe',
    actionIcon: Bell,
    lastExecuted: '2026-02-05T16:45:00',
    executionCount: 12,
  },
  {
    id: '8',
    name: 'Facturation automatique',
    description: 'Genere automatiquement une facture a la fin de chaque session',
    active: true,
    status: 'active',
    category: 'paiement',
    trigger: 'Session terminee',
    triggerIcon: CheckCircle,
    action: 'Generer facture',
    actionIcon: FileText,
    lastExecuted: '2026-02-08T17:00:00',
    executionCount: 203,
  },
];

const automationTemplates: AutomationTemplate[] = [
  {
    id: 't1',
    name: 'Confirmation de reservation',
    description: 'Email de confirmation automatique pour chaque nouvelle reservation',
    icon: CalendarCheck,
    trigger: 'Nouvelle reservation',
    action: 'Envoyer email',
    category: 'reservation',
  },
  {
    id: 't2',
    name: 'Rappel J-1',
    description: 'SMS de rappel 24h avant le rendez-vous',
    icon: Clock,
    trigger: '24h avant RDV',
    action: 'Envoyer SMS',
    category: 'communication',
  },
  {
    id: 't3',
    name: 'Suivi post-session',
    description: 'Demande d\'avis client apres la session',
    icon: Mail,
    trigger: 'Fin de session',
    action: 'Envoyer email',
    category: 'communication',
  },
  {
    id: 't4',
    name: 'Rappel de paiement',
    description: 'Relance email pour facture impayee depuis 7 jours',
    icon: CreditCard,
    trigger: 'Facture impayee 7j',
    action: 'Envoyer email',
    category: 'paiement',
  },
  {
    id: 't5',
    name: 'Tache de nettoyage',
    description: 'Creer une tache nettoyage apres chaque session',
    icon: ClipboardList,
    trigger: 'Fin de session',
    action: 'Creer tache',
    category: 'tache',
  },
  {
    id: 't6',
    name: 'Bienvenue nouveau client',
    description: 'Email de bienvenue personnalise pour les nouveaux clients',
    icon: UserPlus,
    trigger: 'Nouveau client',
    action: 'Envoyer email',
    category: 'communication',
  },
  {
    id: 't7',
    name: 'Alerte annulation',
    description: 'Notification a l\'equipe lors d\'une annulation',
    icon: XCircle,
    trigger: 'Annulation',
    action: 'Notification equipe',
    category: 'reservation',
  },
  {
    id: 't8',
    name: 'Facturation automatique',
    description: 'Generer une facture apres chaque session terminee',
    icon: FileText,
    trigger: 'Session terminee',
    action: 'Generer facture',
    category: 'paiement',
  },
];

const categories = [
  { id: 'all', label: 'Toutes' },
  { id: 'reservation', label: 'Reservation' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'communication', label: 'Communication' },
  { id: 'tache', label: 'Tache' },
];

const triggerOptions = [
  'Nouvelle reservation',
  'Paiement recu',
  'Annulation',
  '24h avant RDV',
  'Fin de session',
  'Nouveau client',
  'Facture impayee 7j',
] as const;

const actionOptions = [
  'Envoyer email',
  'Envoyer SMS',
  'Creer tache',
  'Notification push',
  'Generer facture',
  'Mettre a jour statut',
] as const;

const triggerIconMap: Record<string, React.ElementType> = {
  'Nouvelle reservation': CalendarCheck,
  'Paiement recu': CreditCard,
  'Annulation': XCircle,
  '24h avant RDV': Clock,
  'Fin de session': CheckCircle,
  'Nouveau client': UserPlus,
  'Facture impayee 7j': CreditCard,
};

const actionIconMap: Record<string, React.ElementType> = {
  'Envoyer email': Mail,
  'Envoyer SMS': MessageSquare,
  'Creer tache': ClipboardList,
  'Notification push': Bell,
  'Generer facture': FileText,
  'Mettre a jour statut': RefreshCw,
};

// ===== Mock data - Guest Journeys =====

function createDefaultJourneys(): GuestJourney[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Parcours Standard',
      description: 'Le parcours classique pour chaque reservation. 6 etapes couvrant confirmation, rappels et suivi.',
      icon: Users,
      type: 'standard',
      active: true,
      lastModified: '2026-02-08T10:00:00',
      steps: [
        {
          id: crypto.randomUUID(),
          name: 'Confirmation',
          description: 'Email de confirmation envoye immediatement apres la reservation',
          channel: 'email',
          delay: '0m',
          delayLabel: 'Immediat',
          template: 'Bonjour {prenom}, votre reservation au studio {studio} est confirmee pour le {date} a {heure}.',
          active: true,
          icon: CheckCircle,
        },
        {
          id: crypto.randomUUID(),
          name: 'Rappel J-1',
          description: 'SMS de rappel envoye 24 heures avant la session',
          channel: 'sms',
          delay: '-24h',
          delayLabel: '24h avant',
          template: 'Rappel : votre session au studio {studio} est demain a {heure}. A bientot !',
          active: true,
          icon: Clock,
        },
        {
          id: crypto.randomUUID(),
          name: 'Code d\'acces',
          description: 'Envoi du code d\'acces au studio 2h avant la session',
          channel: 'sms',
          delay: '-2h',
          delayLabel: '2h avant',
          template: 'Votre code d\'acces au studio {studio} : {code}. Il sera actif de {heure_debut} a {heure_fin}.',
          active: true,
          icon: Lock,
        },
        {
          id: crypto.randomUUID(),
          name: 'Bienvenue',
          description: 'Notification push a l\'arrivee au studio',
          channel: 'push',
          delay: '0m',
          delayLabel: 'A l\'arrivee',
          template: 'Bienvenue au studio {studio} ! Le wifi est {wifi_name}, mot de passe : {wifi_pass}.',
          condition: 'Detection arrivee',
          active: true,
          icon: SmilePlus,
        },
        {
          id: crypto.randomUUID(),
          name: 'Remerciement',
          description: 'Email de remerciement apres la session',
          channel: 'email',
          delay: '+1h',
          delayLabel: '1h apres',
          template: 'Merci {prenom} pour votre session ! Nous esperons que tout s\'est bien passe au studio {studio}.',
          active: true,
          icon: Heart,
        },
        {
          id: crypto.randomUUID(),
          name: 'Demande d\'avis',
          description: 'Email de demande d\'avis le lendemain',
          channel: 'email',
          delay: '+24h',
          delayLabel: 'J+1',
          template: 'Comment s\'est passee votre experience ? Laissez-nous un avis pour nous aider a nous ameliorer.',
          active: true,
          icon: Star,
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Parcours VIP',
      description: 'Experience premium avec 8 etapes personnalisees incluant suivi en session et fidelisation.',
      icon: Star,
      type: 'vip',
      active: true,
      lastModified: '2026-02-07T16:00:00',
      steps: [
        {
          id: crypto.randomUUID(),
          name: 'Confirmation VIP',
          description: 'Email de confirmation premium avec details personnalises',
          channel: 'email',
          delay: '0m',
          delayLabel: 'Immediat',
          template: 'Cher {prenom}, votre experience VIP au studio {studio} est confirmee. Decouvrez votre programme personnalise.',
          active: true,
          icon: CheckCircle,
        },
        {
          id: crypto.randomUUID(),
          name: 'Rappel J-1',
          description: 'Rappel SMS avec details premium',
          channel: 'sms',
          delay: '-24h',
          delayLabel: '24h avant',
          template: 'Votre session VIP approche ! Studio {studio}, demain a {heure}. Un assistant vous accueillera.',
          active: true,
          icon: Clock,
        },
        {
          id: crypto.randomUUID(),
          name: 'Code d\'acces',
          description: 'Code d\'acces securise avec instructions VIP',
          channel: 'sms',
          delay: '-2h',
          delayLabel: '2h avant',
          template: 'Code VIP : {code}. Parking reserve place {parking}. Entree par l\'acces prive.',
          active: true,
          icon: Lock,
        },
        {
          id: crypto.randomUUID(),
          name: 'Bienvenue VIP',
          description: 'Message d\'accueil personnalise a l\'arrivee',
          channel: 'push',
          delay: '0m',
          delayLabel: 'A l\'arrivee',
          template: 'Bienvenue {prenom} ! Votre assistant {assistant} vous attend. Wifi : {wifi_name}/{wifi_pass}.',
          condition: 'Detection arrivee',
          active: true,
          icon: SmilePlus,
        },
        {
          id: crypto.randomUUID(),
          name: 'Suivi en session',
          description: 'Message de suivi pendant la session',
          channel: 'push',
          delay: '+30m',
          delayLabel: '30min apres debut',
          template: 'Tout se passe bien ? N\'hesitez pas a contacter {assistant} si vous avez besoin de quoi que ce soit.',
          condition: 'Session en cours',
          active: true,
          icon: MessageSquare,
        },
        {
          id: crypto.randomUUID(),
          name: 'Remerciement VIP',
          description: 'Email de remerciement premium post-session',
          channel: 'email',
          delay: '+1h',
          delayLabel: '1h apres',
          template: 'Merci pour votre confiance {prenom} ! Retrouvez vos photos/videos dans votre espace client.',
          active: true,
          icon: Heart,
        },
        {
          id: crypto.randomUUID(),
          name: 'Demande d\'avis',
          description: 'Demande d\'avis avec recompense',
          channel: 'email',
          delay: '+24h',
          delayLabel: 'J+1',
          template: 'Votre avis compte ! Partagez votre experience et recevez 10% sur votre prochaine session.',
          active: true,
          icon: Star,
        },
        {
          id: crypto.randomUUID(),
          name: 'Fidelisation',
          description: 'Offre exclusive de fidelisation une semaine apres',
          channel: 'email',
          delay: '+7d',
          delayLabel: 'J+7',
          template: 'Offre VIP exclusive : reservez dans les 30 jours et beneficiez de -15% avec le code {code_fidel}.',
          condition: 'Premiere visite',
          active: true,
          icon: Gift,
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Parcours Express',
      description: 'Parcours minimaliste en 3 etapes pour les clients reguliers. Confirmation, code et remerciement.',
      icon: Sparkles,
      type: 'express',
      active: false,
      lastModified: '2026-02-05T09:30:00',
      steps: [
        {
          id: crypto.randomUUID(),
          name: 'Confirmation rapide',
          description: 'SMS de confirmation immediat',
          channel: 'sms',
          delay: '0m',
          delayLabel: 'Immediat',
          template: 'Reservation confirmee ! Studio {studio}, le {date} a {heure}. Code : {code}.',
          active: true,
          icon: CheckCircle,
        },
        {
          id: crypto.randomUUID(),
          name: 'Rappel + Code',
          description: 'Rappel et code combines 2h avant',
          channel: 'sms',
          delay: '-2h',
          delayLabel: '2h avant',
          template: 'Rappel : session dans 2h au studio {studio}. Code d\'acces : {code}.',
          active: true,
          icon: Lock,
        },
        {
          id: crypto.randomUUID(),
          name: 'Remerciement express',
          description: 'SMS de remerciement rapide',
          channel: 'sms',
          delay: '+1h',
          delayLabel: '1h apres',
          template: 'Merci {prenom} ! A bientot au studio {studio}.',
          active: true,
          icon: Heart,
        },
      ],
    },
  ];
}

function loadJourneys(): GuestJourney[] {
  try {
    const saved = localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GuestJourney[];
    }
  } catch {
    // Ignore
  }
  return createDefaultJourneys();
}

function saveJourneys(journeys: GuestJourney[]) {
  try {
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
  } catch {
    // Ignore
  }
}

// ===== Helpers =====

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'A l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

function getCategoryForTrigger(trigger: string): AutomationCategory {
  if (['Nouvelle reservation', 'Annulation'].includes(trigger)) return 'reservation';
  if (['Paiement recu', 'Facture impayee 7j'].includes(trigger)) return 'paiement';
  if (['Nouveau client', '24h avant RDV'].includes(trigger)) return 'communication';
  return 'tache';
}

function getChannelLabel(channel: JourneyChannel): string {
  switch (channel) {
    case 'email': return 'Email';
    case 'sms': return 'SMS';
    case 'push': return 'Push';
  }
}

function getChannelIcon(channel: JourneyChannel): React.ElementType {
  switch (channel) {
    case 'email': return Mail;
    case 'sms': return MessageSquare;
    case 'push': return Bell;
  }
}

// ===== Component =====

export function Automations() {
  // Page-level state
  const [activeTab, setActiveTab] = useState<PageTab>('automations');

  // Automations state
  const [automations, setAutomations] = useState<Automation[]>(loadAutomations);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrigger, setNewTrigger] = useState<string>(triggerOptions[0]);
  const [newAction, setNewAction] = useState<string>(actionOptions[0]);
  const [newActive, setNewActive] = useState(true);

  // Journey state
  const [journeys, setJourneys] = useState<GuestJourney[]>(loadJourneys);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [isStepEditModalOpen, setIsStepEditModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<JourneyStep | null>(null);
  const [editStepName, setEditStepName] = useState('');
  const [editStepChannel, setEditStepChannel] = useState<JourneyChannel>('email');
  const [editStepDelay, setEditStepDelay] = useState('');
  const [editStepDelayLabel, setEditStepDelayLabel] = useState('');
  const [editStepTemplate, setEditStepTemplate] = useState('');
  const [editStepCondition, setEditStepCondition] = useState('');

  const { success } = useNotifications();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Selected journey
  const selectedJourney = useMemo(
    () => journeys.find((j) => j.id === selectedJourneyId) ?? null,
    [journeys, selectedJourneyId]
  );

  // Filtered automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((a) => {
      const matchesSearch =
        !debouncedSearch ||
        a.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        a.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [automations, debouncedSearch, activeCategory]);

  // Stats
  const activeCount = automations.filter((a) => a.active).length;
  const todayExecutions = automations.reduce((sum, a) => {
    if (a.lastExecuted) {
      const execDate = new Date(a.lastExecuted);
      const today = new Date();
      if (
        execDate.getDate() === today.getDate() &&
        execDate.getMonth() === today.getMonth() &&
        execDate.getFullYear() === today.getFullYear()
      ) {
        return sum + 1;
      }
    }
    return sum;
  }, 0);
  const monthExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0);
  const successRate = automations.length > 0
    ? Math.round((automations.filter((a) => a.status !== 'error').length / automations.length) * 100)
    : 0;

  // ===== Automation Handlers =====

  const toggleAutomation = (id: string) => {
    const updated = automations.map((a) =>
      a.id === id
        ? { ...a, active: !a.active, status: (!a.active ? 'active' : 'paused') as AutomationStatus }
        : a
    );
    setAutomations(updated);
    saveAutomations(updated);
    const automation = updated.find((a) => a.id === id);
    if (automation) {
      success(
        automation.active ? 'Automation activee' : 'Automation desactivee',
        automation.name
      );
    }
  };

  const handleCreateAutomation = () => {
    if (!newName.trim()) return;

    const newAutomation: Automation = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDescription.trim(),
      active: newActive,
      status: newActive ? 'active' : 'paused',
      category: getCategoryForTrigger(newTrigger),
      trigger: newTrigger,
      triggerIcon: triggerIconMap[newTrigger] || Zap,
      action: newAction,
      actionIcon: actionIconMap[newAction] || Zap,
      lastExecuted: null,
      executionCount: 0,
    };

    const updated = [...automations, newAutomation];
    setAutomations(updated);
    saveAutomations(updated);
    resetForm();
    setIsCreateModalOpen(false);
    success('Automation creee', newAutomation.name);
  };

  const handleUseTemplate = (template: AutomationTemplate) => {
    setNewName(template.name);
    setNewDescription(template.description);
    setNewTrigger(template.trigger);
    setNewAction(template.action);
    setNewActive(true);
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewTrigger(triggerOptions[0]);
    setNewAction(actionOptions[0]);
    setNewActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // ===== Journey Handlers =====

  const handleSelectJourney = useCallback((journeyId: string) => {
    setSelectedJourneyId(journeyId);
  }, []);

  const handleBackToJourneys = useCallback(() => {
    setSelectedJourneyId(null);
  }, []);

  const handleToggleJourney = useCallback((journeyId: string) => {
    setJourneys((prev) => {
      const updated = prev.map((j) =>
        j.id === journeyId ? { ...j, active: !j.active } : j
      );
      saveJourneys(updated);
      const journey = updated.find((j) => j.id === journeyId);
      if (journey) {
        success(
          journey.active ? 'Parcours active' : 'Parcours desactive',
          journey.name
        );
      }
      return updated;
    });
  }, [success]);

  const handleToggleStep = useCallback((journeyId: string, stepId: string) => {
    setJourneys((prev) => {
      const updated = prev.map((j) => {
        if (j.id !== journeyId) return j;
        return {
          ...j,
          steps: j.steps.map((s) =>
            s.id === stepId ? { ...s, active: !s.active } : s
          ),
        };
      });
      saveJourneys(updated);
      return updated;
    });
  }, []);

  const handleMoveStep = useCallback((journeyId: string, stepId: string, direction: 'up' | 'down') => {
    setJourneys((prev) => {
      const updated = prev.map((j) => {
        if (j.id !== journeyId) return j;
        const stepIndex = j.steps.findIndex((s) => s.id === stepId);
        if (stepIndex === -1) return j;
        const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
        if (newIndex < 0 || newIndex >= j.steps.length) return j;
        const newSteps = [...j.steps];
        const temp = newSteps[stepIndex];
        newSteps[stepIndex] = newSteps[newIndex];
        newSteps[newIndex] = temp;
        return { ...j, steps: newSteps };
      });
      saveJourneys(updated);
      return updated;
    });
  }, []);

  const handleOpenEditStep = useCallback((step: JourneyStep) => {
    setEditingStep(step);
    setEditStepName(step.name);
    setEditStepChannel(step.channel);
    setEditStepDelay(step.delay);
    setEditStepDelayLabel(step.delayLabel);
    setEditStepTemplate(step.template);
    setEditStepCondition(step.condition ?? '');
    setIsStepEditModalOpen(true);
  }, []);

  const handleSaveStep = useCallback(() => {
    if (!editingStep || !selectedJourneyId) return;

    setJourneys((prev) => {
      const updated = prev.map((j) => {
        if (j.id !== selectedJourneyId) return j;
        return {
          ...j,
          steps: j.steps.map((s) => {
            if (s.id !== editingStep.id) return s;
            return {
              ...s,
              name: editStepName.trim() || s.name,
              channel: editStepChannel,
              delay: editStepDelay.trim() || s.delay,
              delayLabel: editStepDelayLabel.trim() || s.delayLabel,
              template: editStepTemplate.trim() || s.template,
              condition: editStepCondition.trim() || undefined,
            };
          }),
        };
      });
      saveJourneys(updated);
      return updated;
    });

    setIsStepEditModalOpen(false);
    setEditingStep(null);
    success('Etape modifiee', editStepName);
  }, [editingStep, selectedJourneyId, editStepName, editStepChannel, editStepDelay, editStepDelayLabel, editStepTemplate, editStepCondition, success]);

  // ===== Journey Summary Calculations =====

  const journeySummary = useMemo(() => {
    if (!selectedJourney) return null;
    const activeSteps = selectedJourney.steps.filter((s) => s.active).length;
    const emailCount = selectedJourney.steps.filter((s) => s.channel === 'email' && s.active).length;
    const smsCount = selectedJourney.steps.filter((s) => s.channel === 'sms' && s.active).length;
    const pushCount = selectedJourney.steps.filter((s) => s.channel === 'push' && s.active).length;
    const totalActive = emailCount + smsCount + pushCount;
    return { activeSteps, emailCount, smsCount, pushCount, totalActive };
  }, [selectedJourney]);

  // ===== Render =====

  return (
    <div className={styles.page}>
      <Header
        title="Automations"
        subtitle="Automatisez vos workflows pour gagner du temps"
      />

      <div className={styles.content}>
        {/* Page Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'automations' ? styles.active : ''}`}
            onClick={() => setActiveTab('automations')}
          >
            <Zap size={16} />
            Automations
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'journeys' ? styles.active : ''}`}
            onClick={() => setActiveTab('journeys')}
          >
            <Users size={16} />
            Parcours invite
          </button>
        </div>

        {/* Tab: Automations */}
        {activeTab === 'automations' && (
          <>
            {/* Stats Row */}
            <div className={styles.statsGrid}>
              <div className={styles.animateIn}>
                <Card padding="md" className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-success-bg)' }}>
                    <Zap size={20} color="var(--state-success)" />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{activeCount}</span>
                    <span className={styles.statLabel}>Automations actives</span>
                  </div>
                </Card>
              </div>
              <div className={styles.animateIn} style={{ animationDelay: '50ms' }}>
                <Card padding="md" className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-info-bg)' }}>
                    <Play size={20} color="var(--state-info)" />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{todayExecutions}</span>
                    <span className={styles.statLabel}>Executees aujourd'hui</span>
                  </div>
                </Card>
              </div>
              <div className={styles.animateIn} style={{ animationDelay: '100ms' }}>
                <Card padding="md" className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: 'var(--state-warning-bg)' }}>
                    <BarChart3 size={20} color="var(--state-warning)" />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{monthExecutions.toLocaleString('fr-FR')}</span>
                    <span className={styles.statLabel}>Executees ce mois</span>
                  </div>
                </Card>
              </div>
              <div className={styles.animateIn} style={{ animationDelay: '150ms' }}>
                <Card padding="md" className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: 'var(--accent-primary-light)' }}>
                    <CheckCircle size={20} color="var(--accent-primary)" />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{successRate}%</span>
                    <span className={styles.statLabel}>Taux de succes</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.searchBox}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Rechercher une automation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className={styles.filterSelect}
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleOpenCreate}
              >
                Nouvelle automation
              </Button>
            </div>

            {/* Automations List */}
            {filteredAutomations.length > 0 ? (
              <div className={styles.automationsGrid}>
                {filteredAutomations.map((automation, index) => (
                  <div
                    key={automation.id}
                    className={styles.animateIn}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card
                      padding="md"
                      className={`${styles.automationCard} ${
                        automation.status === 'active'
                          ? styles.automationCardActive
                          : automation.status === 'error'
                          ? styles.automationCardError
                          : styles.automationCardPaused
                      }`}
                    >
                      {/* Top: Name + Toggle */}
                      <div className={styles.cardTop}>
                        <div className={styles.cardInfo}>
                          <h4 className={styles.cardName}>{automation.name}</h4>
                          <p className={styles.cardDescription}>{automation.description}</p>
                        </div>
                        <div className={styles.toggleRow}>
                          <Switch
                            checked={automation.active}
                            onChange={() => toggleAutomation(automation.id)}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Visual Workflow Flow */}
                      <div className={styles.workflowFlow}>
                        <div className={styles.flowStep}>
                          <automation.triggerIcon size={14} className={styles.flowStepIcon} />
                          <span className={styles.flowStepLabel}>{automation.trigger}</span>
                        </div>
                        <ArrowRight size={14} className={styles.flowArrow} />
                        {automation.condition && (
                          <>
                            <div className={styles.flowStep}>
                              <AlertCircle size={14} className={styles.flowStepIcon} />
                              <span className={styles.flowStepLabel}>{automation.condition}</span>
                            </div>
                            <ArrowRight size={14} className={styles.flowArrow} />
                          </>
                        )}
                        <div className={styles.flowStep}>
                          <automation.actionIcon size={14} className={styles.flowStepIcon} />
                          <span className={styles.flowStepLabel}>{automation.action}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className={styles.badgeRow}>
                        <span className={styles.triggerBadge}>
                          <Zap size={10} />
                          {automation.trigger}
                        </span>
                        <span className={styles.actionBadge}>
                          <Play size={10} />
                          {automation.action}
                        </span>
                        <Badge
                          variant={
                            automation.status === 'active'
                              ? 'success'
                              : automation.status === 'error'
                              ? 'error'
                              : 'warning'
                          }
                          size="sm"
                          dot
                        >
                          {automation.status === 'active'
                            ? 'Active'
                            : automation.status === 'error'
                            ? 'Erreur'
                            : 'En pause'}
                        </Badge>
                      </div>

                      {/* Bottom: Meta */}
                      <div className={styles.cardBottom}>
                        <div className={styles.cardMeta}>
                          <span className={styles.metaItem}>
                            <Clock size={12} />
                            {formatRelativeTime(automation.lastExecuted)}
                          </span>
                          <span className={styles.metaItem}>
                            <Play size={12} />
                            {automation.executionCount} executions
                          </span>
                        </div>
                        <div
                          className={`${styles.statusDot} ${
                            automation.status === 'active'
                              ? styles.statusDotActive
                              : automation.status === 'error'
                              ? styles.statusDotError
                              : styles.statusDotPaused
                          }`}
                        />
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card padding="lg">
                <div className={styles.emptyState}>
                  <Zap size={48} />
                  <h3>Aucune automation trouvee</h3>
                  <p>
                    {debouncedSearch
                      ? 'Modifiez votre recherche ou vos filtres'
                      : 'Creez votre premiere automation pour commencer'}
                  </p>
                  {!debouncedSearch && (
                    <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
                      Creer une automation
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Templates Section */}
            <div style={{ marginTop: 'var(--section-gap)' }}>
              <h3 className={styles.sectionTitle}>Modeles d'automations</h3>
              <div className={styles.templatesGrid}>
                {automationTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className={styles.animateIn}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card
                      padding="md"
                      hoverable
                      className={styles.templateCard}
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className={styles.templateIcon}>
                        <template.icon size={20} />
                      </div>
                      <h4 className={styles.templateName}>{template.name}</h4>
                      <p className={styles.templateDescription}>{template.description}</p>
                      <div className={styles.templateFlow}>
                        <span>{template.trigger}</span>
                        <ArrowRight size={12} className={styles.templateFlowArrow} />
                        <span>{template.action}</span>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tab: Guest Journeys */}
        {activeTab === 'journeys' && (
          <>
            {!selectedJourney ? (
              /* Journey Presets Selection */
              <>
                <div className={styles.journeyHeader}>
                  <div className={styles.journeyHeaderLeft}>
                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                      Modeles de parcours
                    </h3>
                  </div>
                </div>

                <div className={styles.journeyPresetsGrid}>
                  {journeys.map((journey, index) => (
                    <div
                      key={journey.id}
                      className={styles.animateIn}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Card
                        padding="md"
                        hoverable
                        className={styles.journeyPresetCard}
                        onClick={() => handleSelectJourney(journey.id)}
                      >
                        <div className={styles.presetHeader}>
                          <div
                            className={styles.presetIcon}
                            style={{
                              backgroundColor: journey.active
                                ? 'var(--state-success-bg)'
                                : 'var(--bg-tertiary)',
                            }}
                          >
                            <journey.icon
                              size={20}
                              color={journey.active ? 'var(--state-success)' : 'var(--text-tertiary)'}
                            />
                          </div>
                          <div className={styles.presetInfo}>
                            <h4 className={styles.presetName}>{journey.name}</h4>
                            <p className={styles.presetDescription}>{journey.description}</p>
                          </div>
                        </div>
                        <div className={styles.presetMeta}>
                          <span className={styles.presetMetaItem}>
                            <ClipboardList size={12} />
                            {journey.steps.length} etapes
                          </span>
                          <span className={styles.presetMetaItem}>
                            <Clock size={12} />
                            {formatRelativeTime(journey.lastModified)}
                          </span>
                          <Badge
                            variant={journey.active ? 'success' : 'warning'}
                            size="sm"
                            dot
                          >
                            {journey.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Journey Detail View */
              <>
                <div className={styles.journeyHeader}>
                  <div className={styles.journeyHeaderLeft}>
                    <button
                      className={styles.backButton}
                      onClick={handleBackToJourneys}
                    >
                      <ArrowLeft size={16} />
                      Retour
                    </button>
                    <h3 className={styles.journeyTitle}>{selectedJourney.name}</h3>
                    <Badge
                      variant={selectedJourney.active ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {selectedJourney.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className={styles.journeyHeaderActions}>
                    <Switch
                      checked={selectedJourney.active}
                      onChange={() => handleToggleJourney(selectedJourney.id)}
                      size="sm"
                    />
                  </div>
                </div>

                <div className={styles.journeyDetail}>
                  {/* Timeline */}
                  <div>
                    <div className={styles.timeline}>
                      <div className={styles.timelineLine} />
                      {selectedJourney.steps.map((step, index) => {
                        const ChannelIcon = getChannelIcon(step.channel);
                        return (
                          <div
                            key={step.id}
                            className={`${styles.timelineStep} ${styles.animateIn}`}
                            style={{ animationDelay: `${index * 60}ms` }}
                          >
                            <div
                              className={`${styles.timelineStepDot} ${
                                step.active
                                  ? styles.timelineStepDotActive
                                  : styles.timelineStepDotInactive
                              }`}
                            />
                            <Card
                              padding="md"
                              className={`${styles.stepCard} ${
                                !step.active ? styles.stepCardInactive : ''
                              }`}
                            >
                              <div className={styles.stepCardTop}>
                                <div className={styles.stepCardInfo}>
                                  <p className={styles.stepNumber}>Etape {index + 1}</p>
                                  <h4 className={styles.stepName}>{step.name}</h4>
                                  <p className={styles.stepTemplate}>{step.description}</p>
                                </div>
                                <div className={styles.stepCardActions}>
                                  <button
                                    className={styles.stepMoveBtn}
                                    onClick={() => handleMoveStep(selectedJourney.id, step.id, 'up')}
                                    disabled={index === 0}
                                    title="Monter"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    className={styles.stepMoveBtn}
                                    onClick={() => handleMoveStep(selectedJourney.id, step.id, 'down')}
                                    disabled={index === selectedJourney.steps.length - 1}
                                    title="Descendre"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                  <button
                                    className={styles.stepMoveBtn}
                                    onClick={() => handleOpenEditStep(step)}
                                    title="Modifier"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className={styles.stepDetailsRow}>
                                <span
                                  className={`${styles.stepChannelBadge} ${
                                    step.channel === 'email'
                                      ? styles.stepChannelEmail
                                      : step.channel === 'sms'
                                      ? styles.stepChannelSms
                                      : styles.stepChannelPush
                                  }`}
                                >
                                  <ChannelIcon size={10} />
                                  {getChannelLabel(step.channel)}
                                </span>
                                <span className={styles.stepDelay}>
                                  <Clock size={10} />
                                  {step.delayLabel}
                                </span>
                                {step.condition && (
                                  <span className={styles.stepCondition}>
                                    <Filter size={10} />
                                    {step.condition}
                                  </span>
                                )}
                              </div>

                              <div className={styles.stepFooter}>
                                <span className={styles.stepToggleLabel}>
                                  {step.active ? 'Active' : 'Desactivee'}
                                </span>
                                <Switch
                                  checked={step.active}
                                  onChange={() => handleToggleStep(selectedJourney.id, step.id)}
                                  size="sm"
                                />
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className={styles.journeySidebar}>
                    {/* Summary Card */}
                    <Card padding="md">
                      <h4 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-4)' }}>
                        Resume du parcours
                      </h4>
                      <div className={styles.summaryList}>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryLabel}>Type</span>
                          <span className={styles.summaryValue}>
                            {selectedJourney.type === 'standard'
                              ? 'Standard'
                              : selectedJourney.type === 'vip'
                              ? 'VIP'
                              : 'Express'}
                          </span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryLabel}>Etapes totales</span>
                          <span className={styles.summaryValue}>{selectedJourney.steps.length}</span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryLabel}>Etapes actives</span>
                          <span className={styles.summaryValue}>{journeySummary?.activeSteps ?? 0}</span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryLabel}>Derniere modification</span>
                          <span className={styles.summaryValue}>
                            {formatRelativeTime(selectedJourney.lastModified)}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Channel Distribution Card */}
                    <Card padding="md">
                      <h4 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-4)' }}>
                        Canaux utilises
                      </h4>
                      {journeySummary && (
                        <div className={styles.channelDistribution}>
                          <div className={styles.channelRow}>
                            <span className={styles.channelLabel}>
                              <Mail size={12} />
                              Email
                            </span>
                            <div className={styles.channelBar}>
                              <div
                                className={`${styles.channelBarFill} ${styles.channelBarEmail}`}
                                style={{
                                  width: journeySummary.totalActive > 0
                                    ? `${(journeySummary.emailCount / journeySummary.totalActive) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span className={styles.channelCount}>{journeySummary.emailCount}</span>
                          </div>
                          <div className={styles.channelRow}>
                            <span className={styles.channelLabel}>
                              <MessageSquare size={12} />
                              SMS
                            </span>
                            <div className={styles.channelBar}>
                              <div
                                className={`${styles.channelBarFill} ${styles.channelBarSms}`}
                                style={{
                                  width: journeySummary.totalActive > 0
                                    ? `${(journeySummary.smsCount / journeySummary.totalActive) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span className={styles.channelCount}>{journeySummary.smsCount}</span>
                          </div>
                          <div className={styles.channelRow}>
                            <span className={styles.channelLabel}>
                              <Bell size={12} />
                              Push
                            </span>
                            <div className={styles.channelBar}>
                              <div
                                className={`${styles.channelBarFill} ${styles.channelBarPush}`}
                                style={{
                                  width: journeySummary.totalActive > 0
                                    ? `${(journeySummary.pushCount / journeySummary.totalActive) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span className={styles.channelCount}>{journeySummary.pushCount}</span>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create Automation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="md"
      >
        <ModalHeader
          title="Nouvelle automation"
          subtitle="Configurez votre workflow automatise"
          onClose={() => setIsCreateModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.formGroup}>
            <label htmlFor="automation-name" className={styles.formLabel}>Nom *</label>
            <input
              id="automation-name"
              type="text"
              className={styles.formInput}
              placeholder="Ex: Confirmation de reservation"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="automation-description" className={styles.formLabel}>Description</label>
            <textarea
              id="automation-description"
              className={styles.formTextarea}
              placeholder="Decrivez ce que fait cette automation..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="automation-trigger" className={styles.formLabel}>Declencheur</label>
            <select
              id="automation-trigger"
              className={styles.formSelect}
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
            >
              {triggerOptions.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {trigger}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="automation-action" className={styles.formLabel}>Action</label>
            <select
              id="automation-action"
              className={styles.formSelect}
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            >
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formToggleRow}>
            <div className={styles.formToggleLabel}>
              <span className={styles.formToggleLabelText}>Activer immediatement</span>
              <span className={styles.formToggleLabelHint}>
                L'automation sera executee des sa creation
              </span>
            </div>
            <Switch
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={<Zap size={16} />}
            onClick={handleCreateAutomation}
            disabled={!newName.trim()}
          >
            Creer l'automation
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Step Modal */}
      <Modal
        isOpen={isStepEditModalOpen}
        onClose={() => setIsStepEditModalOpen(false)}
        size="md"
      >
        <ModalHeader
          title="Modifier l'etape"
          subtitle={editingStep?.name ?? ''}
          onClose={() => setIsStepEditModalOpen(false)}
        />
        <ModalBody>
          <div className={styles.formGroup}>
            <label htmlFor="step-name" className={styles.formLabel}>Nom de l'etape</label>
            <input
              id="step-name"
              type="text"
              className={styles.formInput}
              value={editStepName}
              onChange={(e) => setEditStepName(e.target.value)}
            />
          </div>

          <div className={styles.stepEditGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="step-channel" className={styles.formLabel}>Canal</label>
              <select
                id="step-channel"
                className={styles.formSelect}
                value={editStepChannel}
                onChange={(e) => setEditStepChannel(e.target.value as JourneyChannel)}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="step-delay" className={styles.formLabel}>Delai (code)</label>
              <input
                id="step-delay"
                type="text"
                className={styles.formInput}
                placeholder="Ex: -24h, +1h, 0m"
                value={editStepDelay}
                onChange={(e) => setEditStepDelay(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="step-delay-label" className={styles.formLabel}>Libelle du delai</label>
            <input
              id="step-delay-label"
              type="text"
              className={styles.formInput}
              placeholder="Ex: 24h avant, J+1, A l'arrivee"
              value={editStepDelayLabel}
              onChange={(e) => setEditStepDelayLabel(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="step-template" className={styles.formLabel}>Modele de message</label>
            <textarea
              id="step-template"
              className={styles.formTextarea}
              placeholder="Utilisez {prenom}, {studio}, {date}, {heure}..."
              value={editStepTemplate}
              onChange={(e) => setEditStepTemplate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="step-condition" className={styles.formLabel}>Condition (optionnel)</label>
            <input
              id="step-condition"
              type="text"
              className={styles.formInput}
              placeholder="Ex: Premiere visite, Session en cours"
              value={editStepCondition}
              onChange={(e) => setEditStepCondition(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsStepEditModalOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            icon={<CheckCircle size={16} />}
            onClick={handleSaveStep}
            disabled={!editStepName.trim()}
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
