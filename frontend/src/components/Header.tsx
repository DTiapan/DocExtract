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
    <header className="border-b border-[#1b202c] bg-[#090b10] sticky top-0 z-40 px-6 py-2.5">
      <div className="flex items-center justify-between">
        {/* Brand & Workspace Name */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#141824] border border-[#23293b] flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">DocExtract</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-[#141824] border border-[#202738]">
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-[#1e2536]" />

          {/* Clean Segmented Navigation Control */}
          <nav className="flex items-center bg-[#0d1017] p-0.5 rounded-lg border border-[#1b202e]">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-[#181e2b] text-white shadow-sm border border-[#242c3f]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 text-blue-400" />
              Workspace
            </button>

            <button
              onClick={() => setActiveTab('hitl')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'hitl'
                  ? 'bg-[#181e2b] text-white shadow-sm border border-[#242c3f]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              Review Queue
              {hitlCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                  {hitlCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-[#181e2b] text-white shadow-sm border border-[#242c3f]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
              Document Registry
            </button>
          </nav>
        </div>

        {/* Status Indicators & Action Bar */}
        <div className="flex items-center space-x-3">
          {/* Subtle Confidence Policy Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d1017] border border-[#1b202e] text-[11px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Auto-Approve Threshold: <strong className="text-slate-200">≥90%</strong>
          </div>

          {/* 1-Click Enterprise Demo */}
          <button
            onClick={onGenerateDemo}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm disabled:opacity-50"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#11141d] hover:bg-[#181e2b] text-slate-200 border border-[#22283a] transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Upload PDF
          </button>

          {/* Audit Trail Drawer Trigger */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#11141d] hover:bg-[#181e2b] text-slate-300 border border-[#22283a] transition-all"
            title="View SOC2 Immutable Audit Log"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Audit Trail
          </button>
        </div>
      </div>
    </header>
  );
};
