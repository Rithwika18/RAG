import React from 'react';

export default function Footer() {
  return (
    <footer className="py-4 px-6 bg-white border-t border-slate-100 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
        <p>© {new Date().getFullYear()} HealthPulse AI. Secure Medical Analyzer Dashboard.</p>
        <p className="flex items-center space-x-2 mt-1 sm:mt-0 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>BYOK Serverless Storage Compliance</span>
        </p>
      </div>
    </footer>
  );
}
