import type { LevellingRequest, LevellingResponse, ApiError } from './types';

export async function levelPage(req: LevellingRequest): Promise<LevellingResponse> {
  const res = await fetch('/api/level', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const body = (await res.json().catch(() => null)) as
    | LevellingResponse
    | ApiError
    | null;

  if (!res.ok || !body || 'error' in (body ?? {})) {
    const err = body as ApiError | null;
    throw new Error(
      err?.detail ?? err?.error ?? `Request failed (${res.status})`,
    );
  }

  return body as LevellingResponse;
}
