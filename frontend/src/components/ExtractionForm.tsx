import React, { useState, useEffect } from 'react';
import type { ExtractionResponse, FieldResponse } from '../types';
import {
  CheckCircle,
  AlertTriangle,
  Save,
  Check,
  Calculator,
  Layers,
  Info,
} from 'lucide-react';

interface ExtractionFormProps {
  extraction: ExtractionResponse | null;
  selectedFieldId: string | null;
  onSelectField: (field: FieldResponse) => void;
  onSaveFieldUpdates: (updates: { field_id: string; new_value: string }[]) => Promise<void>;
  onApproveExtraction: (extractionId: string) => Promise<void>;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  extraction,
  selectedFieldId,
  onSelectField,
  onSaveFieldUpdates,
  onApproveExtraction,
}) => {
  const [editedValues, setEditedValues] = useState<{ [fieldId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (extraction) {
      const initial: { [id: string]: string } = {};
      extraction.fields.forEach((f) => {
        initial[f.id] = f.extracted_value || '';
      });
      setEditedValues(initial);
    }
  }, [extraction]);

  if (!extraction) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-slate-800 rounded-2xl bg-slate-900/60 p-8 text-center text-slate-500 backdrop-blur-md">
        <Calculator className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="font-medium text-slate-400">No active extraction</p>
        <p className="text-xs text-slate-600 mt-1">Upload a PDF to view structured Pydantic fields</p>
      </div>
    );
  }

  const handleValueChange = (fieldId: string, val: string) => {
    setEditedValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSave = async () => {
    const dirtyUpdates = Object.entries(editedValues)
      .filter(([id, val]) => {
        const original = extraction.fields.find((f) => f.id === id)?.extracted_value || '';
        return val !== original;
      })
      .map(([id, val]) => ({ field_id: id, new_value: val }));

    if (dirtyUpdates.length === 0) return;

    setIsSaving(true);
    try {
      await onSaveFieldUpdates(dirtyUpdates);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApproveExtraction(extraction.id);
    } finally {
      setIsApproving(false);
    }
  };

  const hasDirtyEdits = Object.entries(editedValues).some(([id, val]) => {
    const original = extraction.fields.find((f) => f.id === id)?.extracted_value || '';
    return val !== original;
  });

  const getStatusBadge = (field: FieldResponse) => {
    if (field.status === 'MANUAL_OVERRIDE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800">
          Manual Override
        </span>
      );
    }
    if (field.status === 'WARNING' || field.confidence_score < 0.9) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
          <AlertTriangle className="w-3 h-3" />
          {Math.round(field.confidence_score * 100)}% Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
        <Check className="w-3 h-3" />
        {Math.round(field.confidence_score * 100)}%
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Form Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Pydantic Schema Validation
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                extraction.status === 'AUTO_APPROVED' || extraction.status === 'HUMAN_APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {extraction.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>Overall Confidence: <strong className="text-slate-200">{Math.round(extraction.overall_confidence * 100)}%</strong></span>
            <span>•</span>
            <span>Model: <span className="font-mono text-indigo-300">{extraction.model_version}</span></span>
            <span>•</span>
            <span>Retries: <strong className="text-slate-200">{extraction.retry_count}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {hasDirtyEdits && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Edits'}
            </button>
          )}

          <button
            onClick={handleApprove}
            disabled={isApproving || extraction.status === 'HUMAN_APPROVED'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isApproving
              ? 'Committing...'
              : extraction.status === 'HUMAN_APPROVED'
              ? 'Committed'
              : 'Approve & Commit'}
          </button>
        </div>
      </div>

      {/* Validation Warning Alert if any */}
      {extraction.validation_errors && extraction.validation_errors.length > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-200">Mathematical Cross-Validation Alert:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-300/90 font-mono text-[11px]">
              {extraction.validation_errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Fields List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {extraction.fields.map((field) => {
          const isSelected = selectedFieldId === field.id;
          const currentValue = editedValues[field.id] ?? field.extracted_value ?? '';

          return (
            <div
              key={field.id}
              onClick={() => onSelectField(field)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-sky-500 shadow-md shadow-sky-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 capitalize flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {field.field_name.replace(/_/g, ' ')}
                </label>
                {getStatusBadge(field)}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>

              {field.warning_message && (
                <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  {field.warning_message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
