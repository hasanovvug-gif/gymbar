export const SUPPLEMENT_SLOTS = ['morning', 'pre_workout', 'evening'] as const;

export type SupplementSlot = (typeof SUPPLEMENT_SLOTS)[number];

export const SUPPLEMENT_FORMS = ['powder', 'capsule', 'tablet', 'liquid', 'other'] as const;

export type SupplementForm = (typeof SUPPLEMENT_FORMS)[number];

export type CompositionItem = { name: string; amount?: number; unit?: string; perServing?: boolean };

export type Supplement = {
  id: string;
  name: string;
  nameKey?: string;
  dose: string;
  doseKey?: string;
  stock: number;
  capacity: number;
  stockUnit: string;
  stockUnitKey?: string;
  unitsPerDose: number;
  schedule: SupplementSlot[];
  // Аддитивные поля AI-ввода — все опциональны, старые записи валидны без них
  brand?: string;
  form?: SupplementForm;
  composition?: CompositionItem[];
  servingsPerContainer?: number;
  seller?: string;
  sourceUrl?: string;
  note?: string;
  photos?: string[];
  createdBy?: 'manual' | 'ai';
};

export type SupplementLog = {
  date: string;
  taken: Record<string, boolean>;
};
