import React from 'react';
import type { AuditLogResponse } from '../types';
import { ShieldCheck, History, User, Cpu, ArrowRight, X } from 'lucide-react';

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogResponse[];
  documentName?: string;
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  documentName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl z-50 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">SOC2 Audit Trail</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
              {documentName || 'Document Lineage'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No audit records found
          </div>
        ) : (
          logs.map((log) => {
            const isOperator = log.operator.includes('operator') || log.operator.includes('reviewer') || log.operator.includes('human');

            return (
              <div key={log.id} className="relative pl-6 pb-2 border-l border-slate-800 last:border-0">
                {/* Timeline Node Dot */}
                <div
                  className={`absolute -left-2 top-0.5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                    isOperator ? 'bg-sky-500' : 'bg-indigo-500'
                  }`}
                ></div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    {isOperator ? (
                      <User className="w-3 h-3 text-sky-400" />
                    ) : (
                      <Cpu className="w-3 h-3 text-indigo-400" />
                    )}
                    <span className="font-mono text-slate-300">{log.operator}</span>
                  </div>

                  {log.field_name && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="text-[10px] text-slate-500 mb-1">{log.field_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 line-through text-[11px] truncate max-w-[100px]">
                          {log.old_value || 'None'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        <span className="text-emerald-400 font-semibold text-[11px] truncate max-w-[120px]">
                          {log.new_value}
                        </span>
                      </div>
                    </div>
                  )}

                  {log.details && (
                    <pre className="mt-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px] font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
