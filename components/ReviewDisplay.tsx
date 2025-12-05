import React, { useState } from 'react';
import { ReviewResponse } from '../types';
import { Button } from './Button';
import { Copy, CheckCheck, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReviewDisplayProps {
  data: ReviewResponse;
  onReset: () => void;
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({ data, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Meta */}
      <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-green-300">Fact Check Completed</h3>
          <p className="text-sm text-green-400/80 mt-1">
            The content has been analyzed against Google Search results. {data.sources.length > 0 ? `Found ${data.sources.length} relevant sources.` : 'No direct external sources cited in final output.'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#1c1c1c] rounded-xl shadow-lg border border-[#333] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#181818]">
          <h2 className="font-semibold text-gray-100 flex items-center">
            <span className="w-2 h-2 bg-[#ff5722] rounded-full mr-2"></span>
            Critical Review
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCopy} className="text-xs h-8">
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Text
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <article className="prose prose-invert max-w-none">
             <ReactMarkdown 
               components={{
                 h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-100 mt-8 mb-4 border-b border-[#333] pb-2" {...props} />,
                 p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
                 ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300" {...props} />,
                 li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                 strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                 blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#ff5722] pl-4 italic text-gray-400 my-4 bg-[#262626] py-2 pr-2 rounded-r" {...props} />
               }}
             >
               {data.markdown}
             </ReactMarkdown>
          </article>
        </div>

        {/* Sources Footer */}
        {data.sources.length > 0 && (
          <div className="bg-[#181818] border-t border-[#333] p-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sources & Evidence Found
            </h4>
            <ul className="space-y-2">
              {data.sources.map((source, idx) => (
                <li key={idx}>
                  <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-start text-sm text-gray-400 hover:text-[#ff5722] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                    <span className="truncate">{source.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Analyze Another Post
        </Button>
      </div>
    </div>
  );
};