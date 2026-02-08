import { useState } from 'react';
import {
  Upload,
  Link2,
  ExternalLink,
  Save,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import {
  useStudioSettings,
  useUpdateProfile,
} from '../../hooks/useSettings';
import type { StudioSettings } from '../../services/settings';
import type { StudioProfile } from './types';
import { defaultStudioProfile, generateSlug } from './types';
import styles from '../Settings.module.css';

interface StudioProfileSectionProps {
  studioId: string;
}

export function StudioProfileSection({ studioId }: StudioProfileSectionProps) {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<StudioProfile>(defaultStudioProfile);

  // Fetch studio data from Supabase
  const { data: studio, isLoading: isFetching } = useStudioSettings(studioId);
  const updateProfile = useUpdateProfile(studioId);

  // Sync form with fetched data (React recommended pattern for prop-driven state)
  const [prevStudio, setPrevStudio] = useState(studio);
  if (studio !== prevStudio) {
    setPrevStudio(studio);
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
  }

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
    <div className={styles.animateIn}>
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
              <span className={styles.label}>Logo du studio</span>
              <div className={styles.logoUploadContainer}>
                <div className={styles.uploadAreaSmall}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo du studio" className={styles.logoPreview} />
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
              <span className={styles.label}>Image de couverture</span>
              <div className={styles.logoUploadContainer}>
                <div className={styles.uploadAreaSmall}>
                  {profile.coverUrl ? (
                    <img src={profile.coverUrl} alt="Couverture du studio" className={styles.logoPreview} />
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
            <label className={styles.label} htmlFor="studio-description">Description</label>
            <textarea
              id="studio-description"
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
    </div>
  );
}
