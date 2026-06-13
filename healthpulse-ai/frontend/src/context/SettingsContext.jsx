import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('qwen2.5:0.5b');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    claude: ''
  });
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    const storedProvider = localStorage.getItem('ai_provider');
    const storedModel = localStorage.getItem('ai_model');
    const storedKeys = localStorage.getItem('ai_keys');
    const storedLang = localStorage.getItem('ai_language');

    if (storedProvider) setProvider(storedProvider);
    if (storedModel) setModel(storedModel);
    if (storedLang) setLanguage(storedLang);
    if (storedKeys) {
      try {
        setApiKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error("Failed to parse keys from localStorage", e);
      }
    }
  }, []);

  const saveSettings = (newProvider, newModel, newKeys, newLang) => {
    setProvider(newProvider);
    setModel(newModel);
    setApiKeys(newKeys);
    setLanguage(newLang);

    localStorage.setItem('ai_provider', newProvider);
    localStorage.setItem('ai_model', newModel);
    localStorage.setItem('ai_keys', JSON.stringify(newKeys));
    localStorage.setItem('ai_language', newLang);
  };

  const getActiveApiKey = () => {
    if (provider === 'ollama') return '';
    return apiKeys[provider] || '';
  };

  const testConnection = async (testProvider, testModel, testKey) => {
    const res = await axios.post('/settings', {
      provider: testProvider,
      model: testModel,
      api_key: testKey
    });
    return res.data;
  };

  return (
    <SettingsContext.Provider value={{
      provider,
      model,
      apiKeys,
      language,
      saveSettings,
      getActiveApiKey,
      testConnection
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
