import { useState } from 'react';
import {
  Building2,
  Clock,
  Bell,
  CreditCard,
  CalendarCog,
  Plug,
  ShieldX,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { useAuthContext } from '../contexts/AuthContext';
import { useTeamMembersByUser } from '../hooks/useTeam';
import { DEMO_STUDIO_ID } from '../stores/authStore';
import { StudioProfileSection } from './settings/StudioProfileSection';
import { BusinessHoursSection } from './settings/BusinessHoursSection';
import { BookingSettingsSection } from './settings/BookingSettingsSection';
import { NotificationsSection } from './settings/NotificationsSection';
import { IntegrationsSection } from './settings/IntegrationsSection';
import { BillingSection } from './settings/BillingSection';
import { CancellationPolicySection } from './settings/CancellationPolicySection';
import styles from './Settings.module.css';

// Settings tabs configuration
const settingsTabs = [
  { id: 'profile', label: 'Profil Studio', icon: Building2 },
  { id: 'hours', label: 'Horaires', icon: Clock },
  { id: 'booking', label: 'Reservations', icon: CalendarCog },
  { id: 'cancellation', label: 'Annulations', icon: ShieldX },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuthContext();
  const { data: teamMemberships } = useTeamMembersByUser(user?.id || '');
  const studioId = teamMemberships?.[0]?.studio_id || DEMO_STUDIO_ID;

  return (
    <div className={styles.page}>
      <Header
        title="Parametres"
        subtitle="Configurez votre espace de travail"
      />

      <div className={styles.content}>
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={styles.tabsList}>
            {settingsTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} icon={<tab.icon size={16} />}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={styles.tabsContent}>
            <TabsContent value="profile">
              <StudioProfileSection studioId={studioId} />
            </TabsContent>
            <TabsContent value="hours">
              <BusinessHoursSection studioId={studioId} />
            </TabsContent>
            <TabsContent value="booking">
              <BookingSettingsSection studioId={studioId} />
            </TabsContent>
            <TabsContent value="cancellation">
              <CancellationPolicySection studioId={studioId} />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsSection studioId={studioId} />
            </TabsContent>
            <TabsContent value="integrations">
              <IntegrationsSection />
            </TabsContent>
            <TabsContent value="billing">
              <BillingSection studioId={studioId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
