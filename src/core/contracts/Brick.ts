export interface BrickCategoryDTO { id: number; name: string; }
export interface BrickInput {
  category?: string;
  duration?: { amount: number | string; unit: 'minutes' | 'hours' };
  reported?: boolean;
}
export interface BrickMeasurement {
  startedAt: number;
  finishedAt: number | null;
  label: string;
  millis: number;
  createdAt: number;
  reported: boolean;
}
export interface BrickTime {
  measurements: BrickMeasurement[];
  totals: { label: string; millis: number; createdAt: number; updatedAt: number; reported: string };
}
export interface BrickAttributes { time?: BrickTime; [key: string]: unknown; }
