import React, { useState } from 'react';
import { Button } from './Button';
import { Link, Sparkles, Clipboard } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanedText = text.trim();
      // Ensure state always has the full URL including protocol
      const finalUrl = cleanedText.startsWith('http') ? cleanedText : `https://${cleanedText}`;
      setUrl(finalUrl);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="bg-[#1c1c1c] rounded-xl shadow-lg border border-[#333] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Link className="w-5 h-5 text-[#ff5722]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-100">Post URL</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="sr-only">Substack URL</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">https://</span>
              </div>
              <input
                type="text"
                name="url"
                id="url-input"
                className="block w-full rounded-lg border-[#333] bg-[#262626] pl-16 pt-3 pb-3 pr-12 text-white placeholder-gray-500 focus:border-[#ff5722] focus:ring-[#ff5722] text-base transition-colors"
                placeholder="substack.com/p/your-post-link"
                value={url.replace(/^https?:\/\//, '')} 
                onChange={(e) => {
                  const val = e.target.value;
                  // If cleared completely, reset
                  if (val === '') {
                    setUrl('');
                    return;
                  }
                  // Otherwise maintain protocol in state
                  setUrl(val.startsWith('http') ? val : `https://${val}`);
                }}
                autoComplete="off"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                 <button
                  type="button"
                  onClick={handlePaste}
                  className="p-2 text-gray-500 hover:text-[#ff5722] transition-colors"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
             <Button 
               type="submit" 
               disabled={!url.trim() || isAnalyzing} 
               isLoading={isAnalyzing}
               className="w-full sm:w-auto min-w-[200px]"
             >
               <Sparkles className="w-4 h-4 mr-2" />
               Fetch & Analyze
             </Button>
          </div>
        </form>
      </div>
      <div className="bg-[#181818] px-6 py-3 border-t border-[#333]">
        <p className="text-xs text-gray-500 text-center">
          Paste a Substack URL. We'll attempt to read the content and fact-check it against major news sources.
        </p>
      </div>
    </div>
  );
};