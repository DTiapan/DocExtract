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
      <div className="flex flex-col items-center justify-center p-16 text-center border border-slate-200 rounded-xl bg-white shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">HITL Review Queue is Empty</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          All documents have passed automated extraction confidence (≥90%) and strict mathematical cross-validation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-amber-600" />
            Human-In-The-Loop Review Queue
          </h2>
          <p className="text-xs text-slate-500">
            Documents routed here require human verification due to low extraction confidence (&lt;90%) or mathematical validation alerts.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
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
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-colors flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {confPercent}%
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-slate-800 mt-2.5 truncate" title={doc.filename}>
                  {doc.filename}
                </h3>

                <div className="mt-2 space-y-1 text-[11px] text-slate-500 font-mono">
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <span className="text-slate-800 font-medium">{doc.page_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="text-blue-600">{ext?.model_version || 'fallback'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingested:</span>
                    <span className="text-slate-700">
                      {new Date(doc.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {ext?.validation_errors && ext.validation_errors.length > 0 && (
                  <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-mono truncate">
                    {ext.validation_errors[0]}
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectDocument(doc)}
                className="mt-3.5 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs"
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
