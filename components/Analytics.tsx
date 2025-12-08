
import React, { useMemo, useState } from 'react';
import { Transaction, CategoryData, MonthlyData, Currency } from '../types';
import { COLORS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar, Filter } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currency: Currency;
  t: any;
}

type DateRange = 'all' | 'thisMonth' | 'lastMonth' | 'yearToDate' | 'custom';

export const Analytics: React.FC<Props> = ({ transactions, currency, t }) => {
  const [range, setRange] = useState<DateRange>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start = new Date(0); // Epoch
    let end = new Date();

    switch (range) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'yearToDate':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        // If custom, respect manual inputs if they exist, otherwise default to all
        if (startDate) start = new Date(startDate);
        if (endDate) end = new Date(endDate);
        break;
      case 'all':
      default:
        return transactions;
    }

    // Set times to ensure full coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, range, startDate, endDate]);
  
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value: Number(value),
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const data: Record<string, MonthlyData> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // e.g. "10/2023"
      
      if (!data[key]) {
        data[key] = { name: key, income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        data[key].income += t.amount;
      } else {
        data[key].expense += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => {
      const [ma, ya] = a.name.split('/').map(Number);
      const [mb, yb] = b.name.split('/').map(Number);
      return (ya - yb) * 12 + (ma - mb);
    });
  }, [filteredTransactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-textMuted text-xs mb-1 uppercase tracking-wide">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-bold font-mono">
              {entry.name}: {currency}{entry.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ranges: { id: DateRange; label: string }[] = [
    { id: 'all', label: t.allTime },
    { id: 'thisMonth', label: t.thisMonth },
    { id: 'lastMonth', label: t.lastMonth },
    { id: 'yearToDate', label: t.yearToDate },
    { id: 'custom', label: t.custom },
  ];

  return (
    <div className="animate-fade-in-up space-y-6">
      
      {/* Filters Toolbar */}
      <div className="glass-card p-4 rounded-3xl overflow-x-auto no-scrollbar flex items-center gap-3 touch-pan-x">
        <div className="flex items-center gap-2 pr-4 border-r border-white/10 shrink-0">
          <Filter className="w-4 h-4 text-textMuted" />
          <span className="text-xs font-bold uppercase tracking-widest text-textMuted">{t.dateRange}</span>
        </div>
        
        {ranges.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
              range === r.id 
                ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105' 
                : 'bg-surfaceHighlight text-textMuted hover:bg-surfaceHighlight/80 hover:text-textMain'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-end gap-4 animate-scale-in">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1.5">{t.startDate}</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-textMain focus:outline-none focus:border-primary/50 transition-colors"
              />
              {!startDate && <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-textMuted pointer-events-none" />}
            </div>
          </div>
          
          <div className="flex-1 min-w-[120px]">
             <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1.5">{t.endDate}</label>
             <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-textMain focus:outline-none focus:border-primary/50 transition-colors"
              />
              {!endDate && <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-textMuted pointer-events-none" />}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Pie Chart */}
        <div className="glass-card p-6 rounded-3xl transition-all hover:border-white/20">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-6">{t.breakdown}</h3>
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-textMain text-xs ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-textMuted text-sm">{t.noData}</div>
            )}
          </div>
        </div>

        {/* Monthly Bar Chart */}
        <div className="glass-card p-6 rounded-3xl transition-all hover:border-white/20">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-6">{t.monthlyPerformance}</h3>
          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--text-muted)" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} tickFormatter={(val) => `${currency}${val.toLocaleString('de-DE')}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--surface-highlight)'}} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-textMain text-xs ml-2 uppercase tracking-wider">{value === 'income' ? t.income : t.expenses}</span>} />
                  <Bar dataKey="income" name="income" fill="#00E396" radius={[4, 4, 0, 0]} maxBarSize={40} style={{ filter: 'drop-shadow(0 0 4px rgba(0,227,150,0.3))' }} />
                  <Bar dataKey="expense" name="expense" fill="#FF4560" radius={[4, 4, 0, 0]} maxBarSize={40} style={{ filter: 'drop-shadow(0 0 4px rgba(255,69,96,0.3))' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-textMuted text-sm">{t.noData}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
