import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Facebook, Key, Hash } from 'lucide-react';
import { postToFacebook } from '../services/facebookService';

interface FacebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  imageBase64: string;
}

export const FacebookModal: React.FC<FacebookModalProps> = ({ 
  isOpen, 
  onClose, 
  message, 
  imageBase64 
}) => {
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('posting');
    setErrorMessage('');

    try {
      await postToFacebook(pageId, accessToken, message, imageBase64);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || "Failed to post to Facebook.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1877F2] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Facebook className="w-5 h-5 fill-white" />
            Post to Facebook Page
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-800">Published Successfully!</h4>
              <p className="text-gray-500">Your post is now live on your Facebook Page.</p>
            </div>
          ) : (
            <form onSubmit={handlePost} className="space-y-4">
              
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4 border border-blue-100">
                <strong>Requirement:</strong> You need a <em>Page Access Token</em>. Get it from the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Graph API Explorer</a> (Permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>).
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1000555222333"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Access Token</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="EAA..."
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview Mini */}
              <div className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden">
                    {imageBase64 ? <img src={imageBase64} className="w-full h-full object-cover"/> : null}
                </div>
                <div className="text-xs text-gray-500 line-clamp-6 whitespace-pre-wrap">
                    {message}
                </div>
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="break-words">{errorMessage}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'posting'}
                  className="w-full bg-[#1877F2] hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'posting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Publish Now
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
