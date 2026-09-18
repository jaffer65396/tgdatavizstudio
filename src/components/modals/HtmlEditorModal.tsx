import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Code,
  Eye,
  Sparkles,
  Check,
  Copy,
  Layers,
  LayoutTemplate,
  Shield,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Terminal,
  BookOpen
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { DashboardElement } from '../../types/dashboard';

interface HtmlEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  element?: DashboardElement | null;
  initialHtml?: string;
  elementTitle?: string;
  isSandbox?: boolean;
  onSave: (code: string, isSandbox: boolean, title?: string) => void;
}

const HTML_PRESETS = [
  {
    id: 'kpi-banner',
    name: 'Executive Metric Banner',
    badge: 'Styling',
    description: 'Modern glassmorphic stats banner with gradient and pulsing indicator',
    code: `<div style="padding: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.35); height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #60a5fa; background: rgba(59, 130, 246, 0.2); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.3);">
        🚀 Executive Highlights
      </span>
      <span style="font-size: 11px; color: #34d399; font-weight: 600; display: flex; align-items: center; gap: 4px;">
        <span style="width: 7px; height: 7px; background-color: #34d399; border-radius: 50%; display: inline-block;"></span>
        Operational
      </span>
    </div>
    <h2 style="margin: 12px 0 4px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
      Q1 Global Performance Record
    </h2>
    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
      Surpassed fiscal baseline with <strong>+18.4% ARR expansion</strong> across core enterprise tiers.
    </p>
  </div>

  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px;">
    <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Run-Rate ARR</div>
      <div style="font-size: 16px; font-weight: 700; color: #38bdf8;">$48.2M</div>
    </div>
    <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Retention</div>
      <div style="font-size: 16px; font-weight: 700; color: #34d399;">118.2%</div>
    </div>
    <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Efficiency</div>
      <div style="font-size: 16px; font-weight: 700; color: #a78bfa;">3.8x</div>
    </div>
  </div>
</div>`
  },
  {
    id: 'js-calculator',
    name: 'Interactive Calculator (JS)',
    badge: 'JavaScript',
    description: 'Interactive counter and margin calculator running safe JavaScript in sandbox',
    code: `<div style="padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; background: #0b0f17; border-radius: 8px; border: 1px solid #3b82f6; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 11px; font-weight: 700; color: #60a5fa; background: rgba(59, 130, 246, 0.2); padding: 2px 8px; border-radius: 4px;">
        ⚡ Interactive JavaScript Widget
      </span>
      <span style="font-size: 10px; color: #a78bfa; font-family: monospace;">sandbox="allow-scripts"</span>
    </div>
    <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #ffffff;">
      Quick Sales Margin Estimator
    </h3>
    <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">
      Click buttons below to dynamically simulate pricing and compute instant gross margins.
    </p>
  </div>

  <div style="background: #111827; padding: 12px; border-radius: 6px; border: 1px solid #1e293b;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 12px; color: #cbd5e1;">Base Deal Price ($):</span>
      <span id="price-display" style="font-size: 16px; font-weight: 700; color: #38bdf8; font-family: monospace;">$10,000</span>
    </div>
    <div style="display: flex; gap: 6px; margin-bottom: 12px;">
      <button onclick="adjustPrice(-1000)" style="flex: 1; padding: 6px; background: #1e293b; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-size: 11px; cursor: pointer;">- $1,000</button>
      <button onclick="adjustPrice(1000)" style="flex: 1; padding: 6px; background: #1e293b; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-size: 11px; cursor: pointer;">+ $1,000</button>
      <button onclick="adjustPrice(5000)" style="flex: 1; padding: 6px; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">+ $5,000</button>
    </div>
    <div style="padding-top: 8px; border-top: 1px solid #334155; display: flex; justify-content: space-between; font-size: 11px;">
      <span style="color: #94a3b8;">Est. Net Profit (42% Margin):</span>
      <span id="profit-display" style="font-weight: 700; color: #4ade80; font-family: monospace;">$4,200</span>
    </div>
  </div>
</div>

<script>
  let currentPrice = 10000;
  function adjustPrice(delta) {
    currentPrice = Math.max(1000, currentPrice + delta);
    document.getElementById('price-display').innerText = '$' + currentPrice.toLocaleString();
    const profit = Math.round(currentPrice * 0.42);
    document.getElementById('profit-display').innerText = '$' + profit.toLocaleString();
  }
</script>`
  },
  {
    id: 'status-alert',
    name: 'Status & Maintenance Alert',
    badge: 'Notice',
    description: 'Notice banner with warning badge, styled checklist, and action buttons',
    code: `<div style="padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; background: #0f172a; border-radius: 8px; border: 1px solid #f59e0b; height: 100%; box-sizing: border-box;">
  <div style="display: flex; align-items: flex-start; gap: 12px;">
    <div style="font-size: 22px; line-height: 1;">⚠️</div>
    <div style="flex: 1;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #fbbf24;">
          Data Warehouse Maintenance Window
        </h4>
        <span style="font-size: 10px; font-family: monospace; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 2px 6px; border-radius: 4px;">
          P2 SCHEDULED
        </span>
      </div>
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
        OLAP partition optimization scheduled for 02:00 UTC. Live canvas cross-filtering and sequential sorting remain fully accessible.
      </p>
      <div style="display: flex; gap: 8px;">
        <button style="font-size: 11px; font-weight: 600; color: #0f172a; background: #f59e0b; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;">
          View Runbook
        </button>
        <button style="font-size: 11px; font-weight: 500; color: #94a3b8; background: transparent; border: 1px solid #334155; padding: 4px 10px; border-radius: 4px; cursor: pointer;">
          Acknowledge
        </button>
      </div>
    </div>
  </div>
</div>`
  },
  {
    id: 'embed-iframe',
    name: 'Embedded Web Page / Iframe',
    badge: 'Iframe',
    description: 'Embed documentation, external web apps, live dashboards, or videos',
    code: `<div style="width: 100%; height: 100%; box-sizing: border-box; background: #030712; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; display: flex; flex-direction: column;">
  <div style="padding: 8px 12px; background: #0f172a; border-bottom: 1px solid #1e293b; font-size: 11px; font-family: monospace; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
    <span style="display: flex; align-items: center; gap: 6px;">
      <span style="width: 6px; height: 6px; background: #38bdf8; border-radius: 50%;"></span>
      🌐 Embedded Secure Resource
    </span>
    <span style="color: #38bdf8;">sandbox="allow-scripts"</span>
  </div>
  <iframe 
    src="https://en.wikipedia.org/wiki/Business_intelligence" 
    style="width: 100%; height: calc(100% - 32px); border: none;"
    title="Embedded Documentation"
  ></iframe>
</div>`
  },
  {
    id: 'custom-table',
    name: 'Formatted HTML Report Table',
    badge: 'Table',
    description: 'Custom micro-table with status badges, target vs actual comparisons',
    code: `<div style="padding: 14px; font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; background: #0b0f17; border: 1px solid #1e293b; border-radius: 8px; height: 100%; box-sizing: border-box; overflow-y: auto;">
  <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
    <span>Regional Service Level Objectives</span>
    <span style="font-size: 10px; font-family: monospace; color: #4ade80; background: rgba(74, 222, 128, 0.1); padding: 2px 6px; border-radius: 3px;">LIVE SYNC</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
    <thead>
      <tr style="border-bottom: 1px solid #334155; color: #64748b; text-align: left;">
        <th style="padding: 6px;">Region</th>
        <th style="padding: 6px;">Target</th>
        <th style="padding: 6px;">Actual</th>
        <th style="padding: 6px;">Uptime Status</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 6px; font-weight: 600;">North America (US-East)</td>
        <td style="padding: 6px; color: #94a3b8;">99.9%</td>
        <td style="padding: 6px; font-weight: 600; color: #4ade80;">99.98%</td>
        <td style="padding: 6px;"><span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;">OPTIMAL</span></td>
      </tr>
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 6px; font-weight: 600;">Europe (EU-Central)</td>
        <td style="padding: 6px; color: #94a3b8;">99.9%</td>
        <td style="padding: 6px; font-weight: 600; color: #4ade80;">99.95%</td>
        <td style="padding: 6px;"><span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;">OPTIMAL</span></td>
      </tr>
      <tr>
        <td style="padding: 6px; font-weight: 600;">Asia Pacific (APAC-South)</td>
        <td style="padding: 6px; color: #94a3b8;">99.5%</td>
        <td style="padding: 6px; font-weight: 600; color: #38bdf8;">99.82%</td>
        <td style="padding: 6px;"><span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;">HEALTHY</span></td>
      </tr>
    </tbody>
  </table>
</div>`
  },
  {
    id: 'svg-gauge',
    name: 'Dynamic SVG Vector Gauge',
    badge: 'SVG',
    description: 'Clean circular vector gauge with gradient stroke and animated badge',
    code: `<div style="padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; background: linear-gradient(180deg, #0b0f17 0%, #111827 100%); border: 1px solid #1e293b; border-radius: 8px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
  <div style="position: relative; width: 120px; height: 120px;">
    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-90deg);">
      <circle cx="50" cy="50" r="42" stroke="#1e293b" stroke-width="10" fill="none" />
      <circle cx="50" cy="50" r="42" stroke="url(#grad)" stroke-width="10" stroke-dasharray="264" stroke-dashoffset="40" stroke-linecap="round" fill="none" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
      </defs>
    </svg>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #ffffff;">85%</div>
      <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Quota</div>
    </div>
  </div>
  <div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: #f8fafc;">Enterprise Target Attainment</div>
  <div style="font-size: 11px; color: #34d399; margin-top: 2px;">+14.2% ahead of quarterly schedule</div>
</div>`
  }
];

