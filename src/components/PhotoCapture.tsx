import { useEffect, useMemo, useRef } from 'react';
import { MAX_IMAGES } from '../lib/types';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function PhotoCapture({ files, onChange, disabled }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const slotsLeft = MAX_IMAGES - files.length;
  const atCapacity = slotsLeft <= 0;

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list).slice(0, slotsLeft);
    onChange([...files, ...incoming]);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled || atCapacity}
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-500 bg-white p-5 text-brand-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CameraIcon />
          <span className="text-sm font-semibold">Take photo</span>
        </button>
        <button
          type="button"
          disabled={disabled || atCapacity}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-slate-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UploadIcon />
          <span className="text-sm font-semibold">Upload image</span>
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {previews.length === 0 ? (
        <p className="text-center text-xs text-slate-500">
          Add up to {MAX_IMAGES} photos from the same text — more pages give a more
          accurate D/L/K rating.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {previews.map((p, i) => (
              <li
                key={p.url}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
              >
                <img
                  src={p.url}
                  alt={`Page ${i + 1}`}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">
                    Page {i + 1}
                  </p>
                  <p className="truncate text-xs text-slate-500">{p.file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={disabled}
                  aria-label={`Remove page ${i + 1}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-center text-xs text-slate-500">
            {files.length} of {MAX_IMAGES} photo{files.length === 1 ? '' : 's'}
            {atCapacity ? ' — maximum reached.' : ` — ${slotsLeft} more allowed.`}
          </p>
        </>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
