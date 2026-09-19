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
      <div className="flex flex-col items-center justify-center h-full border border-slate-200 rounded-xl bg-white p-8 text-center text-slate-500 shadow-xs">
        <FileQuestion className="w-10 h-10 mb-2 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">No document page loaded</p>
        <p className="text-xs text-slate-500 mt-0.5">Upload a PDF or click 'Load Enterprise Demo'</p>
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
        stroke: '#1d4ed8', // Enterprise Deep Royal Blue
        fill: 'rgba(29, 78, 216, 0.14)',
        strokeWidth: 2,
      };
    }
    if (isHovered) {
      return {
        stroke: '#2563eb', // Enterprise Cobalt Blue
        fill: 'rgba(37, 99, 235, 0.10)',
        strokeWidth: 1.5,
      };
    }
    if (field.status === 'WARNING' || field.confidence_score < 0.9) {
      return {
        stroke: '#d97706', // Subtle Amber Warning
        fill: 'rgba(217, 119, 6, 0.08)',
        strokeWidth: 1.5,
      };
    }
    return {
      stroke: '#3b82f6', // Clean enterprise cobalt line
      fill: 'rgba(59, 130, 246, 0.05)',
      strokeWidth: 1.25,
    };
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Precision Viewport Controls */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono text-slate-800 font-semibold">Page {page.page_number}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500 text-[11px]">{page.width} × {page.height}px</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 text-[11px] flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            {pageFields.length} regions detected
          </span>
        </div>

        {/* Cursor Coordinates & Zoom Toolbar */}
        <div className="flex items-center space-x-3">
          {cursorPos && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
              <Crosshair className="w-3 h-3 text-slate-400" />
              <span>X: {cursorPos.x}</span>
              <span>Y: {cursorPos.y}</span>
            </div>
          )}

          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-700 font-medium px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Fit Original"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewport - Professional Light Desk Canvas */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-[#f1f5f9] relative">
        <div
          ref={imageContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
          className="relative origin-top shadow-md border border-slate-300/80 rounded-xs overflow-hidden transition-transform duration-100 ease-out max-w-full bg-white"
          style={{
            width: `${Math.round(page.width / 2.5)}px`,
            aspectRatio: `${page.width} / ${page.height}`,
            transform: `scale(${zoom})`,
          }}
        >
          {/* Document Render Image */}
          <img
            src={page.image_url}
            alt={`Page ${page.page_number}`}
            className="w-full h-full block select-none pointer-events-none object-contain"
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
              const tooltipWidth = Math.max(60, field.field_name.length * 6.5 + 32);
              const tooltipX = Math.min(field.bbox_x_min, 996 - tooltipWidth);

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
                    rx={1.5}
                  />

                  {/* Corner Anchors for Selected Box (CAD precision feel) */}
                  {isSelected && (
                    <>
                      <rect x={field.bbox_x_min - 2.5} y={field.bbox_y_min - 2.5} width={5} height={5} fill="#1d4ed8" rx={1} />
                      <rect x={field.bbox_x_max - 2.5} y={field.bbox_y_min - 2.5} width={5} height={5} fill="#1d4ed8" rx={1} />
                      <rect x={field.bbox_x_min - 2.5} y={field.bbox_y_max - 2.5} width={5} height={5} fill="#1d4ed8" rx={1} />
                      <rect x={field.bbox_x_max - 2.5} y={field.bbox_y_max - 2.5} width={5} height={5} fill="#1d4ed8" rx={1} />
                    </>
                  )}

                  {/* Clean Minimalist Label Tooltip */}
                  {(isSelected || isHovered) && (
                    <g transform={`translate(${tooltipX}, ${Math.max(14, field.bbox_y_min - 4)})`}>
                      <rect
                        x={0}
                        y={-12}
                        width={tooltipWidth}
                        height={14}
                        fill="#0f172a"
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
