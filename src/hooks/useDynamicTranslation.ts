import { useState, useEffect } from 'react';
import { useActiveLanguage } from '@/hooks/useActiveLanguage';

// Simple in-memory cache to prevent redundant API calls
const translationCache: Record<string, string> = {};

export function useDynamicTranslation(text?: string | null) {
  const activeLang = useActiveLanguage();
  const [translated, setTranslated] = useState(text || '');

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    // If English, just use the original text
    if (activeLang === 'en') {
      setTranslated(text);
      return;
    }
    
    // Check cache first
    if (translationCache[text]) {
      setTranslated(translationCache[text]);
      return;
    }

    // Fetch from free Google Translate endpoint
    const fetchTranslation = async () => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        const result = data[0].map((item: any) => item[0]).join('');
        
        translationCache[text] = result;
        setTranslated(result);
      } catch (e) {
        console.error("Dynamic translation error", e);
        setTranslated(text); // fallback to English on error
      }
    };

    // Small debounce/delay to prevent spamming if many items render at once
    const timeoutId = setTimeout(() => {
      fetchTranslation();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [text, activeLang]);

  return translated;
}
