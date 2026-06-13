import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ChatWindow from '../components/ChatWindow';
import { Bot, FileText, ArrowRight } from 'lucide-react';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [loading, setLoading] = useState(true);

  // Grab active ID from url query
  const queryId = searchParams.get('id');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('/reports');
        setReports(res.data);
        if (res.data.length > 0) {
          // If query param matches one of the reports, select it. Else select the first report.
          const matchingReport = res.data.find(r => r.id.toString() === queryId);
          if (matchingReport) {
            setSelectedReportId(matchingReport.id.toString());
          } else {
            setSelectedReportId(res.data[0].id.toString());
            setSearchParams({ id: res.data[0].id.toString() });
          }
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [queryId]);

  const handleReportChange = (e) => {
    const id = e.target.value;
    setSelectedReportId(id);
    setSearchParams({ id });
  };

  const getSelectedReportName = () => {
    const report = reports.find(r => r.id.toString() === selectedReportId);
    return report ? report.filename : 'Medical Report';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <Bot className="w-8 h-8 text-brand-500" />
            <span>Interactive AI Consultant</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Discuss your blood readings or check normal ranges with context-aware RAG.
          </p>
        </div>

        {/* Dropdown selector */}
        {reports.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Context File:</span>
            <select
              value={selectedReportId}
              onChange={handleReportChange}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-500 text-slate-700 shadow-sm"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center text-slate-400">
          <span className="animate-pulse">Loading report logs...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-12">
          <FileText className="w-16 h-16 text-slate-200 stroke-1 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 text-lg">No Reports to Discuss</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            You must upload a laboratory report PDF before you can launch an interactive chat.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 shadow-md shadow-brand-100 transition-all"
          >
            <span>Go to Upload</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <ChatWindow reportId={selectedReportId} reportName={getSelectedReportName()} />
      )}
    </div>
  );
}
