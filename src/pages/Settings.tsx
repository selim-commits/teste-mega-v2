import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Clock,
  Bell,
  CreditCard,
  CalendarCog,
  Plug,
  Save,
  Upload,
  Link2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { DEMO_STUDIO_ID } from '../stores/authStore';
import { useStudioSettings, useUpdateProfile } from '../hooks/useSettings';
import type { StudioSettings } from '../services/settings';
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

// Interfaces for form data
interface StudioProfile {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  timezone: string;
  currency: string;
}

interface DayHours {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  splitEnabled: boolean;
  splitStartTime: string;
  splitEndTime: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BookingSettings {
  defaultDuration: string;
  bufferTime: string;
  minAdvanceTime: string;
  maxAdvanceTime: string;
  cancellationPolicy: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminder24h: boolean;
  reminder48h: boolean;
  reminder1Week: boolean;
  newBookingAlert: boolean;
  cancellationAlert: boolean;
  paymentAlert: boolean;
}

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Default values
const defaultStudioProfile: StudioProfile = {
  name: 'ROOOM Studio',
  slug: 'rooom-studio',
  description: 'Studio photo et video professionnel au coeur de Paris. Espaces modulables pour tous types de productions.',
  logoUrl: '',
  coverUrl: '',
  email: 'contact@rooom.studio',
  phone: '+33 1 42 68 53 00',
  website: 'https://rooom.studio',
  address: '15 Rue de Bretagne',
  city: 'Paris',
  postalCode: '75003',
  country: 'France',
  timezone: 'Europe/Paris',
  currency: 'EUR',
};

const defaultBusinessHours: BusinessHours = {
  monday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  tuesday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  wednesday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  thursday: { enabled: true, openTime: '09:00', closeTime: '19:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  friday: { enabled: true, openTime: '09:00', closeTime: '18:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  saturday: { enabled: true, openTime: '10:00', closeTime: '17:00', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
  sunday: { enabled: false, openTime: '', closeTime: '', splitEnabled: false, splitStartTime: '', splitEndTime: '' },
};

const defaultBookingSettings: BookingSettings = {
  defaultDuration: '60',
  bufferTime: '15',
  minAdvanceTime: '24',
  maxAdvanceTime: '90',
  cancellationPolicy: 'Les annulations doivent etre effectuees au moins 48 heures avant la reservation. Les annulations tardives peuvent entrainer des frais.',
};

const defaultNotificationSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  reminder24h: true,
  reminder48h: false,
  reminder1Week: false,
  newBookingAlert: true,
  cancellationAlert: true,
  paymentAlert: true,
};

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  // Use DEMO_STUDIO_ID for now (reserved for future API integration)
  void DEMO_STUDIO_ID;

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

function StudioProfileSection() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<StudioProfile>(defaultStudioProfile);

  // Fetch studio data from Supabase
  const { data: studio, isLoading: isFetching } = useStudioSettings(DEMO_STUDIO_ID);
  const updateProfile = useUpdateProfile(DEMO_STUDIO_ID);

  // Sync form with fetched data
  useEffect(() => {
    if (studio) {
      const settings = studio.settings as StudioSettings | null;
      setProfile({
        name: studio.name || defaultStudioProfile.name,
        slug: studio.slug || defaultStudioProfile.slug,
        description: settings?.profile?.description || defaultStudioProfile.description,
        logoUrl: settings?.profile?.logoUrl || defaultStudioProfile.logoUrl,
        coverUrl: settings?.profile?.coverUrl || defaultStudioProfile.coverUrl,
        email: studio.email || defaultStudioProfile.email,
        phone: studio.phone || defaultStudioProfile.phone,
        website: settings?.profile?.website || defaultStudioProfile.website,
        address: studio.address || defaultStudioProfile.address,
        city: studio.city || defaultStudioProfile.city,
        postalCode: studio.postal_code || defaultStudioProfile.postalCode,
        country: studio.country || defaultStudioProfile.country,
        timezone: studio.timezone || defaultStudioProfile.timezone,
        currency: studio.currency || defaultStudioProfile.currency,
      });
    }
  }, [studio]);

  const handleNameChange = (value: string) => {
    setProfile(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: profile.name,
        slug: profile.slug,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postalCode,
        country: profile.country,
        timezone: profile.timezone,
        currency: profile.currency,
        description: profile.description,
        logoUrl: profile.logoUrl,
        coverUrl: profile.coverUrl,
        website: profile.website,
      });
      addToast({
        title: 'Profil mis a jour',
        description: 'Les informations du studio ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications.',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const isLoading = updateProfile.isPending || isFetching;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profil du studio</h2>
          <p className={styles.sectionDescription}>
            Informations generales et coordonnees de votre studio
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          {/* Logo and Cover */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Logo du studio</label>
              <div className={styles.logoUploadContainer}>
                <div className={styles.uploadAreaSmall}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" className={styles.logoPreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={20} />
                      <span className={styles.uploadHint}>Logo</span>
                    </div>
                  )}
                </div>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={profile.logoUrl}
                  onChange={(e) => setProfile(prev => ({ ...prev, logoUrl: e.target.value }))}
                  icon={<Link2 size={16} />}
                  fullWidth
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Image de couverture</label>
              <div className={styles.logoUploadContainer}>
                <div className={styles.uploadAreaSmall}>
                  {profile.coverUrl ? (
                    <img src={profile.coverUrl} alt="Cover" className={styles.logoPreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={20} />
                      <span className={styles.uploadHint}>Cover</span>
                    </div>
                  )}
                </div>
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={profile.coverUrl}
                  onChange={(e) => setProfile(prev => ({ ...prev, coverUrl: e.target.value }))}
                  icon={<Link2 size={16} />}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Name and Slug */}
          <div className={styles.formRow}>
            <Input
              label="Nom du studio"
              placeholder="Mon Studio Photo"
              value={profile.name}
              onChange={(e) => handleNameChange(e.target.value)}
              fullWidth
            />
            <div className={styles.formGroup}>
              <Input
                label="Slug (URL)"
                placeholder="mon-studio-photo"
                value={profile.slug}
                onChange={(e) => setProfile(prev => ({ ...prev, slug: e.target.value }))}
                fullWidth
                hint="Utilise dans l'URL de votre page publique"
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Decrivez votre studio..."
              rows={4}
              value={profile.description}
              onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Contact Info */}
          <div className={styles.formRow}>
            <Input
              label="Email de contact"
              type="email"
              placeholder="contact@monstudio.com"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <Input
              label="Telephone"
              type="tel"
              placeholder="+33 1 23 45 67 89"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
          </div>

          {/* Website */}
          <Input
            label="Site web"
            type="url"
            placeholder="https://www.monstudio.com"
            value={profile.website}
            onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
            icon={<ExternalLink size={16} />}
            fullWidth
          />

          {/* Address */}
          <Input
            label="Adresse"
            placeholder="123 Rue de la Photo"
            value={profile.address}
            onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
            fullWidth
          />

          <div className={styles.formRow}>
            <Input
              label="Ville"
              placeholder="Paris"
              value={profile.city}
              onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
              fullWidth
            />
            <Input
              label="Code postal"
              placeholder="75001"
              value={profile.postalCode}
              onChange={(e) => setProfile(prev => ({ ...prev, postalCode: e.target.value }))}
              fullWidth
            />
          </div>

          <Input
            label="Pays"
            placeholder="France"
            value={profile.country}
            onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
            fullWidth
          />

          {/* Timezone and Currency */}
          <div className={styles.formRow}>
            <Select
              label="Fuseau horaire"
              options={[
                { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
                { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
                { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
                { value: 'Europe/Brussels', label: 'Europe/Brussels (UTC+1)' },
                { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8)' },
              ]}
              value={profile.timezone}
              onChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}
              fullWidth
            />
            <Select
              label="Devise"
              options={[
                { value: 'EUR', label: 'Euro (EUR)' },
                { value: 'USD', label: 'Dollar US (USD)' },
                { value: 'GBP', label: 'Livre Sterling (GBP)' },
                { value: 'CHF', label: 'Franc Suisse (CHF)' },
                { value: 'CAD', label: 'Dollar Canadien (CAD)' },
              ]}
              value={profile.currency}
              onChange={(value) => setProfile(prev => ({ ...prev, currency: value }))}
              fullWidth
            />
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function BusinessHoursSection() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState<BusinessHours>(defaultBusinessHours);

  const dayLabels: Record<keyof BusinessHours, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  };

  const updateDay = (day: keyof BusinessHours, updates: Partial<DayHours>) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({
        title: 'Horaires mis a jour',
        description: 'Les heures d\'ouverture ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les horaires.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Horaires d'ouverture</h2>
          <p className={styles.sectionDescription}>
            Definissez vos heures d'ouverture hebdomadaires
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.scheduleList}>
            {(Object.keys(hours) as Array<keyof BusinessHours>).map((day) => (
              <div key={day} className={styles.scheduleItem}>
                <div className={styles.scheduleDay}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={hours[day].enabled}
                      onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                  <span className={hours[day].enabled ? styles.dayLabel : styles.dayLabelDisabled}>
                    {dayLabels[day]}
                  </span>
                </div>
                {hours[day].enabled ? (
                  <div className={styles.scheduleHoursContainer}>
                    <div className={styles.scheduleHours}>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={hours[day].openTime}
                        onChange={(e) => updateDay(day, { openTime: e.target.value })}
                      />
                      <span className={styles.timeSeparator}>a</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={hours[day].closeTime}
                        onChange={(e) => updateDay(day, { closeTime: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.splitButton} ${hours[day].splitEnabled ? styles.splitButtonActive : ''}`}
                      onClick={() => updateDay(day, { splitEnabled: !hours[day].splitEnabled })}
                    >
                      + Pause
                    </button>
                    {hours[day].splitEnabled && (
                      <div className={styles.scheduleHours}>
                        <span className={styles.splitLabel}>Pause:</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={hours[day].splitStartTime}
                          onChange={(e) => updateDay(day, { splitStartTime: e.target.value })}
                        />
                        <span className={styles.timeSeparator}>a</span>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={hours[day].splitEndTime}
                          onChange={(e) => updateDay(day, { splitEndTime: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className={styles.closedLabel}>Ferme</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function BookingSettingsSection() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<BookingSettings>(defaultBookingSettings);

  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 heure' },
    { value: '120', label: '2 heures' },
    { value: '240', label: 'Demi-journee (4h)' },
    { value: '480', label: 'Journee complete (8h)' },
  ];

  const bufferOptions = [
    { value: '0', label: 'Pas de tampon' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 heure' },
  ];

  const minAdvanceOptions = [
    { value: '1', label: '1 heure' },
    { value: '2', label: '2 heures' },
    { value: '24', label: '24 heures' },
    { value: '48', label: '48 heures' },
    { value: '168', label: '1 semaine' },
  ];

  const maxAdvanceOptions = [
    { value: '7', label: '1 semaine' },
    { value: '14', label: '2 semaines' },
    { value: '30', label: '1 mois' },
    { value: '90', label: '3 mois' },
    { value: '180', label: '6 mois' },
    { value: '365', label: '1 an' },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({
        title: 'Parametres mis a jour',
        description: 'Les parametres de reservation ont ete enregistres.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les parametres.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Parametres de reservation</h2>
          <p className={styles.sectionDescription}>
            Configurez les regles de reservation de votre studio
          </p>
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.formRow}>
            <Select
              label="Duree par defaut"
              options={durationOptions}
              value={settings.defaultDuration}
              onChange={(value) => setSettings(prev => ({ ...prev, defaultDuration: value }))}
              fullWidth
            />
            <Select
              label="Temps tampon entre reservations"
              options={bufferOptions}
              value={settings.bufferTime}
              onChange={(value) => setSettings(prev => ({ ...prev, bufferTime: value }))}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Select
              label="Delai minimum avant reservation"
              options={minAdvanceOptions}
              value={settings.minAdvanceTime}
              onChange={(value) => setSettings(prev => ({ ...prev, minAdvanceTime: value }))}
              fullWidth
            />
            <Select
              label="Delai maximum avant reservation"
              options={maxAdvanceOptions}
              value={settings.maxAdvanceTime}
              onChange={(value) => setSettings(prev => ({ ...prev, maxAdvanceTime: value }))}
              fullWidth
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Politique d'annulation</label>
            <textarea
              className={styles.textarea}
              placeholder="Decrivez votre politique d'annulation..."
              rows={4}
              value={settings.cancellationPolicy}
              onChange={(e) => setSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
            />
            <span className={styles.hint}>
              Cette politique sera affichee aux clients lors de la reservation.
            </span>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function NotificationsSection() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({
        title: 'Notifications mises a jour',
        description: 'Vos preferences de notifications ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les preferences.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <p className={styles.sectionDescription}>
            Gerez vos preferences de notifications et rappels
          </p>
        </div>

        {/* Email & SMS Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Canaux de communication</h3>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Notifications par email</span>
                <span className={styles.notificationDescription}>
                  Recevez les notifications par email
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Notifications SMS</span>
                <span className={styles.notificationDescription}>
                  Recevez les notifications par SMS (bientot disponible)
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                  disabled
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </Card>

        {/* Reminder Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Rappels automatiques</h3>
          <p className={styles.subsectionDescription}>
            Envoyez des rappels automatiques aux clients avant leurs reservations
          </p>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 24h avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 24 heures avant la reservation
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.reminder24h}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder24h: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 48h avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 48 heures avant la reservation
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.reminder48h}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder48h: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Rappel 1 semaine avant</span>
                <span className={styles.notificationDescription}>
                  Envoyer un rappel 1 semaine avant la reservation
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.reminder1Week}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminder1Week: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </Card>

        {/* Alert Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Alertes d'activite</h3>
          <p className={styles.subsectionDescription}>
            Soyez informe des evenements importants
          </p>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Nouvelle reservation</span>
                <span className={styles.notificationDescription}>
                  Recevoir une alerte pour chaque nouvelle reservation
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.newBookingAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, newBookingAlert: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Annulation</span>
                <span className={styles.notificationDescription}>
                  Etre prevenu en cas d'annulation
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.cancellationAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, cancellationAlert: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Paiement recu</span>
                <span className={styles.notificationDescription}>
                  Confirmation de reception de paiement
                </span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.paymentAlert}
                  onChange={(e) => setSettings(prev => ({ ...prev, paymentAlert: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function IntegrationsSection() {
  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Synchronisez automatiquement vos reservations avec Google Calendar pour une vue unifiee de votre emploi du temps.',
      icon: '📅',
      connected: false,
      status: 'Non connecte',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Acceptez les paiements en ligne de maniere securisee. Cartes bancaires, Apple Pay, Google Pay et plus.',
      icon: '💳',
      connected: false,
      status: 'Non connecte',
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Envoyez des emails transactionnels et des notifications professionnelles a vos clients.',
      icon: '📧',
      connected: false,
      status: 'Non connecte',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Integrations</h2>
          <p className={styles.sectionDescription}>
            Connectez ROOOM a vos outils preferes pour automatiser votre workflow
          </p>
        </div>

        <div className={styles.integrationsGrid}>
          {integrations.map((integration) => (
            <Card key={integration.id} padding="lg" className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <span className={styles.integrationIcon}>{integration.icon}</span>
                <div className={styles.integrationInfo}>
                  <h3 className={styles.integrationName}>{integration.name}</h3>
                  <p className={styles.integrationDescription}>{integration.description}</p>
                </div>
              </div>
              <div className={styles.integrationStatus}>
                <div className={styles.statusIndicator}>
                  <span className={`${styles.statusDot} ${integration.connected ? styles.statusConnected : styles.statusDisconnected}`}></span>
                  <span className={styles.statusText}>{integration.status}</span>
                </div>
              </div>
              <div className={styles.integrationActions}>
                {integration.connected ? (
                  <>
                    <Button variant="ghost" size="sm">
                      Configurer
                    </Button>
                    <Button variant="ghost" size="sm" className={styles.disconnectButton}>
                      Deconnecter
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink size={14} />}
                    disabled
                  >
                    Connecter
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card padding="lg" className={styles.formCard}>
          <div className={styles.integrationNote}>
            <span className={styles.noteIcon}>💡</span>
            <div className={styles.noteContent}>
              <h4 className={styles.noteTitle}>Integrations a venir</h4>
              <p className={styles.noteText}>
                Les integrations sont actuellement en developpement. Vous serez notifie des qu'elles seront disponibles.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

// Billing settings interface
interface BillingSettings {
  vatRate: string;
  paymentTerms: string;
  legalMentions: string;
  siret: string;
  vatNumber: string;
}

const defaultBillingSettings: BillingSettings = {
  vatRate: '20',
  paymentTerms: 'Paiement a la reservation. Annulation gratuite jusqu\'a 48h avant.',
  legalMentions: 'ROOOM Studio - SARL au capital de 10 000 EUR\nRCS Paris B 123 456 789',
  siret: '123 456 789 00012',
  vatNumber: 'FR 12 123456789',
};

function BillingSection() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<BillingSettings>(defaultBillingSettings);

  const vatRateOptions = [
    { value: '0', label: '0% (Exonere)' },
    { value: '5.5', label: '5,5% (Taux reduit)' },
    { value: '10', label: '10% (Taux intermediaire)' },
    { value: '20', label: '20% (Taux normal)' },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({
        title: 'Facturation mise a jour',
        description: 'Les informations de facturation ont ete enregistrees.',
        variant: 'success',
        duration: 5000,
      });
    } catch {
      addToast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturation</h2>
          <p className={styles.sectionDescription}>
            Configurez vos informations de facturation et mentions legales
          </p>
        </div>

        {/* Tax Settings */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Parametres de TVA</h3>
          <p className={styles.subsectionDescription}>
            Configurez le taux de TVA applique a vos prestations
          </p>

          <Select
            label="Taux de TVA"
            options={vatRateOptions}
            value={settings.vatRate}
            onChange={(value) => setSettings(prev => ({ ...prev, vatRate: value }))}
            fullWidth
          />
        </Card>

        {/* Payment Terms */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Conditions de paiement</h3>
          <p className={styles.subsectionDescription}>
            Definissez vos conditions de paiement affichees sur les factures
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Conditions de paiement</label>
            <textarea
              className={styles.textarea}
              placeholder="Ex: Paiement a la reservation. Annulation gratuite jusqu'a 48h avant."
              rows={3}
              value={settings.paymentTerms}
              onChange={(e) => setSettings(prev => ({ ...prev, paymentTerms: e.target.value }))}
            />
          </div>
        </Card>

        {/* Legal Information */}
        <Card padding="lg" className={styles.formCard}>
          <h3 className={styles.subsectionTitle}>Informations legales</h3>
          <p className={styles.subsectionDescription}>
            Ces informations apparaitront sur vos factures
          </p>

          <div className={styles.formRow}>
            <Input
              label="SIRET"
              placeholder="123 456 789 00012"
              value={settings.siret}
              onChange={(e) => setSettings(prev => ({ ...prev, siret: e.target.value }))}
              fullWidth
            />
            <Input
              label="N° TVA Intracommunautaire"
              placeholder="FR 12 123456789"
              value={settings.vatNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
              fullWidth
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mentions legales</label>
            <textarea
              className={styles.textarea}
              placeholder="Raison sociale, forme juridique, capital social, RCS..."
              rows={4}
              value={settings.legalMentions}
              onChange={(e) => setSettings(prev => ({ ...prev, legalMentions: e.target.value }))}
            />
            <span className={styles.hint}>
              Ces mentions seront incluses sur toutes vos factures.
            </span>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isLoading}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
