import React, { useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Inbox,
  Shield,
  Layers,
  FileCheck,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'workspace' | 'hitl' | 'documents';
  setActiveTab: (tab: 'workspace' | 'hitl' | 'documents') => void;
  hitlCount: number;
  onUploadFile: (file: File) => void;
  onGenerateDemo: () => void;
  onOpenAudit: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hitlCount,
  onUploadFile,
  onGenerateDemo,
  onOpenAudit,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white m-0">DocExtract</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-500 to-sky-500 text-white">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0">VLM Spatial Extraction & HITL Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 ml-6 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Workspace
            </button>

            <button
              onClick={() => setActiveTab('hitl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'hitl'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              HITL Review Queue
              {hitlCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
                  {hitlCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              All Documents
            </button>
          </nav>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* 1-Click Demo Document Button */}
          <button
            onClick={onGenerateDemo}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isProcessing ? 'Processing Engine...' : '1-Click Enterprise Demo'}
          </button>

          {/* Upload PDF */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Upload PDF
          </button>

          {/* Open Audit Drawer */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Audit Trail
          </button>
        </div>
      </div>
    </header>
  );
};