export const HtmlEditorModal: React.FC<HtmlEditorModalProps> = ({
  isOpen,
  onClose,
  element,
  initialHtml,
  elementTitle,
  isSandbox,
  onSave
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [useSandbox, setUseSandbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Sync state whenever opened or element changes
  useEffect(() => {
    if (isOpen) {
      const codeVal =
        initialHtml ||
        element?.config?.htmlCode ||
        element?.customHtml ||
        HTML_PRESETS[0].code;

      const titleVal =
        elementTitle ||
        element?.title ||
        'Custom HTML Integration';

      const sandboxVal =
        isSandbox !== undefined
          ? isSandbox
          : element?.config?.htmlSandbox ?? false;

      setCode(codeVal);
      setTitle(titleVal);
      setUseSandbox(sandboxVal);
    }
  }, [isOpen, element, initialHtml, elementTitle, isSandbox]);

  // Check if code contains script tags or inline JS handlers
  const securityAudit = useMemo(() => {
    const hasScript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(code);
    const hasOnHandler = /\bon\w+\s*=/i.test(code);
    const hasJavascriptUrl = /href\s*=\s*['"]?javascript:/i.test(code);
    const hasPotentialXss = hasScript || hasOnHandler || hasJavascriptUrl;

    return {
      hasScript,
      hasOnHandler,
      hasJavascriptUrl,
      hasPotentialXss
    };
  }, [code]);

  // Clean sanitized HTML for live preview when in sanitized mode
  const sanitizedPreviewHtml = useMemo(() => {
    if (useSandbox) return code;
    return DOMPurify.sanitize(code, {
      ADD_TAGS: ['style', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text'],
      ADD_ATTR: ['target', 'style', 'class', 'id', 'width', 'height', 'viewBox', 'fill', 'stroke', 'd', 'xmlns'],
      ALLOW_DATA_ATTR: true
    });
  }, [code, useSandbox]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApplyPreset = (presetCode: string, presetName?: string) => {
    setCode(presetCode);
    if (presetName && (!title || title === 'Custom HTML Integration' || title === 'Custom HTML Widget')) {
      setTitle(presetName);
    }
    // Auto-enable sandbox if preset has JS script tag
    if (/<script/i.test(presetCode)) {
      setUseSandbox(true);
    }
    setPreviewKey((k) => k + 1);
  };

  const handleSaveAndClose = () => {
    onSave(code, useSandbox, title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#0f131c] border border-[#1e293b] rounded-[10px] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-[#1e293b] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3b82f6]/20 border border-[#3b82f6]/40 rounded-[6px]">
              <Code className="w-5 h-5 text-[#60a5fa]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-[#f8fafc]">HTML Integration Studio</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/30">
                  DOM & Sandboxed
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  XSS Protected
                </span>
              </div>
              <p className="text-[11px] text-[#8c909f]">
                Embed raw HTML code, inline CSS, vector SVGs, iframe resources, and safe JavaScript onto the canvas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0b0f17] border border-[#1e293b] rounded-[4px] p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'editor' ? 'bg-[#3b82f6] text-white font-semibold' : 'text-[#8c909f] hover:text-[#f8fafc]'}`}
              >
                Code Only
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'split' ? 'bg-[#3b82f6] text-white font-semibold' : 'text-[#8c909f] hover:text-[#f8fafc]'}`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'preview' ? 'bg-[#3b82f6] text-white font-semibold' : 'text-[#8c909f] hover:text-[#f8fafc]'}`}
              >
                Preview Only
              </button>
            </div>

            {/* Help / Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className={`p-1.5 rounded-[4px] border transition-colors flex items-center gap-1 text-[11px] font-medium ${
                showHelpGuide
                  ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#fbbf24]'
                  : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
              title="Toggle Security & Usage Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#f8fafc] rounded-[4px] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Widget Title + Security Mode Switcher + Preset Quick Inject */}
        <div className="px-5 py-2.5 bg-[#141923] border-b border-[#1e293b] flex items-center justify-between flex-wrap gap-2.5 text-[11px]">
          {/* Left: Title & Security Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#8c909f]">Title:</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-7 px-2.5 bg-[#0b0f17] border border-[#334155] rounded text-[#f8fafc] text-[11px] outline-none w-52 focus:border-[#3b82f6]"
                placeholder="Widget Title"
              />
            </div>

            <div className="h-4 w-px bg-[#334155]" />

            {/* Security Mode Toggle */}
            <div className="flex items-center gap-2">
              <label
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                  !useSandbox
                    ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#4edea3]'
                    : 'bg-[#0b0f17] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                }`}
              >
                <input
                  type="radio"
                  name="securityMode"
                  checked={!useSandbox}
                  onChange={() => setUseSandbox(false)}
                  className="hidden"
                />
                <ShieldCheck className="w-3 h-3 text-[#34d399]" />
                <span className="font-medium">Sanitized DOM (Safe)</span>
              </label>

              <label
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                  useSandbox
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6]/50 text-[#93c5fd]'
                    : 'bg-[#0b0f17] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                }`}
              >
                <input
                  type="radio"
                  name="securityMode"
                  checked={useSandbox}
                  onChange={() => setUseSandbox(true)}
                  className="hidden"
                />
                <Shield className="w-3 h-3 text-[#38bdf8]" />
                <span className="font-medium">Sandboxed Iframe (Script Allowed)</span>
              </label>
            </div>
          </div>

          {/* Right: Presets Injector & Copy Button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#64748b] font-mono text-[10px]">Templates:</span>
            {HTML_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.code, p.name)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#93c5fd] rounded text-[10px] font-mono transition-colors flex items-center gap-1"
                title={p.description}
              >
                <span>{p.name.split(' ')[0]}</span>
                {p.badge && (
                  <span className="text-[8px] opacity-75 px-1 bg-[#0b0f17] rounded">
                    {p.badge}
                  </span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Optional Expandable Security & Usage Guide */}
        {showHelpGuide && (
          <div className="px-5 py-3 bg-[#111827] border-b border-[#1e293b] text-[11px] text-[#cbd5e1] animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="font-semibold text-[#60a5fa] flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Safe Sanitized DOM Mode</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed text-[10px]">
                    Uses DOMPurify to strip dangerous XSS attack vectors like <code>&lt;script&gt;</code>, <code>onerror=</code>, and arbitrary redirects while permitting rich HTML tags, CSS styling, flexbox/grid layout, and SVG graphics.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#38bdf8] flex items-center gap-1 mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Sandboxed Iframe Mode</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed text-[10px]">
                    Isolates code in a secure browser iframe with <code>sandbox="allow-scripts"</code>. Use this mode if your widget needs basic interactive JavaScript, click listeners, dynamic state counters, or external iframe embeds.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#4ade80] flex items-center gap-1 mb-1">
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>Styling & Persistence</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed text-[10px]">
                    Use inline styles (<code>style="..."</code>) or <code>&lt;style&gt;</code> blocks. Widgets are saved directly into the dashboard layout and persist in project state, undo history, and exported JSON.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpGuide(false)}
                className="text-[#64748b] hover:text-[#cbd5e1] p-1 ml-3"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Security Alert if code has scripts and sandbox is off */}
        {securityAudit.hasPotentialXss && !useSandbox && (
          <div className="px-5 py-2 bg-[#f59e0b]/15 border-b border-[#f59e0b]/30 flex items-center justify-between text-[11px] text-[#fbbf24]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#f59e0b]" />
              <span>
                JavaScript or event handlers detected in code! In <strong>Sanitized Mode</strong>, script tags will be neutralised for safety. To enable interactive JavaScript, switch to <strong>Sandboxed Iframe</strong> mode.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUseSandbox(true)}
              className="px-2.5 py-0.5 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold rounded text-[10px] transition-colors whitespace-nowrap"
            >
              Switch to Sandboxed Iframe
            </button>
          </div>
        )}

        {/* Main Workspace: Code Editor + Live Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Pane */}
          {(activeTab === 'editor' || activeTab === 'split') && (
            <div className={`flex flex-col border-r border-[#1e293b] bg-[#070a10] ${activeTab === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="px-3.5 py-1.5 bg-[#0b0f17] border-b border-[#1e293b] text-[10px] font-mono text-[#64748b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-[#38bdf8]" />
                  <span>HTML & CSS Source</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#94a3b8]">{code.split('\n').length} lines</span>
                  <span className="text-[#38bdf8]">{code.length} chars</span>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                }}
                placeholder="<div>Type or paste your raw HTML, CSS, or SVG code here...</div>"
                className="flex-1 w-full p-4 bg-[#070a10] text-[#93c5fd] font-mono text-[12px] leading-relaxed resize-none outline-none border-0 selection:bg-[#3b82f6]/30"
                spellCheck={false}
              />
            </div>
          )}

          {/* Live Preview Pane */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div className={`flex flex-col bg-[#0b0f17] ${activeTab === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="px-3.5 py-1.5 bg-[#0e1420] border-b border-[#1e293b] text-[10px] font-mono text-[#64748b] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-[#34d399]" />
                  <span className="text-[#f8fafc] font-semibold">Live Preview</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] ${
                      useSandbox ? 'bg-[#3b82f6]/20 text-[#93c5fd]' : 'bg-[#10b981]/20 text-[#34d399]'
                    }`}
                  >
                    {useSandbox ? 'Sandbox (JS Active)' : 'DOMPurify (Sanitized)'}
                  </span>
                </div>

                {/* Viewport Width Controls */}
                <div className="flex items-center gap-1 bg-[#0b0f17] px-1 py-0.5 rounded border border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded ${previewViewport === 'desktop' ? 'bg-[#3b82f6] text-white' : 'text-[#8c909f] hover:text-[#cbd5e1]'}`}
                    title="Desktop Viewport (100%)"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded ${previewViewport === 'tablet' ? 'bg-[#3b82f6] text-white' : 'text-[#8c909f] hover:text-[#cbd5e1]'}`}
                    title="Tablet Viewport (768px)"
                  >
                    <Tablet className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded ${previewViewport === 'mobile' ? 'bg-[#3b82f6] text-white' : 'text-[#8c909f] hover:text-[#cbd5e1]'}`}
                    title="Mobile Viewport (375px)"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1 rounded text-[#8c909f] hover:text-[#cbd5e1]"
                    title="Reload Preview"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Preview Rendering Stage */}
              <div className="flex-1 p-4 overflow-auto bg-[#070a10] flex items-center justify-center">
                <div
                  style={{
                    width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                    height: '100%',
                    maxWidth: '100%',
                    transition: 'width 0.2s ease-in-out'
                  }}
                  className="border border-[#1e293b] rounded-[6px] overflow-hidden bg-[#0b0f17] shadow-xl relative"
                >
                  {useSandbox ? (
                    <iframe
                      key={previewKey}
                      title="Preview Frame"
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
  ${code}
</body>
</html>`}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  ) : (
                    <div
                      className="w-full h-full overflow-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizedPreviewHtml }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#1e293b] bg-[#111827] flex items-center justify-between">
          <div className="text-[11px] text-[#8c909f] flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Changes persist immediately to your dashboard layout upon applying.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#dfe2ee] rounded-[4px] text-[12px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[4px] text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Dashboard Widget</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
