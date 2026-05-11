import { useState } from 'react';
import { PhotoCapture } from './components/PhotoCapture';
import { ResultsCard } from './components/ResultsCard';
import { Spinner } from './components/Spinner';
import { levelPage } from './lib/api';
import { filesToCompressedImages } from './lib/image';
import type { LevellingResponse } from './lib/types';

type Status =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'analysing' }
  | { kind: 'done'; result: LevellingResponse }
  | { kind: 'error'; message: string };

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function analyse() {
    if (files.length === 0) return;
    try {
      setStatus({ kind: 'preparing' });
      const images = await filesToCompressedImages(files);
      setStatus({ kind: 'analysing' });
      const result = await levelPage({
        images,
        textTitle: textTitle.trim() || undefined,
      });
      setStatus({ kind: 'done', result });
    } catch (e) {
      setStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Something went wrong',
      });
    }
  }

  function reset() {
    setFiles([]);
    setTextTitle('');
    setStatus({ kind: 'idle' });
  }

  const busy = status.kind === 'preparing' || status.kind === 'analysing';

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-10 pt-6 safe-bottom">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Reading Leveller</h1>
        <p className="mt-1 text-sm text-slate-600">
          Photograph up to three pages from a text. The app rates its{' '}
          <span className="font-semibold">Decoding</span>,{' '}
          <span className="font-semibold">Language</span> and{' '}
          <span className="font-semibold">Knowledge</span> demands on the school's
          3-point scale, with an optional Lexile.
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-slate-700"
          >
            Text title{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="title"
            type="text"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            disabled={busy}
            placeholder="e.g. The Twits, Roald Dahl"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
          />
        </div>

        <PhotoCapture
          files={files}
          onChange={(next) => {
            setFiles(next);
            if (status.kind !== 'idle') setStatus({ kind: 'idle' });
          }}
          disabled={busy}
        />

        {files.length > 0 && status.kind !== 'done' && (
          <button
            type="button"
            onClick={analyse}
            disabled={busy}
            className="w-full rounded-2xl bg-brand-700 px-4 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy
              ? 'Working…'
              : `Analyse ${files.length} page${files.length === 1 ? '' : 's'}`}
          </button>
        )}

        {status.kind === 'preparing' && (
          <Spinner label={`Preparing ${files.length} image${files.length === 1 ? '' : 's'}…`} />
        )}
        {status.kind === 'analysing' && (
          <Spinner label="Transcribing and rating…" />
        )}

        {status.kind === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Couldn't analyse the page</p>
            <p className="mt-1">{status.message}</p>
          </div>
        )}

        {status.kind === 'done' && (
          <>
            <ResultsCard result={status.result} />
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition active:scale-[0.98]"
            >
              Analyse another text
            </button>
          </>
        )}
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-slate-400">
        Ratings characterise demand, not quality or year-level fit.
      </footer>
    </div>
  );
}
