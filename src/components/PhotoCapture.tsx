import { useRef, useState } from 'react';

interface Props {
  onSelect: (file: File) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onSelect, disabled }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handle(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-500 bg-white p-6 text-brand-700 transition active:scale-95 disabled:opacity-50"
        >
          <CameraIcon />
          <span className="text-sm font-semibold">Take photo</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-slate-700 transition active:scale-95 disabled:opacity-50"
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
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {preview && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src={preview}
            alt="Selected page"
            className="max-h-80 w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
