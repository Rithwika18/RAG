import React from 'react';
import { FileText, AlertTriangle, Lightbulb, ListCollapse, HelpCircle, ChevronRight, Stethoscope } from 'lucide-react';

export default function SummaryCards({ analysis }) {
  if (!analysis) return null;

  const {
    summary = 'No summary details found.',
    key_findings = [],
    abnormal_values = [],
    recommendations = [],
    doctor_notes = {}
  } = analysis;

  const renderItem = (item) => {
    if (typeof item === 'object' && item !== null) {
      if (item.parameter && item.value) {
        return `${item.parameter}: ${item.value}`;
      }
      return item.finding || item.recommendation || item.text || item.observation || item.question || item.test || JSON.stringify(item);
    }
    return String(item);
  };

  const getStatusColor = (status = '') => {
    switch (status.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50';
      case 'critical':
        return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100/50';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Summary Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-500">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Overall Summary</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      {/* Key Findings and Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
              <ListCollapse className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Key Findings</h3>
          </div>
          {key_findings.length === 0 ? (
            <p className="text-slate-400 text-xs">No key findings recorded.</p>
          ) : (
            <ul className="space-y-2.5">
              {key_findings.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-slate-600 text-sm leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <span>{renderItem(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">AI Recommendations</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-slate-400 text-xs">No recommendations recorded.</p>
          ) : (
            <ul className="space-y-2.5">
              {recommendations.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-slate-600 text-sm leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span>{renderItem(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Abnormal Values Segment */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-xl bg-red-50 text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Abnormal Value Detection</h3>
        </div>

        {abnormal_values.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 text-xs font-semibold text-center">
            🎉 Excellent! All laboratory parameters appear to be within normal reference ranges.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {abnormal_values.map((item, index) => (
              <div
                key={index}
                className={`border rounded-2xl p-4 transition-all duration-200 hover-scale ${getStatusColor(item.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{item.parameter}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-white shadow-sm">
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">Observed: </span>
                    <span className="font-bold text-slate-700">{item.value}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium">Reference: </span>
                    <span className="font-medium text-slate-600">{item.reference_range}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 border-t border-dashed border-slate-200 pt-2 mt-2">
                  {item.interpretation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctor visit prep notes */}
      <div className="bg-gradient-to-tr from-brand-50 to-brand-100/30 p-6 rounded-3xl border border-brand-100 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-100">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Doctor Visit Preparation Checklist</h3>
            <p className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider -mt-0.5">Use this for your next consult</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Key Observations */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Key Observations</span>
            </h4>
            {doctor_notes?.observations?.length > 0 ? (
              <ul className="space-y-2">
                {doctor_notes.observations.map((item, index) => (
                  <li key={index} className="text-slate-600 text-xs leading-relaxed flex items-start space-x-1">
                    <ChevronRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>{renderItem(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs">No specific observations recorded.</p>
            )}
          </div>

          {/* Questions to Ask Doctor */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Questions to Ask</span>
            </h4>
            {doctor_notes?.questions_to_ask?.length > 0 ? (
              <ul className="space-y-2">
                {doctor_notes.questions_to_ask.map((item, index) => (
                  <li key={index} className="text-slate-600 text-xs leading-relaxed flex items-start space-x-1">
                    <ChevronRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>{renderItem(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs">No questions recorded.</p>
            )}
          </div>

          {/* Follow-up tests */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Follow-up Tests</span>
            </h4>
            {doctor_notes?.suggested_tests?.length > 0 ? (
              <ul className="space-y-2">
                {doctor_notes.suggested_tests.map((item, index) => (
                  <li key={index} className="text-slate-600 text-xs leading-relaxed flex items-start space-x-1">
                    <ChevronRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>{renderItem(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs">No follow-up tests requested.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
