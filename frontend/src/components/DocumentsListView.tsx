import React from 'react';
import type { DocumentResponse } from '../types';
import { FileText, CheckCircle, AlertTriangle, ArrowUpRight, Search } from 'lucide-react';

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
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            All Documents Repository
          </h2>
          <p className="text-xs text-slate-400">
            Historical ledger of all ingested PDFs, validation states, and confidence metrics.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Pages</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ingested At</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-sans">
                  No documents found
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const ext = doc.latest_extraction;
                const confPercent = ext ? Math.round(ext.overall_confidence * 100) : 0;

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    <td className="px-4 py-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{doc.page_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : doc.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {doc.status === 'APPROVED' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
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
