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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Enterprise Document Registry
          </h2>
          <p className="text-xs text-slate-500">
            Immutable database records of all parsed documents, validation states, and confidence scores.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename or status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono shadow-xs"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px] font-mono">
            <tr>
              <th className="px-4 py-2.5 font-medium">Document</th>
              <th className="px-4 py-2.5 font-medium">Pages</th>
              <th className="px-4 py-2.5 font-medium">Confidence</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Ingested At</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
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
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{doc.page_count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              confPercent >= 90 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px]">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : doc.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {doc.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="p-1 rounded bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white transition-all shadow-xs"
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
