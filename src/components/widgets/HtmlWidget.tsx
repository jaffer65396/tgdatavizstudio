import React, { useState, useMemo } from 'react';
import { Code, ExternalLink, RefreshCw, Eye, Edit3, Shield, ShieldCheck, Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';
import { DashboardElement } from '../../types/dashboard';

interface HtmlWidgetProps {
  element: DashboardElement;
  onEditCode?: () => void;
  isEditMode?: boolean;
}

export const HtmlWidget: React.FC<HtmlWidgetProps> = ({
  element,
  onEditCode,
  isEditMode = true
}) => {
  const [viewSource, setViewSource] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Retrieve HTML code from config or customHtml
  const htmlContent = useMemo(() => {
    return (
      element.config?.htmlCode ||
      element.customHtml ||
      `<div style="padding: 18px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #f8fafc; background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8)); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.35); height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #60a5fa; background: rgba(59, 130, 246, 0.2); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">
        ⚡ Integrated Custom HTML
      </span>
      <span style="font-size: 11px; color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 4px;">
        <span style="width: 7px; height: 7px; background-color: #34d399; border-radius: 50%; display: inline-block;"></span>
        Live Canvas
      </span>
    </div>
    <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
      Executive Operational Bulletin
    </h3>
    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
      Renders validated HTML, Tailwind classes, inline CSS, dynamic tables, SVG graphics, and interactive elements.
    </p>
  </div>
  
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px;">
    <div style="padding: 8px 10px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px;">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: monospace;">PIPELINE STATUS</div>
      <div style="font-size: 14px; font-weight: 700; color: #34d399; margin-top: 2px;">99.98% Healthy</div>
    </div>
    <div style="padding: 8px 10px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px;">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-family: monospace;">SECURITY MODE</div>
      <div style="font-size: 14px; font-weight: 700; color: #60a5fa; margin-top: 2px;">XSS Sanitized</div>
    </div>
  </div>
</div>`
    ).trim();
  }, [element.config?.htmlCode, element.customHtml]);

  const useSandbox = element.config?.htmlSandbox ?? false;

  // Sanitize HTML with DOMPurify when not using sandbox mode to prevent XSS attacks
  const sanitizedHtml = useMemo(() => {
    if (useSandbox) return htmlContent;
    return DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ['style', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text'],
      ADD_ATTR: ['target', 'style', 'class', 'id', 'width', 'height', 'viewBox', 'fill', 'stroke', 'd', 'xmlns'],
      ALLOW_DATA_ATTR: true
    });
  }, [htmlContent, useSandbox]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0f17] text-[#dfe2ee] overflow-hidden select-text relative group">
      {/* Top micro-toolbar for quick source switch / edit / sandbox indicator */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f172a]/95 backdrop-blur-md px-1.5 py-1 rounded-[4px] border border-[#334155] shadow-xl">
        {/* Security badge */}
        <span
          className={`px-1.5 py-0.5 text-[9px] font-mono rounded flex items-center gap-1 ${
            useSandbox
              ? 'bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/40'
              : 'bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/40'
          }`}
          title={
            useSandbox
              ? 'Isolated Iframe Sandbox: Scripts & basic JS allowed in isolation'
              : 'DOMPurify Active: XSS attacks neutralized while allowing safe HTML tags'
          }
        >
          {useSandbox ? (
            <>
              <Shield className="w-2.5 h-2.5 text-[#38bdf8]" />
              <span>Sandbox</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-2.5 h-2.5 text-[#34d399]" />
              <span>Sanitized</span>
            </>
          )}
        </span>

        {/* Reload button for iframe */}
        {useSandbox && (
          <button
            type="button"
            onClick={handleReload}
            className="p-1 text-[#94a3b8] hover:text-[#f8fafc] rounded hover:bg-[#1e293b] transition-colors"
            title="Reload HTML frame"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}

        {/* Copy source */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="p-1 text-[#94a3b8] hover:text-[#f8fafc] rounded hover:bg-[#1e293b] transition-colors"
          title="Copy HTML code"
        >
          {copied ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
        </button>

        {/* Toggle between rendered preview and source view */}
        <button
          type="button"
          onClick={() => setViewSource(!viewSource)}
          className="px-1.5 py-0.5 text-[10px] font-mono text-[#94a3b8] hover:text-[#f8fafc] rounded hover:bg-[#1e293b] flex items-center gap-1 transition-colors"
          title={viewSource ? 'Show Rendered HTML' : 'View HTML Source Code'}
        >
          {viewSource ? <Eye className="w-3 h-3 text-[#38bdf8]" /> : <Code className="w-3 h-3 text-[#38bdf8]" />}
          <span>{viewSource ? 'Render' : 'Source'}</span>
        </button>

        {/* Edit in dedicated modal */}
        {onEditCode && isEditMode && (
          <button
            type="button"
            onClick={onEditCode}
            className="px-2 py-0.5 text-[10px] font-mono bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded flex items-center gap-1 transition-colors shadow-sm"
            title="Edit HTML Code in Studio Modal"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full overflow-auto">
        {viewSource ? (
          <div className="w-full h-full p-3 bg-[#030712] font-mono text-[11px] text-[#38bdf8] overflow-auto">
            <div className="text-[10px] text-[#64748b] mb-2 pb-1 border-b border-[#1e293b] flex items-center justify-between">
              <span className="font-semibold text-[#cbd5e1]">HTML Source Code:</span>
              <span className="text-[#34d399] font-mono">{htmlContent.length} bytes</span>
            </div>
            <pre className="whitespace-pre-wrap break-all font-mono leading-relaxed text-[#93c5fd]">
              {htmlContent}
            </pre>
          </div>
        ) : useSandbox ? (
          <iframe
            key={iframeKey}
            title={element.title || 'HTML Embed'}
            srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: transparent; color: #f8fafc; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}
      </div>
    </div>
  );
};
