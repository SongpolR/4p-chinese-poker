'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import SettingsBar from '@/components/SettingsBar';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SettingsBar />
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
