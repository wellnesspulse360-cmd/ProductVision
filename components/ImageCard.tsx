import React, { useState } from 'react';
import { Download, Loader2, Copy, Check } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  title: string;
  description: string;
  hookText?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, title, description, hookText }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!image.url) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `product-vision-${image.type}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHook = () => {
    if (hookText) {
      navigator.clipboard.writeText(hookText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const aspectRatioClass = {
    "16:9": "aspect-video",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]"
  }[image.ratio];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      
      <div className={`relative bg-gray-100 w-full ${aspectRatioClass} flex items-center justify-center group overflow-hidden`}>
        {image.loading ? (
          <div className="flex flex-col items-center gap-2 text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Generating...</span>
          </div>
        ) : image.url ? (
          <>
            <img 
              src={image.url} 
              alt={title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={handleDownload}
                className="bg-white text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-xl"
              >
                <Download className="w-4 h-4" />
                Save Image
              </button>
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-sm">Waiting for analysis...</span>
        )}
      </div>

      {hookText && !image.loading && image.url && (
        <div className="p-3 bg-purple-50 border-t border-purple-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-purple-600 mb-1">Generated Hook</p>
              <p className="text-sm font-medium text-purple-900 italic">"{hookText}"</p>
            </div>
            <button 
              onClick={handleCopyHook}
              className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-100 rounded transition-colors"
              title="Copy Hook"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};