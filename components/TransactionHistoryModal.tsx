
import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '../types';
import { ArrowLeft, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: Currency;
}

export const TransactionHistoryModal: React.FC<Props> = ({ isOpen, onClose, transactions, currency }) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0); // 0 = Current month relative to data

  // 1. Get unique months from data for the Tabs
  const monthsData = useMemo(() => {
    const monthsMap = new Map<string, Date>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      // Key format: "YYYY-MM" to sort correctly
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, date);
    });

    // Sort descending (newest months first)
    const sortedKeys = Array.from(monthsMap.keys()).sort().reverse();
    
    return sortedKeys.map(key => {
      const date = monthsMap.get(key)!;
      return {
        key,
        label: date.toLocaleString('es-ES', { month: 'long' }), // e.g., "noviembre"
        year: date.getFullYear(),
        dateObj: date
      };
    });
  }, [transactions]);

  // 2. Filter transactions by the selected month
  const activeMonthKey = monthsData[selectedMonthIndex]?.key;
  
  const filteredTransactions = useMemo(() => {
    if (!activeMonthKey) return [];
    return transactions.filter(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === activeMonthKey;
    });
  }, [transactions, activeMonthKey]);

  // 3. Group filtered transactions by Day (e.g., "22 de noviembre")
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      // Format: "22 de noviembre"
      const dayLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(t);
    });

    return groups;
  }, [filteredTransactions]);

  // Hook rules satisfied: Conditional return is now AFTER all hooks
  if (!isOpen) return null;

  // Capitalize first letter of month label
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in">
      
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-textMain hover:bg-surfaceHighlight/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-textMain tracking-wide">Transacciones</h2>
        <div className="w-10 h-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Month Tabs */}
      <div className="px-4 py-2 bg-background border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2">
          {monthsData.map((m, index) => (
            <button
              key={m.key}
              onClick={() => setSelectedMonthIndex(index)}
              className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${
                index === selectedMonthIndex 
                  ? 'bg-textMain text-background border border-transparent shadow-lg' 
                  : 'text-textMuted bg-surfaceHighlight hover:text-textMain'
              }`}
            >
              {m.label}
            </button>
          ))}
          {monthsData.length === 0 && (
             <span className="text-textMuted text-sm px-2">Sin historial</span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-20 space-y-8 bg-background">
        {(Object.entries(groupedByDay) as [string, Transaction[]][]).map(([dayLabel, txs]) => (
          <div key={dayLabel} className="animate-fade-in-up">
            <h3 className="text-textMuted font-bold text-sm mb-3 ml-2 capitalize tracking-wide">
              {dayLabel}
            </h3>
            
            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
              {txs.map((t, idx) => (
                <div 
                  key={t.id} 
                  className={`flex items-center justify-between p-4 hover:bg-surfaceHighlight transition-colors ${
                    idx !== txs.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                       t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-surfaceHighlight text-textMain'
                    }`}>
                      {t.type === 'income' ? <ArrowUp className="w-5 h-5" /> : 
                       t.category === 'Apple' ? <span className="font-bold text-lg"></span> : // Easter egg for screenshot match
                       <ArrowDown className="w-5 h-5" />
                      }
                    </div>

                    {/* Text */}
                    <div className="flex flex-col">
                      <span className="text-textMain font-medium text-sm leading-tight">{t.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-textMuted">{t.date.split('T')[0].split('-')[2]}:{new Date(t.date).getMinutes().toString().padStart(2, '0')}</span> {/* Mock time */}
                        {t.category === 'Apple' && <span className="text-[10px] bg-surfaceHighlight px-1.5 rounded text-textMuted">Pay</span>}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <span className={`font-mono font-bold text-sm ${t.type === 'income' ? 'text-primary' : 'text-textMain'}`}>
                    {t.type === 'income' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Daily Total (Optional, nice touch) */}
            <div className="flex justify-end mt-2 mr-2">
              <span className="text-[10px] text-textMuted uppercase tracking-widest">
                Total día: 
                {txs.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)
                   .toLocaleString('de-DE', { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 text-textMuted">
             <Search className="w-12 h-12 mb-4" />
             <p className="text-sm">No hay transacciones en este mes</p>
          </div>
        )}
      </div>
    </div>
  );
};
