
import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '../types';
import { ArrowUp, ArrowDown, Trash2, Activity, Filter, Calendar, X, ChevronRight, Maximize2, Pencil, AlertTriangle } from 'lucide-react';
import { TransactionHistoryModal } from './TransactionHistoryModal';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  currency: Currency;
  t: any;
}

export const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, currency, t }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      // Reset hours to ensure strictly date based comparison
      tDate.setHours(0, 0, 0, 0);

      let isValid = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (tDate < start) isValid = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (tDate > end) isValid = false;
      }
      return isValid;
    });
  }, [transactions, startDate, endDate]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setIsFilterOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const hasActiveFilters = startDate || endDate;

  // We only show the top 5 in the dashboard widget, but pass all to the modal
  const displayTransactions = filteredTransactions.slice(0, 5);

  return (
    <>
      <div className="glass-card rounded-3xl p-4 md:p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          
          {/* Interactive Header */}
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="p-2 rounded-xl bg-surfaceHighlight group-hover:bg-primary/20 group-hover:text-primary text-textMuted transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start">
               <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest group-hover:text-textMain transition-colors">{t.recentActivity}</h3>
            </div>
            <ChevronRight className="w-3 h-3 text-textMuted group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 rounded-full transition-all ${isFilterOpen || hasActiveFilters ? 'bg-primary/20 text-primary' : 'hover:bg-surfaceHighlight text-textMuted hover:text-textMain'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mb-6 p-4 rounded-2xl bg-surfaceHighlight/50 border border-white/5 animate-fade-in flex flex-wrap gap-4 items-end">
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

            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="px-3 py-2 bg-surface hover:bg-danger/10 hover:text-danger text-textMuted rounded-xl transition-colors flex items-center justify-center border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="space-y-2">
          {displayTransactions.map((t, index) => (
            <div 
              key={t.id} 
              className="group flex items-center justify-between p-3 rounded-2xl hover:bg-surfaceHighlight border border-transparent hover:border-white/5 transition-all cursor-default animate-slide-in-right opacity-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              
              {/* Left Side: Icon + Text (Description & Date) */}
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-2">
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                  {t.type === 'income' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                </div>
                
                <div className="flex flex-col min-w-0">
                  <p className="font-medium text-textMain text-sm truncate group-hover:text-primary transition-colors">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-textMuted truncate">{t.date}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Amount + Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-bold font-mono whitespace-nowrap drop-shadow-md ${t.type === 'income' ? 'text-primary' : 'text-textMain'}`}>
                  {t.type === 'income' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
                
                <div className="flex items-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(t)}
                      className="p-2 text-textMuted hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(t.id)}
                      className="p-2 text-textMuted hover:text-danger hover:bg-danger/10 rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </div>
          ))}
          
          {displayTransactions.length === 0 && (
            <div className="text-center py-12 text-textMuted text-sm font-light">
              {transactions.length === 0 ? t.noActivity : t.noData}
            </div>
          )}

          {/* View All Button if more than 5 */}
          {filteredTransactions.length > 5 && (
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="w-full py-3 mt-2 text-xs font-bold uppercase tracking-widest text-textMuted hover:text-textMain hover:bg-surfaceHighlight rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Ver Todo ({filteredTransactions.length}) <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Popup Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 rounded-[2rem] shadow-2xl animate-scale-in border border-white/10">
             <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(255,69,96,0.3)]">
                   <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-textMain">¿Estás seguro?</h3>
                  <p className="text-sm text-textMuted mt-2 leading-relaxed">¿Quieres eliminar este dato permanentemente? Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-3 w-full mt-4">
                   <button
                     onClick={() => setDeleteId(null)}
                     className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-surfaceHighlight text-textMuted hover:text-textMain hover:bg-surfaceHighlight/80 transition-colors"
                   >
                     {t.cancel}
                   </button>
                   <button
                     onClick={confirmDelete}
                     className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-danger text-white hover:bg-danger/90 transition-all shadow-lg shadow-danger/20 hover:scale-[1.02]"
                   >
                     Eliminar
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Full Screen History Modal */}
      <TransactionHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        transactions={transactions} 
        currency={currency} 
      />
    </>
  );
};
