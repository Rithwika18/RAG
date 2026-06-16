import React, { useContext, useState } from 'react';
import { LanguageContext, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { Activity, Globe, Search, ChevronRight, Sparkles } from 'lucide-react';

export default function LanguageSelection() {
  const { selectLanguage } = useContext(LanguageContext);
  const [search, setSearch] = useState('');
  const [hoveredLang, setHoveredLang] = useState(null);
  const [selectedTemp, setSelectedTemp] = useState(null);

  const filtered = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedTemp) {
      selectLanguage(selectedTemp);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fe] p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-brand-500/20 to-purple-400/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-gradient-to-tl from-blue-400/15 to-brand-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-emerald-300/10 to-brand-200/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-500 shadow-xl shadow-brand-500/30 mb-5">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            HealthPulse AI
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Globe className="w-4 h-4" />
            <span>Choose your preferred language</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-100 shadow-2xl shadow-brand-100/20 overflow-hidden">
          {/* Search */}
          <div className="p-5 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Language Grid */}
          <div className="px-5 pb-5 max-h-[360px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map((lang) => {
                const isSelected = selectedTemp?.code === lang.code;
                const isHovered = hoveredLang === lang.code;

                return (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedTemp(lang)}
                    onMouseEnter={() => setHoveredLang(lang.code)}
                    onMouseLeave={() => setHoveredLang(null)}
                    className={`
                      relative flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all duration-200 group
                      ${isSelected
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 scale-[1.02]'
                        : isHovered
                          ? 'bg-brand-50 border-brand-200 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }
                      border ${isSelected ? 'border-brand-500' : 'border-slate-100'}
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{lang.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {lang.native}
                      </div>
                      <div className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                        {lang.name}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="w-3.5 h-3.5 text-white/80" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No languages match your search
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="p-5 pt-0">
            <button
              onClick={handleContinue}
              disabled={!selectedTemp}
              className={`
                w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300
                ${selectedTemp
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {selectedTemp ? (
                <>
                  <span>Continue in {selectedTemp.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <span>Select a language to continue</span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          You can change your language anytime in Settings
        </p>
      </div>
    </div>
  );
}
