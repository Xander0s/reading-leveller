export type Tier = 'below' | 'at' | 'above';

export interface YearLevel {
  code: 'F' | '1' | '2' | '3' | '4' | '5' | '6';
  label: string;
}

export const YEAR_LEVELS: YearLevel[] = [
  { code: 'F', label: 'Prep (Foundation)' },
  { code: '1', label: 'Year 1' },
  { code: '2', label: 'Year 2' },
  { code: '3', label: 'Year 3' },
  { code: '4', label: 'Year 4' },
  { code: '5', label: 'Year 5' },
  { code: '6', label: 'Year 6' },
];

export interface LevellingRequest {
  imageBase64: string;
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  yearLevel: YearLevel['code'];
}

export interface LevellingResponse {
  transcript: string;
  lexile: {
    estimate: number;
    band: string;
    rationale: string;
  };
  rubric: {
    tier: Tier;
    tierLabel: string;
    rationale: string;
    evidence: string[];
  };
  warnings?: string[];
}

export interface ApiError {
  error: string;
  detail?: string;
}
