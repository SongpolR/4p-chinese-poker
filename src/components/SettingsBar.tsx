'use client';

import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

export default function SettingsBar() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
        className="px-2 py-1 rounded-lg text-xs font-bold bg-white/10 dark:bg-white/10 backdrop-blur border border-white/20 dark:border-white/20 hover:bg-white/20 transition-colors text-white/80"
        title={lang === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
      >
        {lang === 'en' ? 'TH' : 'EN'}
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => {
          const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
          setTheme(next);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 dark:bg-white/10 backdrop-blur border border-white/20 dark:border-white/20 hover:bg-white/20 transition-colors text-sm"
        title={`Theme: ${theme}`}
      >
        {theme === 'system' ? (
          <span className="text-white/80">&#9681;</span>
        ) : theme === 'light' ? (
          <span className="text-yellow-300">&#9728;</span>
        ) : (
          <span className="text-blue-300">&#9790;</span>
        )}
      </button>
    </div>
  );
}
