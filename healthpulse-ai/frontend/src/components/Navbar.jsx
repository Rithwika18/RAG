import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Activity, LogOut, Shield, Globe, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { provider, model, language } = useContext(SettingsContext);
  const navigate = useNavigate();

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
          <span>Active AI: <span className="font-bold capitalize">{provider}</span> ({model})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1"></span>
        </div>

        {/* Selected Language Badge */}
        <div className="hidden sm:flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 font-medium">
          <Globe className="w-3.5 h-3.5" />
          <span>{language}</span>
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
                <span className="text-xs text-slate-400 block">Logged in as</span>
                <span className="text-sm font-semibold text-slate-700 block -mt-1">{user.username}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
