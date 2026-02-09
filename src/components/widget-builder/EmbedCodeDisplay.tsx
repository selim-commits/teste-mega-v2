import { useState, useMemo } from 'react';
import { Copy, Check, Code, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { WidgetConfig } from '../../pages/WidgetBuilder';
import styles from './EmbedCodeDisplay.module.css';

interface EmbedCodeDisplayProps {
  config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>;
}

function highlightCode(code: string): React.ReactNode {
  const lines = code.split('\n');
  return lines.map((line, lineIndex) => {
    // Tokenize the line
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyCounter = 0;

    while (remaining.length > 0) {
      // HTML comments
      const commentMatch = remaining.match(/^(<!--[\s\S]*?-->)/);
      if (commentMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenComment}>{commentMatch[1]}</span>);
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      // JS comments
      const jsCommentMatch = remaining.match(/^(\/\/.*)/);
      if (jsCommentMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenComment}>{jsCommentMatch[1]}</span>);
        remaining = remaining.slice(jsCommentMatch[1].length);
        continue;
      }

      // Strings (single or double quotes)
      const stringMatch = remaining.match(/^(['"](?:[^'"\\]|\\.)*['"])/);
      if (stringMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenString}>{stringMatch[1]}</span>);
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      // Template literals
      const templateMatch = remaining.match(/^(`(?:[^`\\]|\\.)*`)/);
      if (templateMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenString}>{templateMatch[1]}</span>);
        remaining = remaining.slice(templateMatch[1].length);
        continue;
      }

      // HTML tags
      const tagMatch = remaining.match(/^(<\/?[a-zA-Z][a-zA-Z0-9-]*)/);
      if (tagMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenTag}>{tagMatch[1]}</span>);
        remaining = remaining.slice(tagMatch[1].length);
        continue;
      }

      // Closing >
      const closeTagMatch = remaining.match(/^(>)/);
      if (closeTagMatch && tokens.length > 0) {
        tokens.push(<span key={keyCounter++} className={styles.tokenTag}>{closeTagMatch[1]}</span>);
        remaining = remaining.slice(1);
        continue;
      }

      // Keywords
      const keywordMatch = remaining.match(/^(\b(?:const|function|true|false|null|undefined|var|let|src|style|width|height|frameborder|allow)\b)/);
      if (keywordMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenKeyword}>{keywordMatch[1]}</span>);
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      // Numbers
      const numberMatch = remaining.match(/^(\b\d+\b)/);
      if (numberMatch) {
        tokens.push(<span key={keyCounter++} className={styles.tokenNumber}>{numberMatch[1]}</span>);
        remaining = remaining.slice(numberMatch[1].length);
        continue;
      }

      // Default: take one char
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIndex} className={styles.codeLine}>
        <span className={styles.lineNumber}>{lineIndex + 1}</span>
        <span className={styles.lineContent}>{tokens}</span>
      </div>
    );
  });
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

  const handleSelectAll = () => {
    const codeElement = document.querySelector(`.${styles.codeLines}`);
    if (codeElement) {
      const range = document.createRange();
      range.selectNodeContents(codeElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
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

      {embedCode.includes('YOUR_STUDIO_ID') && (
        <div className={styles.warningBanner}>
          <AlertTriangle size={14} />
          <span>Remplacez YOUR_STUDIO_ID par votre identifiant studio avant de deployer.</span>
        </div>
      )}

      <div className={styles.codeWrapper}>
        <pre className={styles.code}>
          <div className={styles.codeLines}>{highlightCode(embedCode)}</div>
        </pre>

        <div className={styles.codeActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
          >
            Tout selectionner
          </Button>
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
