export type Rating = 'L' | 'M' | 'H';
export type Dimension = 'decoding' | 'language' | 'knowledge';

export interface DimensionResult {
  rating: Rating;
  rationale: string;
  evidence: string[];
}

export interface LevellingRequest {
  imageBase64: string;
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  textTitle?: string;
}

export interface LevellingResponse {
  textTitle: string | null;
  transcript: string;
  dimensions: {
    decoding: DimensionResult;
    language: DimensionResult;
    knowledge: DimensionResult;
  };
  /** Secondary signal. Only useful when D/L/K can't be differentiated. */
  lexile: {
    estimate: number | null;
    band: string | null;
    note: string;
  };
  warnings?: string[];
}

export interface ApiError {
  error: string;
  detail?: string;
}

export const DIMENSION_META: Record<
  Dimension,
  { code: 'D' | 'L' | 'K'; name: string; aligns: string }
> = {
  decoding: { code: 'D', name: 'Decoding demand', aligns: 'Aligns with DIBELS' },
  language: { code: 'L', name: 'Language demand', aligns: 'Aligns with CUBED NLM' },
  knowledge: { code: 'K', name: 'Knowledge demand', aligns: '' },
};

export const RATING_META: Record<
  Rating,
  { label: string; full: string; description: string }
> = {
  L: { label: 'L', full: 'Low', description: 'Most students will manage independently' },
  M: { label: 'M', full: 'Medium', description: 'Some scaffolding likely needed' },
  H: { label: 'H', full: 'High', description: 'Heavy front-loading or support required' },
};
