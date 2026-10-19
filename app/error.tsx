'use client';

import { useEffect } from 'react';

// Next.js shows this instead of a blank "Application error" screen when anything in a page throws
// while rendering (for example, one malformed entry card). Saved data is not affected.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex h-[100dvh] flex-col items-center justify-center gap-5 bg-black px-8 text-center">
      <p className="small-caps !text-red-400">Something broke</p>
      <p className="max-w-xs text-sm font-light leading-relaxed text-white/60">
        This screen hit an error. Your saved entries are safe.
      </p>
      <button
        onClick={reset}
        className="rounded-2xl border border-white/10 bg-white/5 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 transition-all hover:bg-white/10 active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}
