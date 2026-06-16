import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Use dynamic imports or require for all supported languages
// For simplicity we use standard imports, assuming files are created
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import teTranslation from './locales/te.json';
import esTranslation from './locales/es.json';

// Adding the remaining 14 languages dynamically if possible, or just statically import them.
// To avoid compilation errors before they exist, we can use a dynamic approach or just standard imports since they are being created.
import taTranslation from './locales/ta.json';
import knTranslation from './locales/kn.json';
import mlTranslation from './locales/ml.json';
import mrTranslation from './locales/mr.json';
import bnTranslation from './locales/bn.json';
import guTranslation from './locales/gu.json';
import paTranslation from './locales/pa.json';
import urTranslation from './locales/ur.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import zhTranslation from './locales/zh.json';
import jaTranslation from './locales/ja.json';
import arTranslation from './locales/ar.json';
import ptTranslation from './locales/pt.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  te: { translation: teTranslation },
  es: { translation: esTranslation },
  ta: { translation: taTranslation },
  kn: { translation: knTranslation },
  ml: { translation: mlTranslation },
  mr: { translation: mrTranslation },
  bn: { translation: bnTranslation },
  gu: { translation: guTranslation },
  pa: { translation: paTranslation },
  ur: { translation: urTranslation },
  fr: { translation: frTranslation },
  de: { translation: deTranslation },
  zh: { translation: zhTranslation },
  ja: { translation: jaTranslation },
  ar: { translation: arTranslation },
  pt: { translation: ptTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
