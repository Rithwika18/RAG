import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SettingsContext } from '../context/SettingsContext';
import { BarChart3, FileText, CheckSquare, Square, Loader, ArrowRight, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import Charts from '../components/Charts';

export default function ReportComparison() {
  const { provider, model, getActiveApiKey, language } = useContext(SettingsContext);
  const [reports, setReports] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchReports();
  }, []);

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 reports to generate a trend analysis.');
      return;
    }
    setComparing(true);
    setError('');
    setComparisonResult(null);

    try {
      const res = await axios.post('/compare', {
        report_ids: selectedIds,
        provider,
        model,
        api_key: getActiveApiKey(),
        language
      });
      setComparisonResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Comparison failed. Verify your AI credentials.');
    } finally {
      setComparing(false);
    }
  };

  const getTrendIcon = (direction = '') => {
    switch (direction.toLowerCase()) {
      case 'improved':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'worsened':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <ArrowRightLeft className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendBadgeColor = (direction = '') => {
    switch (direction.toLowerCase()) {
      case 'improved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'worsened':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-8 h-8 text-brand-500" />
          <span>Report Comparison & Trend Tracking</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Select multiple reports to track biomarkers like Glucose, Cholesterol, or Hemoglobin chronologically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Report Checklist Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Select Reports to Compare</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-xs font-medium">
              {error}
            </div>
          )}

          {loadingList ? (
            <div className="text-slate-400 text-xs text-center py-6">Loading file inventory...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-10 h-10 text-slate-200 stroke-1 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No reports available.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {reports.map((report) => {
                const isSelected = selectedIds.includes(report.id);
                return (
                  <div
                    key={report.id}
                    onClick={() => handleToggle(report.id)}
                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-500 text-brand-700 font-semibold shadow-sm'
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-xs truncate block">{report.filename}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(report.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={comparing || selectedIds.length < 2}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-brand-100 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {comparing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Running Comparison...</span>
              </>
            ) : (
              <>
                <span>Run Trend Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Side: Trend Graphs & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          {comparing && (
            <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <Loader className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 text-base">Comparing Reports...</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                Analyzing values across all chosen dates, aligning parameters, and building trend line charts...
              </p>
            </div>
          )}

          {!comparing && !comparisonResult && (
            <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <ArrowRightLeft className="w-14 h-14 text-slate-200 stroke-1 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 text-base">Select & Track Progress</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                Choose at least two medical reports on the left (e.g. cholesterol check in January and June) and trigger trend tracking to view charts.
              </p>
            </div>
          )}

          {comparisonResult && (
            <div className="space-y-6">
              {/* Trend Chart component */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-base">Laboratory Biomarker Trends</h3>
                <p className="text-slate-400 text-xs -mt-1">Line graph charting compared parameters chronologically</p>
                <Charts data={comparisonResult.chart_comparison} />
              </div>

              {/* Text Trend Summary Card */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base">Clinical Trend Summary</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {comparisonResult.comparison_summary}
                </p>
              </div>

              {/* Trend Direction Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comparisonResult.trends?.map((t, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">{t.parameter}</span>
                      <span className={`flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${getTrendBadgeColor(t.direction)}`}>
                        {getTrendIcon(t.direction)}
                        <span>{t.direction}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-50">
                      {t.details}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm space-y-3">
                <h3 className="font-bold text-emerald-900 text-sm">Suggested Follow-ups based on Trends</h3>
                <ul className="space-y-2">
                  {comparisonResult.recommendations?.map((rec, idx) => (
                    <li key={idx} className="text-emerald-800 text-xs leading-relaxed flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
