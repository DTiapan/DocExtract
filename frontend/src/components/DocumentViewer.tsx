import React, { useState, useRef } from 'react';
import type { PageResponse, FieldResponse } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Crosshair, FileQuestion } from 'lucide-react';

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
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-[#1b202c] rounded-xl bg-[#0b0d13] p-8 text-center text-slate-500">
        <FileQuestion className="w-10 h-10 mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No document page loaded</p>
        <p className="text-xs text-slate-600 mt-0.5">Upload a PDF or click 'Load Enterprise Demo'</p>
      </div>
    );
  }

  const pageFields = fields.filter((f) => f.page_number === page.page_number);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xNorm = Math.max(0, Math.min(1000, Math.round(((e.clientX - rect.left) / rect.width) * 1000)));
    const yNorm = Math.max(0, Math.min(1000, Math.round(((e.clientY - rect.top) / rect.height) * 1000)));
    setCursorPos({ x: xNorm, y: yNorm });
  };

  const getBoundingBoxStyle = (field: FieldResponse, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return {
        stroke: '#3b82f6', // Solid crisp blue
        fill: 'rgba(59, 130, 246, 0.16)',
        strokeWidth: 2,
      };
    }
    if (isHovered) {
      return {
        stroke: '#60a5fa',
        fill: 'rgba(96, 165, 250, 0.12)',
        strokeWidth: 2,
      };
    }
    if (field.status === 'WARNING' || field.confidence_score < 0.9) {
      return {
        stroke: '#f59e0b',
        fill: 'rgba(245, 158, 11, 0.10)',
        strokeWidth: 1.5,
      };
    }
    return {
      stroke: '#10b981',
      fill: 'rgba(16, 185, 129, 0.08)',
      strokeWidth: 1.5,
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0d13] border border-[#1b202c] rounded-xl overflow-hidden shadow-sm">
      {/* Top Precision Viewport Controls */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1b202c] bg-[#0d1017]">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono text-slate-300 font-medium">Page {page.page_number}</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400 text-[11px]">{page.width} × {page.height}px</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {pageFields.length} regions detected
          </span>
        </div>

        {/* Cursor Coordinates & Zoom Toolbar */}
        <div className="flex items-center space-x-3">
          {cursorPos && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-[#141824] px-2 py-0.5 rounded border border-[#202738]">
              <Crosshair className="w-3 h-3 text-slate-500" />
              <span>X: {cursorPos.x}</span>
              <span>Y: {cursorPos.y}</span>
            </div>
          )}

          <div className="flex items-center bg-[#141824] border border-[#202738] rounded-md p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 rounded hover:bg-[#1f2638] text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 rounded hover:bg-[#1f2638] text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded hover:bg-[#1f2638] text-slate-400 hover:text-slate-200 transition-colors"
              title="Fit Original"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-[#06080c] relative">
        <div
          ref={imageContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
          className="relative origin-top shadow-xl border border-[#1b202c] rounded-md overflow-hidden transition-transform duration-100 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Document Render Image */}
          <img
            src={page.image_url}
            alt={`Page ${page.page_number}`}
            className="block max-w-none select-none pointer-events-none"
            style={{ width: `${page.width / 1.5}px`, height: `${page.height / 1.5}px` }}
          />

          {/* SVG Bounding Box Canvas Overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {pageFields.map((field) => {
              const isSelected = selectedFieldId === field.id;
              const isHovered = hoveredFieldId === field.id;
              const style = getBoundingBoxStyle(field, isSelected, isHovered);

              const width = Math.max(6, field.bbox_x_max - field.bbox_x_min);
              const height = Math.max(6, field.bbox_y_max - field.bbox_y_min);

              return (
                <g
                  key={field.id}
                  className="cursor-pointer"
                  onClick={() => onSelectField(field)}
                  onMouseEnter={() => setHoveredFieldId(field.id)}
                  onMouseLeave={() => setHoveredFieldId(null)}
                >
                  <rect
                    x={field.bbox_x_min}
                    y={field.bbox_y_min}
                    width={width}
                    height={height}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    rx={2}
                    className={isSelected ? 'active-svg-box' : ''}
                  />

                  {/* Corner Anchors for Selected Box (Annotation CAD feel) */}
                  {isSelected && (
                    <>
                      <circle cx={field.bbox_x_min} cy={field.bbox_y_min} r={2.5} fill="#3b82f6" />
                      <circle cx={field.bbox_x_max} cy={field.bbox_y_min} r={2.5} fill="#3b82f6" />
                      <circle cx={field.bbox_x_min} cy={field.bbox_y_max} r={2.5} fill="#3b82f6" />
                      <circle cx={field.bbox_x_max} cy={field.bbox_y_max} r={2.5} fill="#3b82f6" />
                    </>
                  )}

                  {/* Clean Minimalist Label Tooltip */}
                  {(isSelected || isHovered) && (
                    <g transform={`translate(${field.bbox_x_min}, ${Math.max(14, field.bbox_y_min - 4)})`}>
                      <rect
                        x={0}
                        y={-12}
                        width={Math.max(60, field.field_name.length * 6.5 + 32)}
                        height={14}
                        fill="#0b0d13"
                        stroke={style.stroke}
                        strokeWidth={1}
                        rx={2}
                      />
                      <text
                        x={4}
                        y={-2}
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="500"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {field.field_name} {Math.round(field.confidence_score * 100)}%
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
