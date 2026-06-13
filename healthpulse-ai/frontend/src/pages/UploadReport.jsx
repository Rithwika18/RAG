import React from 'react';
import UploadBox from '../components/UploadBox';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function UploadReport() {
  const navigate = useNavigate();

  const handleUploadSuccess = (data) => {
    // Navigate to report summary details
    if (data && data.id) {
      navigate(`/summary?id=${data.id}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Upload Medical Report
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload your medical files securely. All text processing and vector operations are encrypted and confidential.
        </p>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <UploadBox onUploadSuccess={handleUploadSuccess} />

        {/* Security Disclaimers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">HIPAA Shield</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Data is parsed dynamically. Vectors are deleted when you delete the report record.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Dynamic BYOK</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Your keys are never stored on the server database. They run dynamically from browser local memory.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-500 mt-0.5">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">No Training data</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Your medical text is not used to train global AI models. Complete isolation of your medical profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
