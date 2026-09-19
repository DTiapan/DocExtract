import React, { useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Inbox,
  ShieldCheck,
  Columns2,
  FolderArchive,
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
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-2.5 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Brand & Workspace Name */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-slate-900">DocExtract</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200">
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Clean Segmented Navigation Control */}
          <nav className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 text-blue-600" />
              Workspace
            </button>

            <button
              onClick={() => setActiveTab('hitl')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'hitl'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 text-amber-600" />
              Review Queue
              {hitlCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-semibold border border-amber-300">
                  {hitlCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
              Document Registry
            </button>
          </nav>
        </div>

        {/* Status Indicators & Action Bar */}
        <div className="flex items-center space-x-3">
          {/* Subtle Confidence Policy Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Auto-Approve Threshold: <strong className="text-slate-900 font-semibold">≥90%</strong>
          </div>

          {/* 1-Click Enterprise Demo */}
          <button
            onClick={onGenerateDemo}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isProcessing ? 'Processing...' : 'Load Enterprise Demo'}
          </button>

          {/* Upload Button */}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Upload PDF
          </button>

          {/* Audit Trail Drawer Trigger */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
            title="View SOC2 Immutable Audit Log"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Audit Trail
          </button>
        </div>
      </div>
    </header>
  );
};
