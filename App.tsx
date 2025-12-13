import React, { useState, useEffect } from 'react';
import { Category, IntelligenceState, FetchStatus, ViewMode } from './types';
import { fetchMarketIntelligence } from './services/gemini';
import { saveDailyData } from './services/db'; // Import DB Saver
import IntelligenceCard from './components/IntelligenceCard';
import DashboardStats from './components/DashboardStats';
import SearchPage from './components/SearchPage';
import { BriefcaseIcon, ChartIcon, FileTextIcon, TargetIcon, TrendingUpIcon } from './components/Icons';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [activeCategory, setActiveCategory] = useState<Category>(Category.TENDER);
  
  // Date state: Default to today
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [data, setData] = useState<IntelligenceState>({
    [Category.TRADING]: null,
    [Category.TENDER]: null,
    [Category.BID_WIN]: null,
    [Category.DEMAND]: null,
  });

  const [status, setStatus] = useState<Record<Category, FetchStatus>>({
    [Category.TRADING]: { loading: false, error: null },
    [Category.TENDER]: { loading: false, error: null },
    [Category.BID_WIN]: { loading: false, error: null },
    [Category.DEMAND]: { loading: false, error: null },
  });

  const loadCategoryData = async (category: Category, date: string) => {
    if (status[category].loading) return;

    setStatus(prev => ({ ...prev, [category]: { loading: true, error: null } }));

    try {
      const result = await fetchMarketIntelligence(category, date);
      
      // Save to Local DB (Simulating Backend)
      if (result.items && result.items.length > 0) {
          await saveDailyData(result.items);
      }

      setData(prev => ({ ...prev, [category]: result }));
      setStatus(prev => ({ ...prev, [category]: { loading: false, error: null } }));
    } catch (error: any) {
      setStatus(prev => ({ 
        ...prev, 
        [category]: { loading: false, error: error.message } 
      }));
    }
  };

  useEffect(() => {
    if (view === 'dashboard') {
        loadCategoryData(activeCategory, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, selectedDate, view]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setData({
      [Category.TRADING]: null,
      [Category.TENDER]: null,
      [Category.BID_WIN]: null,
      [Category.DEMAND]: null,
    });
  };

  const renderIcon = (cat: Category) => {
    switch(cat) {
      case Category.TRADING: return <TrendingUpIcon className="w-5 h-5" />;
      case Category.TENDER: return <FileTextIcon className="w-5 h-5" />;
      case Category.BID_WIN: return <TargetIcon className="w-5 h-5" />;
      case Category.DEMAND: return <BriefcaseIcon className="w-5 h-5" />;
      default: return <ChartIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <ChartIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                DataNexus <span className="text-primary-600">China</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">数据要素市场情报中心</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Navigation Switches */}
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                    onClick={() => setView('dashboard')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    每日日报
                </button>
                <button 
                    onClick={() => setView('search')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${view === 'search' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    数据库查询
                </button>
             </div>

             {/* Date Picker (Only visible on Dashboard) */}
             {view === 'dashboard' && (
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">日期选择</span>
                <input 
                    type="date" 
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    className="bg-white border-0 rounded-md text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 py-1.5 px-3 shadow-sm"
                />
                </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'search' ? (
            <SearchPage />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Sidebar / Tabs */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                
                <nav className="space-y-1">
                {Object.values(Category).map((cat) => (
                    <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeCategory === cat
                        ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                    >
                    <span className={`${activeCategory === cat ? 'text-primary-600' : 'text-slate-400'}`}>
                        {renderIcon(cat)}
                    </span>
                    {cat}
                    </button>
                ))}
                </nav>

                <div className="hidden lg:block flex-1">
                    <DashboardStats />
                </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 h-full">
                {status[activeCategory].error ? (
                <div className="h-full flex items-center justify-center bg-white rounded-xl border border-red-100 p-8 text-center">
                    <div className="max-w-md">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">获取数据失败</h3>
                    <p className="text-red-600 mb-6 text-sm">{status[activeCategory].error}</p>
                    <button 
                        onClick={() => loadCategoryData(activeCategory, selectedDate)}
                        className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        重试
                    </button>
                    </div>
                </div>
                ) : (
                <IntelligenceCard 
                    title={`${selectedDate} · ${activeCategory}日报`}
                    data={data[activeCategory]}
                    loading={status[activeCategory].loading}
                    onRefresh={() => loadCategoryData(activeCategory, selectedDate)}
                />
                )}
            </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;