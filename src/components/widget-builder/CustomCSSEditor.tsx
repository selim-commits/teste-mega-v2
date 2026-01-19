import { useState, useRef, useCallback, useEffect } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './CustomCSSEditor.module.css';

interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
}

// CSS variable autocomplete suggestions
const cssVariables = [
  { name: '--rooom-primary', description: 'Couleur principale' },
  { name: '--rooom-secondary', description: 'Couleur secondaire' },
  { name: '--rooom-background', description: 'Couleur de fond' },
  { name: '--rooom-text', description: 'Couleur du texte' },
  { name: '--rooom-radius', description: 'Arrondi des coins' },
  { name: '--rooom-font-family', description: 'Police' },
  { name: '--rooom-shadow', description: 'Ombre' },
  { name: '--rooom-border', description: 'Bordure' },
];

const exampleCSS = `/* Personnalisez votre widget */
.rooom-widget {
  /* Utilisez les variables ROOOM */
  background: var(--rooom-background);
  border-radius: var(--rooom-radius);
}

.rooom-widget-button {
  background: var(--rooom-primary);
  color: white;
}

.rooom-widget-header {
  font-family: var(--rooom-font-family);
}`;

export function CustomCSSEditor({ value, onChange }: CustomCSSEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  // Update line count
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(Math.max(lines, 10));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for autocomplete trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastWord = textBeforeCursor.match(/--[\w-]*$/);

    setShowSuggestions(!!lastWord);
  }, [onChange]);

  const insertVariable = useCallback((variable: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Find the start of the current variable being typed
    const textBeforeCursor = text.substring(0, start);
    const match = textBeforeCursor.match(/--[\w-]*$/);
    const varStart = match ? start - match[0].length : start;

    const newValue = text.substring(0, varStart) + variable + text.substring(end);
    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = varStart + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    setShowSuggestions(false);
  }, [onChange]);

  const handleCopyExample = useCallback(() => {
    onChange(exampleCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newValue = text.substring(0, start) + '  ' + text.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Close suggestions on Escape
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [onChange]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.sectionTitle}>CSS Personnalise</h4>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={handleCopyExample}
        >
          {copied ? 'Copie!' : 'Exemple'}
        </Button>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <Info size={16} className={styles.infoIcon} />
        <p className={styles.infoText}>
          Utilisez les variables ROOOM pour une integration coherente avec vos parametres d'apparence.
        </p>
      </div>

      {/* Editor */}
      <div className={styles.editorWrapper}>
        <div className={styles.lineNumbers}>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className={styles.lineNumber}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={styles.editor}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="/* Ecrivez votre CSS personnalise ici */"
          spellCheck={false}
        />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsHeader}>Variables ROOOM disponibles</div>
          {cssVariables.map((variable) => (
            <button
              key={variable.name}
              type="button"
              className={styles.suggestion}
              onClick={() => insertVariable(variable.name)}
            >
              <code className={styles.suggestionName}>{variable.name}</code>
              <span className={styles.suggestionDesc}>{variable.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Variables Reference */}
      <details className={styles.reference}>
        <summary className={styles.referenceSummary}>
          Variables CSS disponibles
        </summary>
        <div className={styles.referenceList}>
          {cssVariables.map((variable) => (
            <div key={variable.name} className={styles.referenceItem}>
              <code className={styles.referenceName}>{variable.name}</code>
              <span className={styles.referenceDesc}>{variable.description}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
