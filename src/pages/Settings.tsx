import { useState } from 'react';
import {
  Building2,
  Clock,
  Bell,
  CreditCard,
  CalendarCog,
  Plug,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { StudioProfileSection } from './settings/StudioProfileSection';
import { BusinessHoursSection } from './settings/BusinessHoursSection';
import { BookingSettingsSection } from './settings/BookingSettingsSection';
import { NotificationsSection } from './settings/NotificationsSection';
import { IntegrationsSection } from './settings/IntegrationsSection';
import { BillingSection } from './settings/BillingSection';
import styles from './Settings.module.css';

// Settings tabs configuration
const settingsTabs = [
  { id: 'profile', label: 'Profil Studio', icon: Building2 },
  { id: 'hours', label: 'Horaires', icon: Clock },
  { id: 'booking', label: 'Reservations', icon: CalendarCog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

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
              <StudioProfileSection />
            </TabsContent>
            <TabsContent value="hours">
              <BusinessHoursSection />
            </TabsContent>
            <TabsContent value="booking">
              <BookingSettingsSection />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsSection />
            </TabsContent>
            <TabsContent value="integrations">
              <IntegrationsSection />
            </TabsContent>
            <TabsContent value="billing">
              <BillingSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
