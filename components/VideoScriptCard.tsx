
import React, { useState } from 'react';
import { Copy, Check, Clapperboard, Video, Sparkles } from 'lucide-react';

interface VideoScriptCardProps {
  script: string;
  title?: string;
  type?: 'sora' | 'veo';
}

export const VideoScriptCard: React.FC<VideoScriptCardProps> = ({ script, title, type = 'sora' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVeo = type === 'veo';
  const displayTitle = title || (isVeo ? "Veo 3 Cinematic Prompt" : "Sora Video Prompt");
  const HeaderIcon = isVeo ? Sparkles : Clapperboard;
  const headerBg = isVeo ? "bg-purple-50" : "bg-indigo-50";
  const iconColor = isVeo ? "text-purple-700" : "text-indigo-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
      <div className={`px-4 py-3 border-b border-gray-100 flex items-center gap-2 ${headerBg}`}>
        <HeaderIcon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="font-semibold text-gray-800">{displayTitle}</h3>
      </div>
      <div className="p-4 bg-gray-50/50">
        <div className="relative group">
          <textarea
            readOnly
            value={script}
            className="w-full h-40 p-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
          />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-medium text-gray-600"
            title="Copy Prompt"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
           <Video className="w-3 h-3" />
           <span>Optimized for {isVeo ? "Google Veo 3 high-quality generation." : "AI video generation models like Sora or Runway."}</span>
        </div>
      </div>
    </div>
  );
};
