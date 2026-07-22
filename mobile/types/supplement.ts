export const SUPPLEMENT_SLOTS = ['morning', 'pre_workout', 'evening'] as const;

export type SupplementSlot = (typeof SUPPLEMENT_SLOTS)[number];

export type Supplement = {
  id: string;
  name: string;
  dose: string;
  stock: number;
  capacity: number;
  stockUnit: string;
  unitsPerDose: number;
  schedule: SupplementSlot[];
};

export type SupplementLog = {
  date: string;
  taken: Record<string, boolean>;
};
