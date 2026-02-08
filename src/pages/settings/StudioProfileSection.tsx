import { useState, useEffect } from 'react';
import {
  Upload,
  Link2,
  ExternalLink,
  Save,
  Camera,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNotifications } from '../../stores/uiStore';
import type { StudioProfile } from './types';
import { defaultStudioProfile, generateSlug } from './types';
import styles from '../Settings.module.css';

const STORAGE_KEY = 'rooom-settings-profile';

const businessTypeOptions = [
  { value: 'studio-photo', label: 'Studio photo' },
  { value: 'studio-video', label: 'Studio video' },
  { value: 'studio-mixte', label: 'Studio mixte' },
  { value: 'espace-creatif', label: 'Espace creatif' },
];

function loadFromStorage(): StudioProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as StudioProfile;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(data: StudioProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface StudioProfileSectionProps {
  studioId: string;
}

export function StudioProfileSection({ studioId: _studioId }: StudioProfileSectionProps) {
  const { success, error: notifyError } = useNotifications();
  const [profile, setProfile] = useState<StudioProfile>(() => {
    return loadFromStorage() || defaultStudioProfile;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state on mount from localStorage
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setProfile(stored);
    }
  }, []);

  const handleNameChange = (value: string) => {
    setProfile(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const handleLogoChange = () => {
    success(
      'Changement de logo',
      'Cette fonctionnalite sera disponible prochainement.'
    );
  };

  const handleSave = () => {
    // Basic validation
    if (!profile.name.trim()) {
      notifyError('Erreur de validation', 'Le nom du studio est obligatoire.');
      return;
    }
    if (!profile.email.trim()) {
      notifyError('Erreur de validation', "L'email de contact est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
      saveToStorage(profile);
      success(
        'Profil mis a jour',
        'Les informations du studio ont ete enregistrees.'
      );
    } catch {
      notifyError(
        'Erreur',
        'Impossible de sauvegarder les modifications.'
      );
    } finally {
      setIsSaving(false);
    }
  };

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
                      <Camera size={20} />
                      <span className={styles.uploadHint}>Logo</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={14} />}
                  onClick={handleLogoChange}
                >
                  Changer le logo
                </Button>
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

          {/* Business Type */}
          <Select
            label="Type d'activite"
            options={businessTypeOptions}
            value={profile.businessType}
            onChange={(value) => setProfile(prev => ({ ...prev, businessType: value }))}
            fullWidth
          />

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
              loading={isSaving}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
