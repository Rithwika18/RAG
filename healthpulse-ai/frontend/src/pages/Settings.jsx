import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { Settings, Shield, Server, Key, Save, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const {
    provider: currentProvider,
    model: currentModel,
    apiKeys: currentKeys,
    language: currentLang,
    saveSettings,
    testConnection
  } = useContext(SettingsContext);

  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('qwen2.5:0.5b');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    claude: ''
  });
  const [language, setLanguage] = useState('English');

  // Connection testing states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { status: 'success'|'warning'|'error', message: '' }
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with SettingsContext
  useEffect(() => {
    setProvider(currentProvider);
    setModel(currentModel);
    setApiKeys(currentKeys);
    setLanguage(currentLang);
  }, [currentProvider, currentModel, currentKeys, currentLang]);

  // Provider change defaults
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setTestResult(null);
    if (newProvider === 'ollama') {
      setModel('qwen2.5:0.5b');
    } else if (newProvider === 'openai') {
      setModel('gpt-4o-mini');
    } else if (newProvider === 'gemini') {
      setModel('gemini-1.5-flash');
    } else if (newProvider === 'claude') {
      setModel('claude-3-5-sonnet-20240620');
    }
  };

  const handleKeyChange = (providerName, val) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerName]: val
    }));
  };

  const handleSave = () => {
    saveSettings(provider, model, apiKeys, language);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const activeKey = provider === 'ollama' ? '' : apiKeys[provider];
      const res = await testConnection(provider, model, activeKey);
      setTestResult({
        status: res.status,
        message: res.message
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        status: 'error',
        message: 'Could not connect to the backend settings validator.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <Settings className="w-8 h-8 text-brand-500" />
          <span>AI Engine Settings</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure model parameters, choose between Local AI or Cloud providers, and securely enter API keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Side: Security Badge Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Security Policy</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your credentials and API keys are stored exclusively in your local browser window memory (`localStorage`).
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            They are transmitted temporarily inside requests to complete RAG vector searches and are never written to a centralized database.
          </p>
        </div>

        {/* Right Side: Settings Form Console */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          
          {/* Provider Select Cards */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">Model Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Ollama', id: 'ollama', desc: 'Local/Free' },
                { name: 'OpenAI', id: 'openai', desc: 'BYOK Cloud' },
                { name: 'Gemini', id: 'gemini', desc: 'BYOK Cloud' },
                { name: 'Claude', id: 'claude', desc: 'BYOK Cloud' }
              ].map((p) => {
                const isSelected = provider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700 font-semibold shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs block">{p.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{p.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model selection and API Keys input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model select */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Select Model</label>
              {provider === 'ollama' ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-slate-700"
                >
                  <option value="llama3">llama3</option>
                  <option value="mistral">mistral</option>
                  <option value="gemma">gemma</option>
                  <option value="qwen2.5:0.5b">qwen2.5:0.5b (Fast & Light)</option>
                  <option value="gemma2:2b">gemma2:2b (Medium)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-slate-700"
                />
              )}
            </div>

            {/* Language select */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
              </select>
            </div>
          </div>

          {/* BYOK Secret Keys Inputs */}
          {provider !== 'ollama' && (
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center space-x-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <Key className="w-4 h-4 text-brand-500" />
                <span>API Secret Key ({provider})</span>
              </div>
              <input
                type="password"
                value={apiKeys[provider] || ''}
                onChange={(e) => handleKeyChange(provider, e.target.value)}
                placeholder={`Enter your secret ${provider} API Key`}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-500 transition-all text-slate-700 font-mono"
              />
            </div>
          )}

          {/* Connection test result banner */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-2 ${
              testResult.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              testResult.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-red-50 border-red-100 text-red-800'
            }`}>
              {testResult.status === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
              {testResult.status === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />}
              {testResult.status === 'error' && <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-brand-100"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="text-center text-xs font-bold text-emerald-600 animate-fade-in">
              🎉 Configurations updated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
