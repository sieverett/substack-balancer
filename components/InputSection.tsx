import React, { useState } from 'react';
import { Button } from './Button';
import { Link, Sparkles, Clipboard, FileText } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (input: string, mode: 'url' | 'text') => void;
  isAnalyzing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url.trim()) {
      onAnalyze(url.trim(), 'url');
    } else if (mode === 'text' && text.trim()) {
      onAnalyze(text.trim(), 'text');
    }
  };

  const handlePasteUrl = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const cleanedText = clipboardText.trim();
      const finalUrl = cleanedText.startsWith('http') ? cleanedText : `https://${cleanedText}`;
      setUrl(finalUrl);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handlePasteText = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="bg-[#1c1c1c] rounded-xl shadow-lg border border-[#333] overflow-hidden transition-all duration-300">
      <div className="flex border-b border-[#333]">
        <button
          onClick={() => setMode('url')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center transition-colors ${
            mode === 'url' ? 'bg-[#262626] text-white border-b-2 border-[#ff5722]' : 'bg-[#1c1c1c] text-gray-500 hover:text-gray-300'
          }`}
        >
          <Link className="w-4 h-4 mr-2" />
          Post URL
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center transition-colors ${
            mode === 'text' ? 'bg-[#262626] text-white border-b-2 border-[#ff5722]' : 'bg-[#1c1c1c] text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Paste Text
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'url' ? (
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
                    if (val === '') {
                      setUrl('');
                      return;
                    }
                    setUrl(val.startsWith('http') ? val : `https://${val}`);
                  }}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                   <button
                    type="button"
                    onClick={handlePasteUrl}
                    className="p-2 text-gray-500 hover:text-[#ff5722] transition-colors"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <label htmlFor="text-input" className="sr-only">Article Content</label>
              <textarea
                id="text-input"
                name="text"
                rows={8}
                className="block w-full rounded-lg border-[#333] bg-[#262626] p-3 text-white placeholder-gray-500 focus:border-[#ff5722] focus:ring-[#ff5722] text-sm transition-colors scrollbar-thin scrollbar-thumb-gray-600"
                placeholder="Paste the full article content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute top-2 right-2">
                 <button
                    type="button"
                    onClick={handlePasteText}
                    className="p-1.5 bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
             <Button 
               type="submit" 
               disabled={isAnalyzing || (mode === 'url' ? !url.trim() : !text.trim())} 
               isLoading={isAnalyzing}
               className="w-full sm:w-auto min-w-[200px]"
             >
               <Sparkles className="w-4 h-4 mr-2" />
               {mode === 'url' ? 'Fetch & Analyze' : 'Analyze Text'}
             </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-[#181818] px-6 py-3 border-t border-[#333]">
        <p className="text-xs text-gray-500 text-center">
          {mode === 'url' 
            ? "We'll attempt to extract content from the URL. If it fails, try the Paste Text tab." 
            : "Directly paste the article text for analysis. Best for paid or gated content."}
        </p>
      </div>
    </div>
  );
};
