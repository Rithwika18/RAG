import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const navItems = [
    { name: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('sidebar.upload_report'), path: '/upload', icon: UploadCloud },
    { name: t('sidebar.ai_chat'), path: '/chat', icon: MessageSquare },
    { name: t('sidebar.report_comparison'), path: '/compare', icon: BarChart3 },
    { name: t('sidebar.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 z-30 shadow-sm">
      {/* Upper Navigation Links */}
      <div className="flex-1 py-6 space-y-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Sidebar Quick Tip Card */}
      <div className="p-4 m-4 bg-gradient-to-tr from-brand-50 to-brand-100/50 rounded-2xl border border-brand-100/50">
        <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider block mb-1">{t('sidebar.health_tip')}</span>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {t('sidebar.health_tip_desc')}
        </p>
      </div>
    </aside>
  );
}
