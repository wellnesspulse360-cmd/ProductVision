import React, { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Globe, User, Lock } from 'lucide-react';
import { saveToWordPress } from '../services/wordpressService';

interface WordPressModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogTitle: string;
  blogContent: string;
}

export const WordPressModal: React.FC<WordPressModalProps> = ({ 
  isOpen, 
  onClose, 
  blogTitle, 
  blogContent 
}) => {
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage('');

    try {
      await saveToWordPress(siteUrl, username, appPassword, blogTitle, blogContent);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle'); // Reset for next time
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      // Friendly error for common CORS issue
      if (err.message === 'Failed to fetch') {
        setErrorMessage("Network Error (CORS). Your WordPress site might be blocking external connections. You may need a CORS plugin on your site.");
      } else {
        setErrorMessage(err.message || "Failed to save to WordPress.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            Save to WordPress
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
              <h4 className="text-xl font-bold text-gray-800">Draft Saved!</h4>
              <p className="text-gray-500">Your article has been saved to your WordPress drafts.</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4">
                <strong>Tip:</strong> Use an <em>Application Password</em>, not your login password. Go to Users → Profile → Application Passwords in your WP Admin.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WordPress Site URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://mysite.com"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'saving' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Draft</>
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