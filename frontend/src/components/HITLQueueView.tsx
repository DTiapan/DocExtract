import React from 'react';
import type { DocumentResponse } from '../types';
import { Inbox, AlertTriangle, ArrowUpRight, CheckCircle2, FileText } from 'lucide-react';

interface HITLQueueViewProps {
  queue: DocumentResponse[];
  onSelectDocument: (doc: DocumentResponse) => void;
}

export const HITLQueueView: React.FC<HITLQueueViewProps> = ({ queue, onSelectDocument }) => {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-slate-800/80 rounded-2xl bg-slate-900/40 backdrop-blur-xl">
        <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center mb-4 text-emerald-400">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">HITL Queue is Empty</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          All high-confidence documents ($\ge 90\%$) have been automatically validated and committed to the database sink.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-400" />
            Human-In-The-Loop Review Queue
          </h2>
          <p className="text-xs text-slate-400">
            Documents routed here have extraction confidence &lt; 90% or failed deterministic Pydantic mathematical cross-checks.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {queue.length} Pending Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queue.map((doc) => {
          const ext = doc.latest_extraction;
          const confPercent = ext ? Math.round(ext.overall_confidence * 100) : 0;

          return (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all shadow-lg backdrop-blur-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/80">
                    <AlertTriangle className="w-3 h-3" />
                    {confPercent}% Confidence
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-200 mt-3 truncate" title={doc.filename}>
                  {doc.filename}
                </h3>

                <div className="mt-2 space-y-1 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <span className="text-slate-300">{doc.page_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="text-indigo-400">{ext?.model_version || 'fallback'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-slate-300">
                      {new Date(doc.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {ext?.validation_errors && ext.validation_errors.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-300 truncate">
                    {ext.validation_errors[0]}
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectDocument(doc)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors shadow-md shadow-amber-600/20"
              >
                Review In Workspace
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
