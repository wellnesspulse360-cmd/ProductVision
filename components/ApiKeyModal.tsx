
import React, { useState, useEffect } from 'react';
import { ensureApiKey, selectApiKey } from '../services/geminiService';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onReady: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = async () => {
    setChecking(true);
    try {
      const valid = await ensureApiKey();
      setHasKey(valid);
      if (valid) onReady();
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const handleSelectKey = async () => {
    try {
      await selectApiKey();
      // Guideline: Assume the key selection was successful after triggering openSelectKey() 
      // and proceed to the app to mitigate the race condition.
      setHasKey(true);
      onReady();
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  if (checking) return null; // Or a spinner
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="bg-yellow-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">API Key Required</h2>
        <p className="text-gray-300 mb-6">
          To use the high-quality <strong>Nano Banana Pro</strong> (Gemini 3 Pro Image) model for generating marketing assets, you need to select a paid API key.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleSelectKey}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Select API Key
          </button>
          
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-sm text-gray-500 hover:text-gray-400 underline"
          >
            Learn about Gemini API Billing
          </a>
        </div>
      </div>
    </div>
  );
};
