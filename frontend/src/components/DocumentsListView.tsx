import React from 'react';
import type { DocumentResponse } from '../types';
import { FileText, CheckCircle2, AlertTriangle, ArrowUpRight, Search } from 'lucide-react';

interface DocumentsListViewProps {
  documents: DocumentResponse[];
  onSelectDocument: (doc: DocumentResponse) => void;
}

export const DocumentsListView: React.FC<DocumentsListViewProps> = ({
  documents,
  onSelectDocument,
}) => {
  const [filter, setFilter] = React.useState('');

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(filter.toLowerCase()) ||
    d.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Enterprise Document Registry
          </h2>
          <p className="text-xs text-slate-400">
            Immutable database records of all parsed documents, validation states, and confidence scores.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename or status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#0d1017] border border-[#1b202c] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#1b202c] overflow-hidden bg-[#0b0d13]">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0d1017] text-slate-400 border-b border-[#1b202c] uppercase tracking-wider text-[10px] font-mono">
            <tr>
              <th className="px-4 py-2.5 font-medium">Document</th>
              <th className="px-4 py-2.5 font-medium">Pages</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Ingested At</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181d28] font-mono text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-sans text-xs">
                  No documents found in registry
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const ext = doc.latest_extraction;
                const confPercent = ext ? Math.round(ext.overall_confidence * 100) : 0;

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#111520] transition-colors cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{doc.page_count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-[#181d28] rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              confPercent >= 90 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-[11px]">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : doc.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {doc.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="p-1 rounded bg-[#141824] hover:bg-blue-600 text-slate-300 hover:text-white transition-all"
                        title="Open in Workspace"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
