import { create } from 'zustand';

interface UIState {
  language: 'en' | 'ur';
  toggleLanguage: () => void;
  portalLanguage: 'en' | 'ur';
  togglePortalLanguage: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: (localStorage.getItem('lang') as any) ?? 'en',
  toggleLanguage: () => set((s) => {
    const next = s.language === 'en' ? 'ur' : 'en';
    localStorage.setItem('lang', next);
    return { language: next };
  }),
  portalLanguage: (localStorage.getItem('portalLang') as any) ?? 'en',
  togglePortalLanguage: () => set((s) => {
    const next = s.portalLanguage === 'en' ? 'ur' : 'en';
    localStorage.setItem('portalLang', next);
    return { portalLanguage: next };
  }),
  theme: (localStorage.getItem('theme') as any) ?? 'light',
  toggleTheme: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    return { theme: next };
  }),
}));
