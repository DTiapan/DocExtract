import React, { useState } from 'react';
import type { PageResponse, FieldResponse } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, ShieldCheck } from 'lucide-react';

interface DocumentViewerProps {
  page: PageResponse | null;
  fields: FieldResponse[];
  selectedFieldId: string | null;
  onSelectField: (field: FieldResponse) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  page,
  fields,
  selectedFieldId,
  onSelectField,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-slate-800 rounded-xl bg-slate-900/40 backdrop-blur-md p-8 text-center text-slate-500">
        <Eye className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="font-medium text-slate-400">No document page loaded</p>
        <p className="text-xs text-slate-600 mt-1">Upload a PDF or select a document to inspect</p>
      </div>
    );
  }

  // Filter fields belonging to current page
  const pageFields = fields.filter((f) => f.page_number === page.page_number);

  const getConfidenceColor = (field: FieldResponse, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.25)', strokeWidth: 3 };
    if (isHovered) return { stroke: '#818cf8', fill: 'rgba(129, 140, 248, 0.20)', strokeWidth: 2.5 };
    if (field.status === 'WARNING' || field.confidence_score < 0.9) {
      return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', strokeWidth: 2 };
    }
    return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', strokeWidth: 1.5 };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Viewer Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Page {page.page_number}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {page.width} × {page.height} px
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {pageFields.length} Detected Boxes
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 px-2 min-w-[3.5rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas / Image Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-950/40">
        <div
          className="relative transition-transform duration-150 ease-out origin-top shadow-2xl rounded-lg overflow-hidden border border-slate-800"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Rendered Document Page Image */}
          <img
            src={page.image_url}
            alt={`Document Page ${page.page_number}`}
            className="block max-w-none select-none pointer-events-none"
            style={{ width: `${page.width / 1.5}px`, height: `${page.height / 1.5}px` }}
          />

          {/* Interactive SVG Bounding Box Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {pageFields.map((field) => {
              const isSelected = selectedFieldId === field.id;
              const isHovered = hoveredFieldId === field.id;
              const style = getConfidenceColor(field, isSelected, isHovered);

              const width = Math.max(8, field.bbox_x_max - field.bbox_x_min);
              const height = Math.max(8, field.bbox_y_max - field.bbox_y_min);

              return (
                <g
                  key={field.id}
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => onSelectField(field)}
                  onMouseEnter={() => setHoveredFieldId(field.id)}
                  onMouseLeave={() => setHoveredFieldId(null)}
                >
                  {/* Bounding Box Rect */}
                  <rect
                    x={field.bbox_x_min}
                    y={field.bbox_y_min}
                    width={width}
                    height={height}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    rx={3}
                    className={isSelected ? 'filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}
                  />

                  {/* Field Label Badge on hover or selection */}
                  {(isSelected || isHovered) && (
                    <g transform={`translate(${field.bbox_x_min}, ${Math.max(16, field.bbox_y_min - 6)})`}>
                      <rect
                        x={0}
                        y={-14}
                        width={Math.max(60, field.field_name.length * 7 + 38)}
                        height={16}
                        fill="#0f172a"
                        stroke={style.stroke}
                        strokeWidth={1}
                        rx={3}
                      />
                      <text
                        x={5}
                        y={-3}
                        fill="#f8fafc"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="ui-monospace, monospace"
                      >
                        {field.field_name} ({Math.round(field.confidence_score * 100)}%)
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
