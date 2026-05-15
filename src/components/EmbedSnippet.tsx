'use client';

import { useState } from 'react';

interface EmbedSnippetProps {
  scorecardId: string;
  appUrl: string;
}

export default function EmbedSnippet({ scorecardId, appUrl }: EmbedSnippetProps) {
  const [copied, setCopied] = useState(false);

  const embedUrl = `${appUrl}/scorecard/${scorecardId}/embed`;
  const snippet = `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border-radius: 12px;"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <span className="text-sm font-medium text-gray-300">Embed Code</span>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-medium rounded-md transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="px-5 py-3 bg-gray-950">
        <code className="text-xs text-gray-400 font-mono break-all block">{snippet}</code>
      </div>

      {/* Preview */}
      <div className="px-5 py-3 border-t border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Preview</span>
        <div className="border border-gray-800 rounded-lg overflow-hidden" style={{ height: 300 }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ borderRadius: 0 }}
            title="Embed preview"
          />
        </div>
      </div>
    </div>
  );
}
