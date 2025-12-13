import React, { useState, useEffect } from 'react';
import { MarketItem, Category } from '../types';
import { queryMarketData, QueryParams } from '../services/db';
import { FileTextIcon, TargetIcon, TrendingUpIcon, BriefcaseIcon, RefreshIcon, DownloadIcon, ExternalLinkIcon } from './Icons';

const SearchPage: React.FC = () => {
  const [filters, setFilters] = useState<QueryParams>({
    startDate: '',
    endDate: '',
    region: '',
    entityKeyword: '',
    category: undefined,
  });

  const [results, setResults] = useState<MarketItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Auto search on mount or filter change (debounced in a real app, strict here)
  const handleSearch = async () => {
    setSearching(true);
    try {
      const data = await queryMarketData(filters);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  const handleExport = () => {
    if (results.length === 0) return;

    // CSV Header
    const headers = ['日期', '分类', '地区', '标题', '主体', '金额', '来源链接'];
    
    // CSV Rows
    const rows = results.map(item => {
        // Get the first source link if available
        const sourceLink = item.sources && item.sources.length > 0 ? item.sources[0].uri : '';
        
        return [
            item.date,
            item.category,
            `"${item.region.replace(/"/g, '""')}"`, // Escape quotes
            `"${item.title.replace(/"/g, '""')}"`,
            `"${item.entity.replace(/"/g, '""')}"`,
            `"${item.amount.replace(/"/g, '""')}"`,
            `"${sourceLink.replace(/"/g, '""')}"`
        ].join(',');
    });

    // BOM for Excel Chinese support + Content
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `market_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryColor = (cat: Category) => {
     switch(cat) {
        case Category.TRADING: return 'bg-blue-100 text-blue-700 border-blue-200';
        case Category.TENDER: return 'bg-purple-100 text-purple-700 border-purple-200';
        case Category.BID_WIN: return 'bg-green-100 text-green-700 border-green-200';
        case Category.DEMAND: return 'bg-orange-100 text-orange-700 border-orange-200';
        default: return 'bg-gray-100 text-gray-700';
     }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
           <TargetIcon className="w-5 h-5 text-primary-600" />
           历史数据查询
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500">起始日期</label>
             <input 
               type="date" 
               className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
               value={filters.startDate}
               onChange={(e) => setFilters({...filters, startDate: e.target.value})}
             />
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500">结束日期</label>
             <input 
               type="date" 
               className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
               value={filters.endDate}
               onChange={(e) => setFilters({...filters, endDate: e.target.value})}
             />
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500">地区</label>
             <input 
               type="text" 
               placeholder="如: 北京"
               className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
               value={filters.region}
               onChange={(e) => setFilters({...filters, region: e.target.value})}
             />
          </div>
           <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500">主体 (模糊匹配)</label>
             <input 
               type="text" 
               placeholder="公司名称/单位"
               className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
               value={filters.entityKeyword}
               onChange={(e) => setFilters({...filters, entityKeyword: e.target.value})}
             />
          </div>
           <div className="flex flex-col justify-end gap-2 flex-row md:col-span-2 lg:col-span-1">
             <button 
               onClick={handleSearch}
               className="flex-1 bg-primary-600 text-white rounded px-3 py-2 text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
             >
               {searching ? <RefreshIcon className="animate-spin w-4 h-4"/> : '查询'}
             </button>
             <button 
               onClick={handleExport}
               disabled={results.length === 0}
               className={`px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 border transition-colors
                 ${results.length === 0 
                    ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
               title="导出CSV"
             >
               <DownloadIcon className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-24">日期</th>
                <th className="px-6 py-3 w-24">分类</th>
                <th className="px-6 py-3 w-24">地区</th>
                <th className="px-6 py-3">标题/主体</th>
                <th className="px-6 py-3 w-28">金额</th>
                <th className="px-6 py-3 w-16 text-center">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     {searching ? '查询中...' : '未找到符合条件的记录'}
                   </td>
                </tr>
              ) : (
                results.map((item, idx) => (
                  <tr key={item.id || idx} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${categoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.region}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 mb-1">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.entity}</div>
                    </td>
                     <td className="px-6 py-4 font-mono font-medium text-slate-700">{item.amount}</td>
                     <td className="px-6 py-4 text-center">
                        {item.sources && item.sources.length > 0 ? (
                           <a 
                             href={item.sources[0].uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                             title={item.sources[0].title}
                           >
                              <ExternalLinkIcon className="w-4 h-4" />
                           </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;