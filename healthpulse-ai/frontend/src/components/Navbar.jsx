import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { Activity, LogOut, Shield, Globe, Cpu, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { provider, model } = useContext(SettingsContext);
  const { selectedLanguage, selectLanguage } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Left Branding */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-200">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-800 tracking-tight block">HealthPulse AI</span>
          <span className="text-[10px] text-brand-600 font-semibold tracking-wider uppercase">Medical Analytics</span>
        </div>
      </div>

      {/* Right User & LLM Info */}
      <div className="flex items-center space-x-4">
        {/* Active AI Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-700">
          <Cpu className="w-3.5 h-3.5" />
          <span>{t('navbar.active_ai')} <span className="font-bold capitalize">{provider}</span> ({model})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1"></span>
        </div>

        {/* Selected Language Badge / Dropdown */}
        <div className="relative hidden sm:block" ref={dropdownRef}>
          <button 
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 font-medium transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{selectedLanguage?.name || 'Language'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl shadow-brand-500/10 py-2 z-50 max-h-64 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    selectLanguage(lang);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 hover:bg-slate-50 transition-colors ${selectedLanguage?.code === lang.code ? 'text-brand-600 font-bold bg-brand-50/50' : 'text-slate-600'}`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.native}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Dropdown / Logout */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs text-slate-400 block">{t('navbar.logged_in_as')}</span>
                <span className="text-sm font-semibold text-slate-700 block -mt-1">{user.username}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <span>{t('navbar.logout', 'Logout')}</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
