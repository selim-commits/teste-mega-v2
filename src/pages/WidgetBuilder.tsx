import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Download, RotateCcw } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { WidgetTypeSelector } from '../components/widget-builder/WidgetTypeSelector';
import { AppearanceEditor } from '../components/widget-builder/AppearanceEditor';
import { ContentEditor } from '../components/widget-builder/ContentEditor';
import { BehaviorEditor } from '../components/widget-builder/BehaviorEditor';
import { CustomCSSEditor } from '../components/widget-builder/CustomCSSEditor';
import { WidgetPreview } from '../components/widget-builder/WidgetPreview';
import { DeviceSelector, type DeviceType } from '../components/widget-builder/DeviceSelector';
import { EmbedCodeDisplay } from '../components/widget-builder/EmbedCodeDisplay';
import { ThemePresets } from '../components/widget-builder/ThemePresets';
import { SavedConfigs } from '../components/widget-builder/SavedConfigs';
import styles from './WidgetBuilder.module.css';

// Widget configuration types
export type WidgetType = 'booking' | 'chat' | 'packs';

export interface WidgetAppearance {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  mode: 'light' | 'dark' | 'auto';
}

export interface WidgetContent {
  logoUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  welcomeMessage: string;
  successMessage: string;
}

export interface WidgetBehavior {
  autoOpen: boolean;
  autoOpenDelay: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showOnMobile: boolean;
  animationType: 'fade' | 'slide' | 'scale';
  closeOnOutsideClick: boolean;
}

export interface WidgetConfig {
  id: string;
  name: string;
  type: WidgetType;
  appearance: WidgetAppearance;
  content: WidgetContent;
  behavior: WidgetBehavior;
  customCSS: string;
  createdAt: string;
  updatedAt: string;
}

// Default configuration
const defaultAppearance: WidgetAppearance = {
  primaryColor: '#1E3A5F',
  secondaryColor: '#6B6B6B',
  backgroundColor: '#FFFFFF',
  textColor: '#1A1A1A',
  fontFamily: 'Inter',
  borderRadius: 8,
  mode: 'light',
};

const defaultContent: WidgetContent = {
  logoUrl: '',
  title: 'Reservez votre session',
  subtitle: 'Choisissez un creneau qui vous convient',
  buttonText: 'Reserver maintenant',
  welcomeMessage: 'Bienvenue! Comment pouvons-nous vous aider?',
  successMessage: 'Merci! Votre reservation a ete confirmee.',
};

const defaultBehavior: WidgetBehavior = {
  autoOpen: false,
  autoOpenDelay: 5,
  position: 'bottom-right',
  showOnMobile: true,
  animationType: 'slide',
  closeOnOutsideClick: true,
};

const createDefaultConfig = (type: WidgetType = 'booking'): Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: 'Nouveau widget',
  type,
  appearance: { ...defaultAppearance },
  content: { ...defaultContent },
  behavior: { ...defaultBehavior },
  customCSS: '',
});

