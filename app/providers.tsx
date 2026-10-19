'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { applyTheme, readThemePref, watchSystemTheme } from '@/lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(readThemePref()); // also sets the browser toolbar colour, which the head script skips
    return watchSystemTheme();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
