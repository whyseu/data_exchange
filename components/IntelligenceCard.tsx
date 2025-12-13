import React from 'react';
import { SearchResult, MarketItem } from '../types';
import { ExternalLinkIcon, RefreshIcon, TargetIcon, BriefcaseIcon } from './Icons';

interface IntelligenceCardProps {
  data: SearchResult | null;
  loading: boolean;
  onRefresh: () => void;
  title: string;
}

// Helper to render text with citation links like [1]
const TextWithCitations = ({ text, sources }: { text: string, sources: any[] }) => {
  if (!text) return null;
  
  // Regex to find [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]) - 1; // 1-based to 0-based
          const source = sources[index];
          if (source) {
            return (
              <a 
                key={i} 
                href={`#source-${index}`} 
                className="text-primary-600 font-bold text-xs align-super hover:underline mx-0.5"
                title={source.title}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`source-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {part}
              </a>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ data, loading, onRefresh, title }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          {title}
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-primary-600 ${loading ? 'animate-spin' : ''}`}
          title="刷新数据"
        >
          <RefreshIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white scroll-smooth relative">
        {loading && !data ? (
          <div className="p-6 space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 pb-6 border-b border-slate-100">
                <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-slate-50 rounded w-20"></div>
                  <div className="h-4 bg-slate-50 rounded w-20"></div>
                </div>
                <div className="h-16 bg-slate-50 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
            <div className="mb-4 bg-slate-50 p-4 rounded-full">
              <BriefcaseIcon className="w-8 h-8 opacity-20" />
            </div>
            <p>暂无今日相关数据</p>
            <p className="text-xs mt-2">点击刷新按钮让 AI 进行检索</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.items.map((item: MarketItem, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-800 leading-tight group-hover:text-primary-700 transition-colors">
                    {idx + 1}. {item.title}
                  </h3>
                  <span className="flex-shrink-0 ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-100 whitespace-nowrap">
                    {item.amount}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                    <span className="text-slate-400">地区:</span> {item.region}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                    <span className="text-slate-400">主体:</span> {item.entity}
                  </span>
                </div>

                <div className="text-sm text-slate-600 leading-relaxed">
                  <TextWithCitations text={item.summary} sources={data.sources} />
                </div>
              </div>
            ))}
             <div className="p-6 text-center">
              <span className="text-xs font-mono text-slate-300">数据生成时间: {data.timestamp}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sources Section */}
      {data && data.sources.length > 0 && (
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 mb-3">
             <div className="bg-green-100 text-green-700 p-1 rounded-full">
               <ExternalLinkIcon className="w-3 h-3" />
             </div>
             <h4 className="font-bold text-slate-700 uppercase tracking-wider">
               信息来源参考 ({data.sources.length})
             </h4>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {data.sources.map((source, index) => (
              <div key={index} id={`source-${index}`} className="flex gap-2 items-start p-1 hover:bg-white rounded transition-colors">
                <span className="text-slate-400 font-mono font-bold w-5 text-right flex-shrink-0">
                  [{index + 1}]
                </span>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline truncate flex-1"
                  title={source.title}
                >
                  {source.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceCard;