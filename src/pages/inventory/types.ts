import {
  Package,
  Camera,
  Lightbulb,
  Monitor,
  Mic,
  Speaker,
  Music,
} from 'lucide-react';
import type { EquipmentStatus } from '../../types/database';

export interface EquipmentFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  status: EquipmentStatus;
  condition: number;
  purchase_date: string;
  purchase_price: string;
  current_value: string;
  hourly_rate: string;
  daily_rate: string;
  location: string;
  image_url: string;
  space_id: string;
}

export const defaultFormData: EquipmentFormData = {
  name: '',
  description: '',
  category: '',
  brand: '',
  model: '',
  serial_number: '',
  status: 'available',
  condition: 10,
  purchase_date: '',
  purchase_price: '',
  current_value: '',
  hourly_rate: '',
  daily_rate: '',
  location: '',
  image_url: '',
  space_id: '',
};

export const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'R\u00e9serv\u00e9' },
  { value: 'in_use', label: 'En utilisation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retir\u00e9' },
];

export const statusFormOptions = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'R\u00e9serv\u00e9' },
  { value: 'in_use', label: 'En utilisation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retir\u00e9' },
];

export const conditionOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} - ${i < 3 ? 'Mauvais' : i < 6 ? 'Moyen' : i < 9 ? 'Bon' : 'Excellent'}`,
}));

// Helper function to get icon for category
export function getCategoryIcon(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('camera') || cat.includes('video')) return Camera;
  if (cat.includes('eclair') || cat.includes('light') || cat.includes('lumiere')) return Lightbulb;
  if (cat.includes('ecran') || cat.includes('monitor') || cat.includes('display')) return Monitor;
  if (cat.includes('micro') || cat.includes('mic')) return Mic;
  if (cat.includes('speaker') || cat.includes('enceinte') || cat.includes('hp')) return Speaker;
  if (cat.includes('audio') || cat.includes('son') || cat.includes('music')) return Music;
  return Package;
}