export function WidgetBuilder() {
  const { addToast } = useToast();

  // Widget configuration state
  const [widgetType, setWidgetType] = useState<WidgetType>('booking');
  const [appearance, setAppearance] = useState<WidgetAppearance>(defaultAppearance);
  const [content, setContent] = useState<WidgetContent>(defaultContent);
  const [behavior, setBehavior] = useState<WidgetBehavior>(defaultBehavior);
  const [customCSS, setCustomCSS] = useState('');
  const [configName, setConfigName] = useState('Mon Widget');

  // Preview state
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Saved configs state
  const [savedConfigs, setSavedConfigs] = useState<WidgetConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);

  // Handlers
  const handleWidgetTypeChange = useCallback((type: WidgetType) => {
    setWidgetType(type);
    setIsPreviewLoading(true);
    // Simulate preview reload
    setTimeout(() => setIsPreviewLoading(false), 500);
  }, []);

  const handleAppearanceChange = useCallback((updates: Partial<WidgetAppearance>) => {
    setAppearance(prev => ({ ...prev, ...updates }));
  }, []);

  const handleContentChange = useCallback((updates: Partial<WidgetContent>) => {
    setContent(prev => ({ ...prev, ...updates }));
  }, []);

  const handleBehaviorChange = useCallback((updates: Partial<WidgetBehavior>) => {
    setBehavior(prev => ({ ...prev, ...updates }));
  }, []);

  const handleThemePresetSelect = useCallback((preset: WidgetAppearance) => {
    setAppearance(preset);
    addToast({
      title: 'Theme applique',
      description: 'Le theme a ete applique a votre widget.',
      variant: 'success',
      duration: 3000,
    });
  }, [addToast]);

  const handleReset = useCallback(() => {
    const defaults = createDefaultConfig(widgetType);
    setAppearance(defaults.appearance);
    setContent(defaults.content);
    setBehavior(defaults.behavior);
    setCustomCSS('');
    setActiveConfigId(null);
    addToast({
      title: 'Configuration reinitialisee',
      description: 'Les parametres par defaut ont ete restaures.',
      variant: 'info',
      duration: 3000,
    });
  }, [widgetType, addToast]);

  const handleSaveConfig = useCallback(() => {
    const now = new Date().toISOString();
    const newConfig: WidgetConfig = {
      id: activeConfigId || `config-${Date.now()}`,
      name: configName,
      type: widgetType,
      appearance,
      content,
      behavior,
      customCSS,
      createdAt: activeConfigId ? savedConfigs.find(c => c.id === activeConfigId)?.createdAt || now : now,
      updatedAt: now,
    };

    setSavedConfigs(prev => {
      const existing = prev.findIndex(c => c.id === newConfig.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newConfig;
        return updated;
      }
      return [...prev, newConfig];
    });

    setActiveConfigId(newConfig.id);
    addToast({
      title: 'Configuration sauvegardee',
      description: `"${configName}" a ete enregistree.`,
      variant: 'success',
      duration: 3000,
    });
  }, [activeConfigId, configName, widgetType, appearance, content, behavior, customCSS, savedConfigs, addToast]);

  const handleLoadConfig = useCallback((config: WidgetConfig) => {
    setWidgetType(config.type);
    setAppearance(config.appearance);
    setContent(config.content);
    setBehavior(config.behavior);
    setCustomCSS(config.customCSS);
    setConfigName(config.name);
    setActiveConfigId(config.id);
    setShowSavedConfigs(false);
    addToast({
      title: 'Configuration chargee',
      description: `"${config.name}" a ete chargee.`,
      variant: 'success',
      duration: 3000,
    });
  }, [addToast]);

  const handleDeleteConfig = useCallback((configId: string) => {
    setSavedConfigs(prev => prev.filter(c => c.id !== configId));
    if (activeConfigId === configId) {
      setActiveConfigId(null);
    }
    addToast({
      title: 'Configuration supprimee',
      description: 'La configuration a ete supprimee.',
      variant: 'info',
      duration: 3000,
    });
  }, [activeConfigId, addToast]);

  // Build current config for preview/export
  const currentConfig: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    name: configName,
    type: widgetType,
    appearance,
    content,
    behavior,
    customCSS,
  };

  return (
    <div className={styles.page}>
      <Header
        title="Widget Builder"
        subtitle="Configurez et personnalisez vos widgets embarquables"
        action={
          <div className={styles.headerActions}>
            <Button
              variant="ghost"
              icon={<RotateCcw size={16} />}
              onClick={handleReset}
            >
              Reinitialiser
            </Button>
            <Button
              variant="ghost"
              icon={<Download size={16} />}
              onClick={() => setShowSavedConfigs(true)}
            >
              Configs ({savedConfigs.length})
            </Button>
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSaveConfig}
            >
              Sauvegarder
            </Button>
          </div>
        }
      />

      <div className={styles.content}>
        <div className={styles.builder}>
          {/* Left Panel - Configuration */}
          <div className={styles.configPanel}>
            <Card padding="none" className={styles.configCard}>
              {/* Widget Type Selector */}
              <div className={styles.configSection}>
                <WidgetTypeSelector
                  value={widgetType}
                  onChange={handleWidgetTypeChange}
                />
              </div>

              {/* Configuration Tabs */}
              <Tabs defaultValue="appearance" variant="underline">
                <TabsList className={styles.configTabs}>
                  <TabsTrigger value="appearance">Apparence</TabsTrigger>
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="behavior">Comportement</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                </TabsList>

                <div className={styles.configTabContent}>
                  <TabsContent value="appearance">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ThemePresets onSelect={handleThemePresetSelect} />
                      <AppearanceEditor
                        appearance={appearance}
                        onChange={handleAppearanceChange}
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="content">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ContentEditor
                        content={content}
                        onChange={handleContentChange}
                        widgetType={widgetType}
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="behavior">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BehaviorEditor
                        behavior={behavior}
                        onChange={handleBehaviorChange}
                        widgetType={widgetType}
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="css">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CustomCSSEditor
                        value={customCSS}
                        onChange={setCustomCSS}
                      />
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className={styles.previewPanel}>
            <Card padding="none" className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <DeviceSelector value={device} onChange={setDevice} />
              </div>

              <div className={styles.previewContainer}>
                <WidgetPreview
                  config={currentConfig}
                  device={device}
                  isLoading={isPreviewLoading}
                />
              </div>

              <div className={styles.embedSection}>
                <EmbedCodeDisplay config={currentConfig} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Saved Configs Modal */}
      {showSavedConfigs && (
        <SavedConfigs
          configs={savedConfigs}
          activeConfigId={activeConfigId}
          onLoad={handleLoadConfig}
          onDelete={handleDeleteConfig}
          onClose={() => setShowSavedConfigs(false)}
        />
      )}
    </div>
  );
}
