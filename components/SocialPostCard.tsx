import React, { useState } from 'react';
import { Copy, Check, Youtube, Facebook, Instagram, Music, Pin, Download, AtSign, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../types';

type SocialPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'pinterest' | 'threads';

interface SocialPostCardProps {
  platform: SocialPlatform;
  content: string | { title: string; description: string };
  image?: GeneratedImage; // The generated image for this platform
  onAutomate?: () => void;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = ({ platform, content, image, onAutomate }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getPlatformConfig = (p: SocialPlatform) => {
    switch (p) {
      case 'youtube': return { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50', name: 'YouTube' };
      case 'facebook': return { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', name: 'Facebook' };
      case 'instagram': return { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', name: 'Instagram' };
      case 'tiktok': return { icon: Music, color: 'text-gray-900', bg: 'bg-gray-100', name: 'TikTok' };
      case 'pinterest': return { icon: Pin, color: 'text-red-700', bg: 'bg-red-50', name: 'Pinterest' };
      case 'threads': return { icon: AtSign, color: 'text-black', bg: 'bg-gray-100', name: 'Threads' };
    }
  };

  const config = getPlatformConfig(platform);
  const Icon = config.icon;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // "Smart Post" helper: Downloads image, copies text, and opens the platform
  const handleSmartPost = (url: string, filename: string) => {
    // 1. Copy text
    const textToCopy = typeof content === 'string' ? content : content.description;
    handleCopy(textToCopy, 'main');
    
    // 2. Download Image (if available)
    if (image?.url) {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 3. Open Platform
    window.open(url, '_blank');
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div className="relative group">
          <textarea
            readOnly
            value={content}
            className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleCopy(content, 'main')}
            className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            title="Copy"
          >
            {copiedField === 'main' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          {/* Title Field */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
            <input
              readOnly
              value={content.title}
              className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10"
            />
            <button
              onClick={() => handleCopy(content.title, 'title')}
              className="absolute bottom-1.5 right-1.5 p-1.5 hover:bg-gray-50 rounded-md transition-colors"
            >
              {copiedField === 'title' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          {/* Description Field */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
            <textarea
              readOnly
              value={content.description}
              className="w-full h-24 p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleCopy(content.description, 'desc')}
              className="absolute top-8 right-2 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              {copiedField === 'desc' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${config.bg}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <h3 className="font-semibold text-gray-800">{config.name}</h3>
        </div>
        
        <div className="flex gap-1">
          {onAutomate && (
            <button
              onClick={onAutomate}
              className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors shadow-sm"
              title="Direct Automation"
            >
              <Sparkles className="w-3 h-3" />
              Auto
            </button>
          )}
          {platform === 'facebook' && image?.url && (
            <button
              onClick={() => handleSmartPost('https://www.facebook.com', 'facebook-post.png')}
              className="flex items-center gap-1 text-xs font-medium bg-[#1877F2] text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors shadow-sm"
              title="Prep Facebook Post"
            >
              <Download className="w-3 h-3" />
              Prep
            </button>
          )}
          {platform === 'instagram' && image?.url && (
            <button
              onClick={() => handleSmartPost('https://www.instagram.com', 'instagram-post.png')}
              className="flex items-center gap-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded hover:opacity-90 transition-opacity shadow-sm"
              title="Prep Instagram Post"
            >
              <Download className="w-3 h-3" />
              Prep
            </button>
          )}
          {platform === 'threads' && image?.url && (
            <button
              onClick={() => handleSmartPost('https://www.threads.net', 'threads-post.png')}
              className="flex items-center gap-1 text-xs font-medium bg-black text-white px-2 py-1 rounded hover:opacity-90 transition-opacity shadow-sm"
              title="Prep Threads Post"
            >
              <Download className="w-3 h-3" />
              Prep
            </button>
          )}
          {platform === 'pinterest' && image?.url && (
            <button
              onClick={() => handleSmartPost('https://www.pinterest.com/pin-builder/', 'pinterest-pin.png')}
              className="flex items-center gap-1 text-xs font-medium bg-[#E60023] text-white px-2 py-1 rounded hover:bg-red-800 transition-colors shadow-sm"
              title="Create Pin"
            >
              <Download className="w-3 h-3" />
              Pin It
            </button>
          )}
        </div>
      </div>
      <div className="p-4 bg-gray-50/50 flex-grow">
        {renderContent()}
      </div>
    </div>
  );
};