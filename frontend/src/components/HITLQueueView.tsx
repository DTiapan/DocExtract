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
      <div className="flex flex-col items-center justify-center p-16 text-center border border-[#1b202c] rounded-xl bg-[#0b0d13]">
        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center mb-3 text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">HITL Review Queue is Empty</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          All documents have passed automated extraction confidence (≥90%) and strict mathematical cross-validation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Inbox className="w-4 h-4 text-amber-400" />
            Human-In-The-Loop Review Queue
          </h2>
          <p className="text-xs text-slate-400">
            Documents routed here require human verification due to low extraction confidence (&lt;90%) or mathematical validation alerts.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {queue.length} Pending Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {queue.map((doc) => {
          const ext = doc.latest_extraction;
          const confPercent = ext ? Math.round(ext.overall_confidence * 100) : 0;

          return (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-[#0b0d13] border border-[#1b202c] hover:border-amber-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#141824] border border-[#202738] flex items-center justify-center text-slate-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
                    <AlertTriangle className="w-3 h-3" />
                    {confPercent}%
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-slate-200 mt-2.5 truncate" title={doc.filename}>
                  {doc.filename}
                </h3>

                <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <span className="text-slate-200">{doc.page_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="text-blue-400">{ext?.model_version || 'fallback'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingested:</span>
                    <span className="text-slate-300">
                      {new Date(doc.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {ext?.validation_errors && ext.validation_errors.length > 0 && (
                  <div className="mt-2.5 p-2 rounded bg-rose-950/30 border border-rose-900/40 text-[10px] text-rose-300 font-mono truncate">
                    {ext.validation_errors[0]}
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectDocument(doc)}
                className="mt-3.5 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Inspect & Verify
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
