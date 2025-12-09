
import React, { useRef, useState, useEffect } from 'react';
import { X, Moon, Sun, Languages, DollarSign, Download, Upload, Database, Monitor, List, CheckCircle, Trash2, Plus, Calendar, ChevronRight, LayoutGrid, Clock } from 'lucide-react';
import { Theme, Language, Currency, RecurringItem, TransactionType, DashboardRange } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  t: any;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  dashboardRange: DashboardRange;
  setDashboardRange: (range: DashboardRange) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  
  incomeCategories: string[];
  setIncomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
  expenseCategories: string[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<string[]>>;
  recurringItems: RecurringItem[];
  setRecurringItems: React.Dispatch<React.SetStateAction<RecurringItem[]>>;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen, onClose, t, theme, setTheme, language, setLanguage, currency, setCurrency, dashboardRange, setDashboardRange, onExport, onImport,
  incomeCategories, setIncomeCategories, expenseCategories, setExpenseCategories, recurringItems, setRecurringItems
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- CATEGORIES STATE --
  const [newCatName, setNewCatName] = useState('');
  const [activeCatTab, setActiveCatTab] = useState<'expense' | 'income'>('expense');
  
  // -- RECURRING ITEMS STATE --
  // For the "Add New" form (inline or modal)
  const [isAddingRec, setIsAddingRec] = useState(false);
  const [newRecLabel, setNewRecLabel] = useState('');
  const [newRecCategory, setNewRecCategory] = useState('');
  const [newRecType, setNewRecType] = useState<'income' | 'expense'>('expense');

  // For the "Edit" Modal (Overlay)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  const [tempDay, setTempDay] = useState('1');

  // Initialize defaults for category dropdowns
  useEffect(() => {
    if (activeCatTab === 'expense' && expenseCategories.length > 0) setNewRecCategory(expenseCategories[0]);
    if (activeCatTab === 'income' && incomeCategories.length > 0) setNewRecCategory(incomeCategories[0]);
  }, [activeCatTab, expenseCategories, incomeCategories]);

  // Load data into temp state when editing starts
  useEffect(() => {
    if (editingItemId) {
      const item = recurringItems.find(i => i.id === editingItemId);
      if (item) {
        setTempAmount(item.defaultAmount.toString());
        setTempDay(item.dayOfMonth?.toString() || '1');
      }
    }
  }, [editingItemId, recurringItems]);

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    
    if (activeCatTab === 'income') {
      if (!incomeCategories.includes(name)) setIncomeCategories([...incomeCategories, name]);
    } else {
      if (!expenseCategories.includes(name)) setExpenseCategories([...expenseCategories, name]);
    }
    setNewCatName('');
  };

  const removeCategory = (name: string, type: TransactionType) => {
    if (type === 'income') {
      setIncomeCategories(incomeCategories.filter(c => c !== name));
    } else {
      setExpenseCategories(expenseCategories.filter(c => c !== name));
    }
  };

  // Add a brand new recurring item
  const handleCreateRecurring = () => {
    if (!newRecLabel.trim()) return;

    const newItem: RecurringItem = {
      id: `custom_${Date.now()}`,
      label: newRecLabel,
      type: newRecType,
      category: newRecCategory || (newRecType === 'income' ? incomeCategories[0] : expenseCategories[0]),
      defaultAmount: 0, // Will be edited immediately
      dayOfMonth: 1,    // Default
      icon: '✨'
    };

    setRecurringItems([...recurringItems, newItem]);
    
    // Reset add form
    setNewRecLabel('');
    setIsAddingRec(false);
    
    // Immediately open edit modal for details
    setEditingItemId(newItem.id);
  };

  // Save changes from the Edit Modal
  const saveItemConfig = () => {
    if (editingItemId) {
      const amount = parseFloat(tempAmount) || 0;
      let day = parseInt(tempDay);
      if (isNaN(day) || day < 1) day = 1;
      if (day > 31) day = 31;

      setRecurringItems(prev => prev.map(item => 
        item.id === editingItemId 
          ? { ...item, defaultAmount: amount, dayOfMonth: day }
          : item
      ));
      setEditingItemId(null);
    }
  };

  const removeRecurring = (id: string) => {
    setRecurringItems(recurringItems.filter(i => i.id !== id));
    setEditingItemId(null); // Close modal if open
  };

  const editingItem = recurringItems.find(i => i.id === editingItemId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`glass-strong w-full max-w-2xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in border border-gray-200 dark:border-white/10 flex flex-col relative`}>
        
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-surface shrink-0`}>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-surfaceHighlight rounded-xl">
               <Monitor className="w-5 h-5 text-textMain" />
             </div>
             <h3 className={`text-lg font-bold text-textMain tracking-wide`}>
               {t.settings}
             </h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-textMuted hover:text-textMain hover:bg-surfaceHighlight/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-background">
          
          {/* Section 1: Preferences */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest ml-1">Preferencias Generales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Theme */}
               <div className="glass-card p-4 rounded-3xl space-y-3">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="w-3 h-3" /> {t.theme}
                  </label>
                  <div className="flex gap-1 p-1 bg-surfaceHighlight rounded-xl border border-gray-200 dark:border-white/5">
                    {(['light', 'dark', 'system'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setTheme(m)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${theme === m ? 'bg-background text-textMain shadow-lg' : 'text-textMuted hover:text-textMain'}`}
                      >
                        {m === 'light' ? <Sun className="w-3 h-3" /> : m === 'dark' ? <Moon className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {m === 'system' ? 'Auto' : m === 'light' ? t.light : t.dark}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Dashboard Range Config */}
               <div className="glass-card p-4 rounded-3xl space-y-3">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {t.dashboardConfig}
                  </label>
                  <select 
                    value={dashboardRange}
                    onChange={(e) => setDashboardRange(e.target.value as DashboardRange)}
                    className="w-full glass-input p-2 rounded-xl text-xs font-bold text-textMain appearance-none"
                  >
                    <option value="annual" className="bg-surface">{t.rangeAnnual}</option>
                    <option value="last30Days" className="bg-surface">{t.range30Days}</option>
                    <option value="last15Days" className="bg-surface">{t.range15Days}</option>
                    <option value="lastPaycheck" className="bg-surface">{t.rangePaycheck}</option>
                  </select>
               </div>

               {/* Language & Currency */}
               <div className="glass-card p-4 rounded-3xl space-y-4 md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Languages className="w-3 h-3" /> {t.language}
                      </label>
                      <div className="flex gap-2">
                         <button onClick={() => setLanguage('es')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${language === 'es' ? 'bg-surface text-textMain border-gray-200 dark:border-white/20' : 'border-gray-200 dark:border-white/5 text-textMuted hover:text-textMain'}`}>ES</button>
                         <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${language === 'en' ? 'bg-surface text-textMain border-gray-200 dark:border-white/20' : 'border-gray-200 dark:border-white/5 text-textMuted hover:text-textMain'}`}>EN</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest flex items-center gap-2 mb-2">
                        <DollarSign className="w-3 h-3" /> {t.currency}
                      </label>
                      <div className="flex gap-2">
                         {(['€', '$', '£'] as Currency[]).map(c => (
                            <button key={c} onClick={() => setCurrency(c)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${currency === c ? 'bg-surface text-textMain border-gray-200 dark:border-white/20' : 'border-gray-200 dark:border-white/5 text-textMuted hover:text-textMain'}`}>{c}</button>
                         ))}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Section 2: Categories */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest ml-1">Categorías</h4>
            <div className="glass-card p-6 rounded-[2.5rem]">
               <div className="flex p-1 bg-surfaceHighlight rounded-xl border border-gray-200 dark:border-white/5 mb-6">
                 <button onClick={() => setActiveCatTab('expense')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeCatTab === 'expense' ? 'bg-background text-textMain shadow-lg' : 'text-textMuted hover:text-textMain'}`}>Gastos</button>
                 <button onClick={() => setActiveCatTab('income')} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeCatTab === 'income' ? 'bg-background text-textMain shadow-lg' : 'text-textMuted hover:text-textMain'}`}>Ingresos</button>
               </div>

               <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newCatName} 
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={`Nueva categoría de ${activeCatTab === 'expense' ? 'gasto' : 'ingreso'}...`}
                    className="flex-1 glass-input rounded-xl px-4 py-3 text-sm focus:border-primary transition-colors text-textMain"
                  />
                  <button onClick={addCategory} className="bg-textMain text-background px-4 rounded-xl hover:scale-105 transition-transform flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {(activeCatTab === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <div key={cat} className="group bg-surfaceHighlight hover:bg-surfaceHighlight/80 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-3 transition-all animate-scale-in">
                      <span className="font-bold text-sm text-textMain">{cat}</span>
                      <button onClick={() => removeCategory(cat, activeCatTab)} className="text-textMuted group-hover:text-danger transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
               </div>
            </div>
          </section>

          {/* Section 3: Recurring Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest ml-1">Gastos e Ingresos Fijos</h4>
               <button 
                 onClick={() => setIsAddingRec(true)}
                 className="text-[10px] font-bold uppercase tracking-wider bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-primary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
               >
                 <Plus className="w-3 h-3" /> Añadir
               </button>
            </div>

            <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
               {/* Add Form */}
               {isAddingRec && (
                  <div className="p-5 bg-surfaceHighlight border-b border-gray-200 dark:border-white/5 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs font-bold uppercase tracking-wider text-textMain">Nuevo Recurrente</span>
                       <button onClick={() => setIsAddingRec(false)}><X className="w-4 h-4 text-textMuted hover:text-textMain" /></button>
                    </div>
                    <div className="space-y-3">
                       <input 
                         autoFocus
                         type="text" 
                         value={newRecLabel}
                         onChange={(e) => setNewRecLabel(e.target.value)}
                         className="glass-input w-full p-3 rounded-xl text-sm"
                         placeholder="Nombre (Ej: Netflix)"
                       />
                       <div className="grid grid-cols-2 gap-2">
                          <select 
                            value={newRecType}
                            onChange={(e) => setNewRecType(e.target.value as any)}
                            className="glass-input p-3 rounded-xl text-sm appearance-none"
                          >
                             <option value="expense">Gasto</option>
                             <option value="income">Ingreso</option>
                          </select>
                          <select
                            value={newRecCategory}
                            onChange={(e) => setNewRecCategory(e.target.value)}
                            className="glass-input p-3 rounded-xl text-sm appearance-none"
                          >
                             {(newRecType === 'expense' ? expenseCategories : incomeCategories).map(c => (
                               <option key={c} value={c}>{c}</option>
                             ))}
                          </select>
                       </div>
                       <button onClick={handleCreateRecurring} disabled={!newRecLabel} className="w-full py-3 bg-textMain text-background rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50">
                          Crear y Configurar
                       </button>
                    </div>
                  </div>
               )}

               <div className="divide-y divide-gray-200 dark:divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {recurringItems.length === 0 ? (
                    <div className="p-8 text-center text-textMuted text-sm italic">
                      {t.noRecurringData}
                    </div>
                  ) : (
                    recurringItems.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setEditingItemId(item.id)}
                        className="w-full text-left p-4 hover:bg-surfaceHighlight transition-colors group flex items-center justify-between"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-surfaceHighlight flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                               {item.icon}
                            </div>
                            <div>
                               <p className="font-bold text-sm text-textMain group-hover:text-primary transition-colors">{item.label}</p>
                               <p className="text-[10px] text-textMuted uppercase tracking-widest">{item.category}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                               <p className="font-mono font-bold text-xs text-textMain">{item.defaultAmount} {currency}</p>
                               <p className="text-[10px] text-textMuted">Día {item.dayOfMonth || 1}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-textMain group-hover:translate-x-1 transition-all" />
                         </div>
                      </button>
                    ))
                  )}
               </div>
            </div>
          </section>

          {/* Section 4: Data Management */}
          <section className="space-y-4 pb-4">
             <h4 className="text-xs font-bold text-textMuted uppercase tracking-widest ml-1">{t.dataManagement}</h4>
             <div className="glass-card p-6 rounded-[2.5rem] grid grid-cols-2 gap-4">
               <button
                  onClick={onExport}
                  className={`py-4 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border flex flex-col items-center justify-center gap-2 transition-all bg-surface border-gray-200 dark:border-white/5 text-textMain hover:bg-surfaceHighlight hover:border-primary/30 group`}
                >
                  <div className="p-2 rounded-full bg-surfaceHighlight group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                     <Download className="w-4 h-4" /> 
                  </div>
                  {t.exportData}
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-4 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border flex flex-col items-center justify-center gap-2 transition-all bg-surface border-gray-200 dark:border-white/5 text-textMain hover:bg-surfaceHighlight hover:border-primary/30 group`}
                >
                  <div className="p-2 rounded-full bg-surfaceHighlight group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                     <Upload className="w-4 h-4" /> 
                  </div>
                  {t.importData}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
             </div>
          </section>
        </div>

        {/* --- RECURRING ITEM EDITOR OVERLAY (MODAL IN MODAL) --- */}
        {editingItemId && editingItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-fade-in">
            <div className="w-full bg-surface border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl animate-scale-in">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-surfaceHighlight flex items-center justify-center text-3xl shadow-inner">
                    {editingItem.icon}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-textMain">{editingItem.label}</h3>
                    <p className="text-xs text-textMuted uppercase tracking-widest">{editingItem.category}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 block">Monto Mensual</label>
                    <div className="relative">
                       <input 
                         type="number"
                         autoFocus 
                         value={tempAmount}
                         onChange={(e) => setTempAmount(e.target.value)}
                         className="w-full !bg-surfaceHighlight border border-gray-200 dark:border-white/5 rounded-2xl py-4 pl-4 pr-10 text-3xl font-mono font-bold text-textMain focus:outline-none focus:border-primary/50 transition-colors placeholder-textMuted/30"
                         placeholder="0.00"
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold">{currency}</span>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 block">Día de cobro (1-31)</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                       <input 
                         type="number" 
                         min="1" max="31"
                         value={tempDay}
                         onChange={(e) => setTempDay(e.target.value)}
                         className="w-full !bg-surfaceHighlight border border-gray-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold text-textMain focus:outline-none focus:border-primary/50 transition-colors"
                         placeholder="1"
                       />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                 <button 
                   onClick={() => removeRecurring(editingItem.id)}
                   className="py-4 rounded-xl font-bold uppercase tracking-widest text-xs border border-danger/30 text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-2"
                 >
                   <Trash2 className="w-4 h-4" /> Eliminar
                 </button>
                 <button 
                   onClick={saveItemConfig}
                   className="py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-primary text-black hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,227,150,0.4)]"
                 >
                   Confirmar
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
