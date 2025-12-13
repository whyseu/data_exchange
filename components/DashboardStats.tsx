import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock data to simulate market activity volume relative to keywords
// Since we don't have a real DB, we visualize "Trend Intensity" conceptually
const data = [
  { name: '交易', value: 65, color: '#0ea5e9' },
  { name: '招标', value: 85, color: '#6366f1' },
  { name: '中标', value: 45, color: '#10b981' },
  { name: '需求', value: 55, color: '#f59e0b' },
];

const DashboardStats: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">市场活跃度指数 (模拟)</h3>
      <div className="flex-1 w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
               {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-slate-400 text-center">
        基于AI语义分析的近期热度估算
      </div>
    </div>
  );
};

export default DashboardStats;