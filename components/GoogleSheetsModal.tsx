import React, { useState } from 'react';
import { X, FileSpreadsheet, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { saveToGoogleSheets, generateGoogleAppsScriptCode } from '../services/googleSheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productUrl: string;
  affiliateLink: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ 
  isOpen, 
  onClose, 
  productName,
  productUrl,
  affiliateLink
}) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateGoogleAppsScriptCode());
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage('');

    try {
      await saveToGoogleSheets(scriptUrl, {
        name: productName,
        url: productUrl,
        affiliateLink: affiliateLink || 'N/A'
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage("Failed to connect. Ensure your Script URL is correct and deployed as 'Anyone'.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Save to Google Sheet
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
              <h4 className="text-xl font-bold text-gray-800">Saved Successfully!</h4>
              <p className="text-gray-500">The product has been added to your Google Sheet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Instructions Toggle */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <button 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-sm font-semibold text-green-800 hover:underline flex items-center justify-between w-full"
                >
                  <span>{showInstructions ? 'Hide Setup Instructions' : 'First time? Show Setup Instructions'}</span>
                </button>
                
                {showInstructions && (
                  <div className="mt-3 space-y-3 text-xs text-green-900">
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Create a new Google Sheet (or open existing).</li>
                      <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>Paste the code below into the editor (replace existing code).</li>
                      <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                      <li>Select type: <strong>Web App</strong>.</li>
                      <li>Description: "Product Saver". Execute as: <strong>Me</strong>.</li>
                      <li><strong>Who has access: Anyone</strong> (Important!).</li>
                      <li>Click Deploy, then <strong>Copy the Web App URL</strong>.</li>
                    </ol>
                    
                    <div className="relative mt-2">
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={handleCopyCode}
                          className="bg-white/80 hover:bg-white p-1 rounded shadow-sm text-green-700 transition-colors"
                          title="Copy Code"
                        >
                          {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto font-mono text-[10px] leading-relaxed">
                        {generateGoogleAppsScriptCode()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Web App URL</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                     </div>
                    <input
                      type="url"
                      required
                      placeholder="https://script.google.com/macros/s/..."
                      className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Paste the URL from the Apps Script deployment here.</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-200">
                  <p className="font-semibold mb-1">Data to save:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs">
                    <li><span className="font-medium">Name:</span> {productName.substring(0, 40)}...</li>
                    <li><span className="font-medium">URL:</span> {productUrl.substring(0, 30)}...</li>
                    <li><span className="font-medium">Affiliate:</span> {affiliateLink || 'None'}</li>
                  </ul>
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'saving' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving to Sheet...
                    </>
                  ) : (
                    <>Save Product Row</>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};