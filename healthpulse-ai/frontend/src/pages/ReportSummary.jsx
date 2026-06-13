import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, ChevronLeft, MessageSquare, Trash2, Calendar, Loader } from 'lucide-react';
import SummaryCards from '../components/SummaryCards';
import { SettingsContext } from '../context/SettingsContext';

export default function ReportSummary() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportId = searchParams.get('id');
  const { language } = useContext(SettingsContext);

  const [report, setReport] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!reportId) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch specific report
        const res = await axios.get(`/api/reports/${reportId}?language=${language}`);
        setReport(res.data);

        // Fetch reports list for dropdown switcher
        const listRes = await axios.get('/reports');
        setReportsList(listRes.data);
      } catch (err) {
        console.error('Failed to load report summary', err);
        alert('Could not fetch report details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportId, language]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this report permanently?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/reports/${reportId}`);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <Loader className="w-8 h-8 animate-spin text-brand-500 mr-2" />
        <span className="text-sm font-semibold">Extracting summarized findings...</span>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
              <span>Report Analysis Review</span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center mt-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Uploaded on {new Date(report.uploaded_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Dropdown report switcher */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {reportsList.length > 1 && (
            <select
              value={reportId || ''}
              onChange={(e) => navigate(`/summary?id=${e.target.value}`)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-500 text-slate-700 shadow-sm"
            >
              {reportsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename}
                </option>
              ))}
            </select>
          )}

          <Link
            to={`/chat?id=${reportId}`}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-100"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consult AI</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
            title="Delete Report"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main card metadata */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div className="truncate">
          <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider block">Document Filename</span>
          <span className="text-sm font-bold text-slate-800 truncate block mt-0.5">{report.filename}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards analysis={report.analysis} />
    </div>
  );
}
