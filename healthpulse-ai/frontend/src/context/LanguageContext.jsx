import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageContext = createContext();

// Supported languages with native names and flag emojis
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
];

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const stored = localStorage.getItem('app_language');
    if (stored) {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === stored);
      if (lang) {
        setSelectedLanguage(lang);
        i18n.changeLanguage(lang.code);
      }
    }
    setLoading(false);
  }, [i18n]);

  const selectLanguage = (lang) => {
    setSelectedLanguage(lang);
    localStorage.setItem('app_language', lang.code);
    localStorage.setItem('ai_language', lang.name);
    i18n.changeLanguage(lang.code);
  };

  const resetLanguage = () => {
    setSelectedLanguage(null);
    localStorage.removeItem('app_language');
  };

  return (
    <LanguageContext.Provider value={{
      selectedLanguage,
      selectLanguage,
      resetLanguage,
      loading,
      hasSelectedLanguage: !!selectedLanguage
    }}>
      {!loading && children}
    </LanguageContext.Provider>
  );
};
