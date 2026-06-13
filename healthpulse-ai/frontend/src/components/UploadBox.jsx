import React, { useState, useRef, useContext } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { SettingsContext } from '../context/SettingsContext';

export default function UploadBox({ onUploadSuccess }) {
  const { provider, model, getActiveApiKey, language } = useContext(SettingsContext);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, completed, error
  const [errorMessage, setErrorMessage] = useState('');
  const [fileDetails, setFileDetails] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadState('error');
      setErrorMessage('Unsupported file format. Please upload a PDF file.');
      return;
    }
    setFileDetails(file);
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploadState('uploading');
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    formData.append('model', model);
    formData.append('api_key', getActiveApiKey());
    formData.append('language', language);

    try {
      const res = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadState('completed');
      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      setUploadState('error');
      setErrorMessage(err.response?.data?.detail || 'An error occurred during file upload or analysis.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
          dragActive ? 'border-brand-500 bg-brand-50/50 scale-[0.99]' : 'border-slate-200 bg-white hover:border-brand-500/50'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
        />

        {uploadState === 'idle' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mx-auto mb-4 hover:scale-110 transition-transform duration-200">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drag & Drop your medical report PDF here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supported format: PDF up to 10MB
            </p>
            <button
              onClick={triggerFileInput}
              className="mt-6 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 shadow-md shadow-brand-100 transition-colors"
            >
              Browse Files
            </button>
          </div>
        )}

        {uploadState === 'uploading' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mx-auto mb-4">
              <Loader className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Analyzing report...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Extracting text and generating AI insights using {provider}
            </p>
            <div className="w-48 bg-slate-100 h-1.5 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="bg-brand-500 h-full animate-pulse rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        )}

        {uploadState === 'completed' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Analysis Complete!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {fileDetails?.name} was processed successfully.
            </p>
            <div className="mt-6 flex space-x-3 justify-center">
              <button
                onClick={() => setUploadState('idle')}
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

        {uploadState === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Upload Failed
            </p>
            <p className="text-xs text-red-500 mt-1 max-w-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => setUploadState('idle')}
              className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
