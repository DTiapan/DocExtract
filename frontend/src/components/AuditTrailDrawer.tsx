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
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              SOC2 Immutable Audit Trail
            </h3>
            <p className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">
              {documentName || 'Document Lineage'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            No audit records found
          </div>
        ) : (
          logs.map((log) => {
            const isOperator =
              log.operator.includes('operator') ||
              log.operator.includes('reviewer') ||
              log.operator.includes('human');

            return (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                  {isOperator ? (
                    <User className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Cpu className="w-3 h-3 text-indigo-600" />
                  )}
                  <span>{log.operator}</span>
                </div>

                {log.field_name && (
                  <div className="p-2 rounded bg-white border border-slate-200 text-xs font-mono">
                    <div className="text-[10px] text-slate-500 mb-1 font-medium">{log.field_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600 line-through text-[11px] truncate max-w-[120px]">
                        {log.old_value || 'None'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-emerald-700 font-semibold text-[11px] truncate max-w-[140px]">
                        {log.new_value}
                      </span>
                    </div>
                  </div>
                )}

                {log.details && (
                  <pre className="p-2 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
