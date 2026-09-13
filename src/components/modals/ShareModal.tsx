import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Lock, Code } from 'lucide-react';
import { DashboardProject } from '../../types/dashboard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DashboardProject;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [permission, setPermission] = useState('interactive');

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/dashboard/${project.id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="800" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-[#141822] border border-[#262a33] rounded-[8px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#111827]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-[14px] font-semibold text-[#f8fafc]">
              Share & Embed Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1e293b] text-[#8c909f] hover:text-[#dfe2ee] rounded-[4px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-[12px]">
          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1.5 uppercase">
              Access Permission
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'view', label: 'View Only' },
                { id: 'interactive', label: 'Interactive' },
                { id: 'edit', label: 'Full Editor' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPermission(p.id)}
                  className={`py-1.5 px-3 rounded-[4px] border text-center font-medium transition-colors ${
                    permission === p.id
                      ? 'bg-[#1e293b] border-[#3b82f6] text-[#f8fafc]'
                      : 'bg-[#0b0f17] border-[#1e293b] text-[#8c909f]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase">
              Direct Public Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[11px] font-mono text-[#dfe2ee] outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="h-8 px-3 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#dfe2ee] rounded-[4px] flex items-center gap-1.5 font-medium transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c909f] mb-1 uppercase">
              Embed IFrame Snippet
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedCode}
                className="flex-1 h-8 px-2.5 bg-[#0b0f17] border border-[#1e293b] rounded-[4px] text-[11px] font-mono text-[#8c909f] outline-none select-all"
              />
              <button
                onClick={handleCopyEmbed}
                className="h-8 px-3 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#dfe2ee] rounded-[4px] flex items-center gap-1.5 font-medium transition-colors"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Code className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-[#1e293b] bg-[#111827]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-[4px] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
