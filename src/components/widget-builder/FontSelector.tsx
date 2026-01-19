import { Select } from '../ui/Select';
import styles from './FontSelector.module.css';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter (Sans-serif)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'system-ui', label: 'System Default' },
];

export function FontSelector({ label, value, onChange }: FontSelectorProps) {
  return (
    <div className={styles.container}>
      <Select
        label={label}
        options={fontOptions}
        value={value}
        onChange={onChange}
        fullWidth
      />
      <div className={styles.preview} style={{ fontFamily: value }}>
        <span className={styles.previewText}>Aa Bb Cc 123</span>
      </div>
    </div>
  );
}
