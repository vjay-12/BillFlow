import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';

const savedLanguage =
  (typeof window !== 'undefined' && localStorage.getItem('billflow_app_language')) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler: (lngs, ns, key) => {
      console.warn(`[i18n] Missing translation key "${key}" in language "${lngs.join(', ')}" (ns: "${ns}")`);
    },
    saveMissing: true,
  });

export default i18n;
