import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { FileText, Plus, MessageSquare, Trash2, Calendar, AlertTriangle, ChevronRight, BarChart3, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SummaryCards from '../components/SummaryCards';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { provider, language } = useContext(SettingsContext);
  const [reports, setReports] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchDashboardData = async () => {
    try {
      // Get all reports
      const reportsRes = await axios.get('/reports');
      setReports(reportsRes.data);

      if (reportsRes.data.length > 0) {
        // Grab detailed analysis of the most recent report
        const latestId = reportsRes.data[0].id;
        const detailRes = await axios.get(`/api/reports/${latestId}?language=${language}`);
        setLatestReport(detailRes.data);
      } else {
        setLatestReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [language]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report? This will wipe associated vectors and chats.')) {
      return;
    }
    setDeletingId(id);
    try {
      await axios.delete(`/api/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (latestReport && latestReport.id === id) {
        setLatestReport(null);
        // refetch dashboard to shift to next latest if exists
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete report', err);
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  // Extract count of abnormal parameters in the latest report
  const getAbnormalCount = () => {
    if (!latestReport || !latestReport.analysis) return 0;
    return latestReport.analysis.abnormal_values?.length || 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            {t('dashboard.dashboard_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('dashboard.welcome_back', { name: user?.username })}
          </p>
        </div>
        <Link
          to="/upload"
          className="flex items-center space-x-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-brand-100 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('dashboard.btn_upload_report')}</span>
        </Link>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-brand-500 mr-2" />
          <span className="font-medium text-sm">{t('dashboard.loading')}</span>
        </div>
      ) : (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stat 1: Total Reports */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('dashboard.reports_uploaded')}</span>
                <span className="text-2xl font-bold text-slate-800 mt-1 block">{reports.length}</span>
              </div>
            </div>

            {/* Stat 2: Latest Abnormal Count */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('dashboard.latest_abnormal_values')}</span>
                <span className="text-2xl font-bold text-slate-800 mt-1 block">
                  {reports.length > 0 ? getAbnormalCount() : 0}
                </span>
              </div>
            </div>

            {/* Stat 3: Provider Status */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('dashboard.active_llm_engine')}</span>
                <span className="text-sm font-bold text-slate-800 mt-1.5 block capitalize truncate max-w-[160px]">
                  {t('dashboard.model_active', { provider })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 1 Column: List of Reports */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 lg:col-span-1 glass-panel">
              <h3 className="font-bold text-slate-800 text-base mb-2">{t('dashboard.my_reports')}</h3>
              {reports.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-slate-200 stroke-1 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">{t('dashboard.no_reports')}</p>
                  <Link to="/upload" className="text-brand-500 text-xs font-bold hover:underline mt-2 inline-block">
                    {t('dashboard.add_first_report')}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => navigate(`/summary?id=${report.id}`)}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 px-2 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-700 block truncate group-hover:text-brand-500 transition-colors">
                            {report.filename}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(report.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat?id=${report.id}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(report.id, e)}
                          disabled={deletingId === report.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 2 Columns: Latest Report Detailed Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {latestReport ? (
                <div>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{t('dashboard.latest_analysis_insights')}</h3>
                      <p className="text-xs text-slate-400">{t('dashboard.file')} {latestReport.filename}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/summary?id=${latestReport.id}`}
                        className="flex items-center space-x-1 text-xs font-bold text-brand-500 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg hover-scale"
                      >
                        <span>{t('dashboard.full_report')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                      <Link
                        to={`/chat?id=${latestReport.id}`}
                        className="flex items-center space-x-1 text-xs font-bold text-indigo-500 hover:underline px-3 py-1.5 bg-indigo-50 rounded-lg hover-scale"
                      >
                        <MessageSquare className="w-3 h-3 mr-0.5" />
                        <span>{t('dashboard.discuss_with_ai')}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Summary Cards Component */}
                  <SummaryCards analysis={latestReport.analysis} />
                </div>
              ) : (
                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center glass-panel">
                  <FileText className="w-16 h-16 text-slate-200 stroke-1 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-800 text-lg">{t('dashboard.no_report_selected')}</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                    {t('dashboard.no_report_desc')}
                  </p>
                  <Link
                    to="/upload"
                    className="mt-6 inline-flex items-center space-x-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-100 transition-all hover-scale"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('dashboard.btn_upload_report')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
