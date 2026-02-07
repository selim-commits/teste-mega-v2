import { useState, useMemo } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import type { WidgetConfig } from '../../pages/WidgetBuilder';
import styles from './EmbedCodeDisplay.module.css';

interface EmbedCodeDisplayProps {
  config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>;
}

export function EmbedCodeDisplay({ config }: EmbedCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'iframe'>('script');

  // Generate embed code
  const embedCode = useMemo(() => {
    const baseUrl = 'https://widget.rooom.studio';
    const params = new URLSearchParams({
      type: config.type,
      primary: config.appearance.primaryColor,
      secondary: config.appearance.secondaryColor,
      bg: config.appearance.backgroundColor,
      text: config.appearance.textColor,
      font: config.appearance.fontFamily,
      radius: config.appearance.borderRadius.toString(),
      mode: config.appearance.mode,
      position: config.behavior.position,
      animation: config.behavior.animationType,
      autoOpen: config.behavior.autoOpen.toString(),
      delay: config.behavior.autoOpenDelay.toString(),
      mobile: config.behavior.showOnMobile.toString(),
    });

    if (activeTab === 'script') {
      return `<!-- ROOOM Widget -->
<script src="${baseUrl}/loader.js"></script>
<script>
  ROOOMWidget.init({
    studioId: 'YOUR_STUDIO_ID',
    type: '${config.type}',
    appearance: {
      primaryColor: '${config.appearance.primaryColor}',
      secondaryColor: '${config.appearance.secondaryColor}',
      backgroundColor: '${config.appearance.backgroundColor}',
      textColor: '${config.appearance.textColor}',
      fontFamily: '${config.appearance.fontFamily}',
      borderRadius: ${config.appearance.borderRadius},
      mode: '${config.appearance.mode}'
    },
    behavior: {
      position: '${config.behavior.position}',
      autoOpen: ${config.behavior.autoOpen},
      autoOpenDelay: ${config.behavior.autoOpenDelay},
      showOnMobile: ${config.behavior.showOnMobile},
      animationType: '${config.behavior.animationType}',
      closeOnOutsideClick: ${config.behavior.closeOnOutsideClick}
    }${config.customCSS ? `,
    customCSS: \`${config.customCSS}\`` : ''}
  });
</script>`;
    }

    return `<!-- ROOOM Widget (iframe) -->
<iframe
  src="${baseUrl}/embed?${params.toString()}"
  width="100%"
  height="600"
  frameborder="0"
  allow="payment"
  style="border: none; border-radius: ${config.appearance.borderRadius}px;"
></iframe>`;
  }, [config, activeTab]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Code size={16} className={styles.icon} />
          <h4 className={styles.title}>Code d'integration</h4>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'script' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('script')}
          >
            Script
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'iframe' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('iframe')}
          >
            iFrame
          </button>
        </div>
      </div>

      <div className={styles.codeWrapper}>
        <pre className={styles.code}>
          <code>{embedCode}</code>
        </pre>

        <div className={styles.copyButton}>
          <Button
            variant={copied ? 'success' : 'secondary'}
            size="sm"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copie!' : 'Copier'}
          </Button>
        </div>
      </div>

      <div className={styles.hint}>
        <p>
          {activeTab === 'script'
            ? 'Collez ce code avant la balise </body> de votre site. Remplacez YOUR_STUDIO_ID par votre identifiant.'
            : 'Utilisez cette methode si vous souhaitez integrer le widget dans un conteneur specifique.'
          }
        </p>
      </div>
    </div>
  );
}
