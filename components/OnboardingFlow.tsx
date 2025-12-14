
import React, { useState, useRef, useEffect } from 'react';
import { Activity, ArrowRight, Check, Upload, User as UserIcon, Loader2, Plus, X, List, Trash2, Calendar, ChevronRight, DollarSign } from 'lucide-react';
import { User, RecurringItem } from '../types';
import { db } from '../services/db';

interface Props {
  onComplete: (user: User, customRecurring: RecurringItem[], customCats: string[]) => void;
  t: any;
  initialRecurringItems: RecurringItem[];
  initialCategories: string[];
}

export const OnboardingFlow: React.FC<Props> = ({ onComplete, t, initialRecurringItems, initialCategories }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Name, 2: Photo, 3: Categories, 4: Recurring, 5: Loading
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Categories State
  const [expenseCats, setExpenseCats] = useState<string[]>(initialCategories);
  const [newCatInput, setNewCatInput] = useState('');

  // Custom Recurring State
  const [recurringList, setRecurringList] = useState<RecurringItem[]>(initialRecurringItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set([])); // Start empty to respect "I choose nothing"
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [customDays, setCustomDays] = useState<Record<string, number>>({});
  
  // Modal State for configuring an item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Temporary state for the modal
  const [tempAmount, setTempAmount] = useState('');
  const [tempDay, setTempDay] = useState('1');

  // Add new custom item inputs (global add)
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(''); 
  const [newItemType, setNewItemType] = useState<'income'|'expense'>('expense');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingText, setLoadingText] = useState(t.obInitializing);

  useEffect(() => {
    // Initial category for dropdown if available
    if (expenseCats.length > 0 && !newItemCategory) {
      setNewItemCategory(expenseCats[0]);
    }
  }, [expenseCats]);

  // When opening the edit modal, load existing values or defaults
  useEffect(() => {
    if (editingItemId) {
      const item = recurringList.find(i => i.id === editingItemId);
      if (item) {
        setTempAmount(customAmounts[item.id]?.toString() || item.defaultAmount.toString());
        setTempDay(customDays[item.id]?.toString() || '1');
      }
    }
  }, [editingItemId]);

  useEffect(() => {
    if (step === 5) { 
      const texts = [t.obInitializing, t.obAnalyzing, t.obConfiguring];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 800);

      const init = async () => {
        // Calculate the FINAL list of active recurring items based on selection
        const selectedList = recurringList.filter(item => selectedItems.has(item.id));
        
        // Map them to include any custom values set by the user (amount, day)
        const finalRecurringItemsForApp = selectedList.map(item => ({
          ...item,
          defaultAmount: customAmounts[item.id] !== undefined ? customAmounts[item.id] : item.defaultAmount,
          dayOfMonth: customDays[item.id] !== undefined ? customDays[item.id] : (item.dayOfMonth || 1)
        }));
        
        // Prepare list for DB (which historically used 'amount' property)
        const itemsForDB = finalRecurringItemsForApp.map(item => ({
            ...item,
            amount: item.defaultAmount // Map defaultAmount to amount for DB generator
        }));
        
        // Initialize DB with transactions
        const user = await db.initSingleUser(name, avatar, itemsForDB);
        
        // Pass the COMPLETE active list to App to REPLACE the defaults
        onComplete(user, finalRecurringItemsForApp, expenseCats);
      };
      init();

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = () => setStep(s => s + 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemClick = (id: string) => {
    // Toggle logic: If not selected, select and open modal. If selected, just open modal.
    if (!selectedItems.has(id)) {
       const newSet = new Set(selectedItems);
       newSet.add(id);
       setSelectedItems(newSet);
       // Init defaults if needed
       if (!customDays[id]) setCustomDays(prev => ({...prev, [id]: 1}));
    }
    setEditingItemId(id);
  };

  const saveItemConfig = () => {
    if (editingItemId) {
      setCustomAmounts(prev => ({ ...prev, [editingItemId]: parseFloat(tempAmount) || 0 }));
      
      let d = parseInt(tempDay);
      if (isNaN(d) || d < 1) d = 1;
      if (d > 31) d = 31;
      setCustomDays(prev => ({ ...prev, [editingItemId]: d }));
      
      setEditingItemId(null);
    }
  };

  const removeItemConfig = () => {
    if (editingItemId) {
      const newSet = new Set(selectedItems);
      newSet.delete(editingItemId);
      setSelectedItems(newSet);
      setEditingItemId(null);
    }
  };

  const handleAddCategory = () => {
    if (newCatInput.trim() && !expenseCats.includes(newCatInput.trim())) {
      setExpenseCats([...expenseCats, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setExpenseCats(expenseCats.filter(c => c !== cat));
  };

  const handleAddCustomItem = () => {
    if (!newItemName) return;
    
    const id = `custom_${Date.now()}`;
    const newItem: RecurringItem = {
      id,
      label: newItemName,
      defaultAmount: 0,
      category: newItemCategory || expenseCats[0],
      type: newItemType,
      icon: '✨',
      dayOfMonth: 1
    };
    
    setRecurringList(prev => [...prev, newItem]);
    // Auto select and open editor
    setSelectedItems(prev => new Set(prev).add(id));
    setCustomDays(prev => ({...prev, [id]: 1}));
    setCustomAmounts(prev => ({...prev, [id]: 0}));
    
    setEditingItemId(id);

    setIsAddingCustom(false);
    setNewItemName('');
  };

  // Step 0: Intro
  if (step === 0) {
    return (
      <div className="min-h-screen text-textMain flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="z-10 flex flex-col items-center text-center space-y-10 animate-fade-in-up">
           <div className="w-28 h-28 rounded-[2rem] glass flex items-center justify-center shadow-2xl mb-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
             <Activity className="w-14 h-14 text-primary relative z-10 drop-shadow-[0_0_10px_rgba(0,227,150,0.8)]" />
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl">
             FYNEX
           </h1>
           
           <p className="text-xl text-textMuted max-w-md font-light leading-relaxed glass p-4 rounded-xl border-none">
             {t.obSubtitle}
           </p>
           
           <button onClick={handleNext} className="mt-12 px-10 py-5 bg-textMain text-background rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
             {t.obStart} <ArrowRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    );
  }

  // Step 1: Name
  if (step === 1) {
    return (
      <div className="min-h-screen text-textMain flex flex-col justify-center p-8 max-w-xl mx-auto animate-fade-in">
        <div className="glass-card p-10 rounded-[2.5rem]">
          <h2 className="text-3xl font-bold mb-8 drop-shadow-lg">{t.obNameTitle}</h2>
          <input 
            autoFocus
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder={t.obNamePlaceholder}
            className="!bg-transparent border-b-2 border-gray-200 dark:border-white/20 text-4xl py-4 focus:outline-none focus:border-primary w-full placeholder-textMuted font-light transition-colors text-textMain caret-primary"
          />
          <div className="mt-12 flex justify-end">
            <button 
               disabled={!name.trim()}
               onClick={handleNext} 
               className="px-8 py-3 bg-textMain text-background rounded-full font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg"
            >
              {t.obNext}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Photo
  if (step === 2) {
    return (
      <div className="min-h-screen text-textMain flex flex-col justify-center p-8 max-w-xl mx-auto animate-fade-in">
        <div className="glass-card p-10 rounded-[2.5rem]">
          <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{t.obPhotoTitle}</h2>
          <p className="text-textMuted mb-12">{t.obPhotoSubtitle}</p>
          
          <div className="flex flex-col items-center gap-8">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-48 h-48 rounded-full glass flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-surfaceHighlight transition-all relative overflow-hidden group shadow-2xl"
             >
               {avatar ? (
                  <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                  <Upload className="w-12 h-12 text-textMuted group-hover:text-textMain transition-colors" />
               )}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
             
             <div className="flex gap-4">
               <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">{t.obUpload}</button>
               {avatar && <button onClick={() => setAvatar('')} className="text-sm font-bold uppercase tracking-wider text-danger hover:text-red-400 transition-colors">Clear</button>}
             </div>
          </div>

          <div className="mt-12 flex justify-between items-center">
            <button onClick={handleNext} className="text-textMuted hover:text-textMain transition-colors text-sm uppercase tracking-wider font-bold">{t.obSkip}</button>
            <button onClick={handleNext} className="px-8 py-3 bg-textMain text-background rounded-full font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-lg">
              {t.obNext}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Categories
  if (step === 3) {
    return (
      <div className="min-h-screen text-textMain flex flex-col p-6 max-w-2xl mx-auto animate-fade-in justify-center">
        <div className="glass-card p-6 md:p-10 rounded-[2.5rem] flex flex-col max-h-[85vh]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Categorías</h2>
            <p className="text-textMuted text-sm">Organiza tus gastos. Añade o elimina categorías según necesites.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCatInput} 
              onChange={(e) => setNewCatInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Nueva categoría..."
              className="flex-1 glass-input rounded-xl px-4 py-3 text-sm focus:border-primary text-textMain"
            />
            <button 
              onClick={handleAddCategory}
              className="bg-textMain text-background px-4 rounded-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar content-start pb-4">
            <div className="flex flex-wrap gap-3">
              {expenseCats.map((cat) => (
                <div key={cat} className="bg-surfaceHighlight px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-3 animate-scale-in">
                  <span className="font-bold text-sm text-textMain">{cat}</span>
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-textMuted hover:text-danger transition-colors p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {expenseCats.length === 0 && (
                <div className="w-full text-center py-10 text-textMuted text-sm italic">
                  Añade categorías para comenzar.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end mt-4">
            <button 
              onClick={handleNext} 
              className="w-full py-4 bg-textMain text-background rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
            >
              {t.obNext}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Recurring
  if (step === 4) {
    const editingItem = recurringList.find(i => i.id === editingItemId);

    return (
      <div className="min-h-screen text-textMain flex flex-col p-6 max-w-2xl mx-auto animate-fade-in justify-center relative">
        <div className="glass-card p-6 md:p-10 rounded-[2.5rem] flex flex-col max-h-[85vh]">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t.obRecurTitle}</h2>
              <p className="text-textMuted text-sm">{t.obRecurSubtitle}</p>
            </div>
            <button 
              onClick={() => setIsAddingCustom(true)}
              className="bg-surfaceHighlight p-3 rounded-full hover:bg-white/10 dark:hover:bg-white/10 text-primary transition-all shadow-lg hover:shadow-primary/20"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* New Item Form (Inline, simple) */}
          {isAddingCustom && (
            <div className="mb-4 p-5 bg-surfaceHighlight/50 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 animate-slide-in-right">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-textMain">Crear Personalizado</h3>
                 <button onClick={() => setIsAddingCustom(false)}><X className="w-4 h-4 text-textMuted hover:text-textMain" /></button>
               </div>
               <div className="space-y-4">
                 <input 
                   type="text" 
                   placeholder="Nombre (ej: Gimnasio)" 
                   className="glass-input w-full p-3 rounded-xl text-sm text-textMain"
                   value={newItemName}
                   onChange={e => setNewItemName(e.target.value)}
                   autoFocus
                 />
                 <div className="grid grid-cols-2 gap-3">
                    <select 
                        className="glass-input p-3 rounded-xl text-sm w-full appearance-none text-textMain"
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value as any)}
                    >
                        <option value="expense">Gasto</option>
                        <option value="income">Ingreso</option>
                    </select>
                    <select 
                        className="glass-input p-3 rounded-xl text-sm w-full appearance-none text-textMain"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                    >
                        {expenseCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <button 
                   disabled={!newItemName}
                   onClick={handleAddCustomItem}
                   className="w-full py-3 bg-textMain text-background rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                 >
                   Continuar y Configurar
                 </button>
               </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
            {recurringList.map((item) => {
              const isSelected = selectedItems.has(item.id);
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 group ${isSelected ? 'glass bg-surfaceHighlight border-primary/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-transparent border-gray-200 dark:border-white/5 hover:border-primary/50 hover:bg-surfaceHighlight'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${isSelected ? 'bg-primary/10 scale-105' : 'bg-gray-100 dark:bg-white/5 grayscale opacity-50'}`}>
                         {item.icon}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${isSelected ? 'text-textMain' : 'text-textMuted group-hover:text-textMain'}`}>{item.label}</span>
                        <span className="text-[10px] text-textMuted uppercase tracking-wider">{item.category}</span>
                        
                        {/* Summary Pill if selected */}
                        {isSelected && (
                           <div className="mt-1 flex items-center gap-2">
                             <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                               {(customAmounts[item.id] ?? item.defaultAmount).toLocaleString()} €
                             </span>
                             <span className="text-[10px] font-mono text-textMuted bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                               Día {customDays[item.id] ?? 1}
                             </span>
                           </div>
                        )}
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-black' : 'border-gray-200 dark:border-white/10 text-transparent'}`}>
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
            <button 
              onClick={handleNext} 
              className="w-full py-4 bg-textMain text-background rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {t.obFinish}
            </button>
          </div>
        </div>

        {/* Item Configuration Modal/Overlay */}
        {editingItemId && editingItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md rounded-[2.5rem]">
            <div className="w-full bg-surface border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">
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
                         className="w-full bg-surfaceHighlight border border-gray-200 dark:border-white/5 rounded-2xl py-4 pl-4 pr-12 text-3xl font-mono font-bold text-textMain focus:outline-none focus:border-primary/50 transition-colors placeholder-textMuted/30"
                         placeholder="0.00"
                       />
                       <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
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
                         className="w-full bg-surfaceHighlight border border-gray-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold text-textMain focus:outline-none focus:border-primary/50 transition-colors"
                         placeholder="1"
                       />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                 <button 
                   onClick={removeItemConfig}
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
    );
  }

  // Step 5: Loading
  return (
    <div className="min-h-screen text-textMain flex flex-col items-center justify-center p-6 relative">
       <div className="glass-card p-12 rounded-[3rem] flex flex-col items-center space-y-8 animate-scale-in">
         <div className="relative">
           <div className="w-20 h-20 border-4 border-gray-200 dark:border-white/10 border-t-primary rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Activity className="w-8 h-8 text-primary animate-pulse" />
           </div>
         </div>
         <p className="text-sm font-mono text-textMuted uppercase tracking-widest animate-pulse">{loadingText}</p>
       </div>
    </div>
  );
};
