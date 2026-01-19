import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

const defaultPresets = [
  '#1E3A5F', // Dark Blue
  '#1A1A1A', // Black
  '#6B6B6B', // Gray
  '#FFFFFF', // White
  '#22C55E', // Green
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#3B82F6', // Blue
];

export function ColorPicker({ label, value, onChange, presets = defaultPresets }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(value);

  useEffect(() => {
    setHexValue(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    setHexValue(hex);

    // Validate and update if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    } else if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(`#${hex}`);
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setHexValue(color);
    onChange(color);
  };

  const handlePresetClick = (color: string) => {
    setHexValue(color);
    onChange(color);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <div className={styles.colorSwatch}>
          <input
            type="color"
            value={value}
            onChange={handleColorInputChange}
            className={styles.colorInput}
          />
        </div>
        <input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          placeholder="#000000"
          className={styles.hexInput}
          maxLength={7}
        />
      </div>
      <div className={styles.presets}>
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              styles.preset,
              value.toLowerCase() === color.toLowerCase() && styles.presetActive
            )}
            style={{ backgroundColor: color }}
            onClick={() => handlePresetClick(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
}
