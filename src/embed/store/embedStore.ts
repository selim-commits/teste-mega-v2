// src/embed/store/embedStore.ts
import { create } from 'zustand';
import type {
  EmbedConfig,
  EmbedStudio,
  EmbedService,
  BookingStep,
  BookingFormData,
  BookingResult,
  TimeSlot,
} from '../types';

interface EmbedState {
  // Config
  config: EmbedConfig | null;

  // Data
  studio: EmbedStudio | null;
  services: EmbedService[];
  availability: Map<string, TimeSlot[]>;

  // Booking flow
  currentStep: BookingStep;
  selectedService: EmbedService | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  formData: Partial<BookingFormData>;
  bookingResult: BookingResult | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setConfig: (config: EmbedConfig) => void;
  setStudio: (studio: EmbedStudio) => void;
  setServices: (services: EmbedService[]) => void;
  setAvailability: (date: string, slots: TimeSlot[]) => void;

  selectService: (service: EmbedService) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: TimeSlot) => void;
  updateFormData: (data: Partial<BookingFormData>) => void;
  setBookingResult: (result: BookingResult) => void;

  goToStep: (step: BookingStep) => void;
  goBack: () => void;
  reset: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const STEP_ORDER: BookingStep[] = [
  'services',
  'datetime',
  'form',
  'payment',
  'confirmation',
];

export const useEmbedStore = create<EmbedState>((set, get) => ({
  // Initial state
  config: null,
  studio: null,
  services: [],
  availability: new Map(),
  currentStep: 'services',
  selectedService: null,
  selectedDate: null,
  selectedSlot: null,
  formData: {},
  bookingResult: null,
  isLoading: false,
  error: null,

  // Actions
  setConfig: (config) => set({ config }),
  setStudio: (studio) => set({ studio }),
  setServices: (services) => set({ services }),
  setAvailability: (date, slots) =>
    set((state) => {
      const newAvailability = new Map(state.availability);
      newAvailability.set(date, slots);
      return { availability: newAvailability };
    }),

  selectService: (service) =>
    set({
      selectedService: service,
      currentStep: 'datetime',
      selectedDate: null,
      selectedSlot: null,
    }),

  selectDate: (date) =>
    set({
      selectedDate: date,
      selectedSlot: null,
    }),

  selectSlot: (slot) =>
    set({
      selectedSlot: slot,
      currentStep: 'form',
    }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  setBookingResult: (result) =>
    set({
      bookingResult: result,
      currentStep: result.paymentUrl ? 'payment' : 'confirmation',
    }),

  goToStep: (step) => set({ currentStep: step }),

  goBack: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },

  reset: () =>
    set({
      currentStep: 'services',
      selectedService: null,
      selectedDate: null,
      selectedSlot: null,
      formData: {},
      bookingResult: null,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
