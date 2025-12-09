
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Language, Currency, Theme, User, RecurringItem } from './types';
import { INCOME_CATEGORIES as DEFAULT_INCOME, EXPENSE_CATEGORIES as DEFAULT_EXPENSE, RECURRING_ITEMS as DEFAULT_RECURRING, TRANSLATIONS } from './constants';
import { TransactionList } from './components/TransactionList';
import { Analytics } from './components/Analytics';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { db } from './services/db';
import { exportToCSV, parseCSV } from './services/dataService';
import { LayoutDashboard, Plus, X, Activity, Settings, User as UserIcon, Loader2, ArrowUp, Zap } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  
  // Global Settings State
  const [language, setLanguage] = useState<Language>('es');
  const [currency, setCurrency] = useState<Currency>('€');
  const [theme, setTheme] = useState<Theme>('system'); // Default to system
  
  // Dynamic Configuration State
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(DEFAULT_RECURRING);
  
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // New transaction form state
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState(DEFAULT_EXPENSE[0]);
  
  // Helper to get local date string YYYY-MM-DD
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [newDate, setNewDate] = useState(getToday());
  
  const t = TRANSLATIONS[language];

  // Effect to handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (t: 'dark' | 'light') => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Effect to reset category when type changes or categories update
  useEffect(() => {
    if (newType === 'income') {
      if (!incomeCategories.includes(newCategory)) {
        setNewCategory(incomeCategories[0] || 'Otros');
      }
    } else {
      if (!expenseCategories.includes(newCategory)) {
        setNewCategory(expenseCategories[0] || 'Otros');
      }
    }
  }, [newType, incomeCategories, expenseCategories]);

  // Check for existing user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const existingUser = await db.getUser();
        if (existingUser) {
          setUser(existingUser);
        }
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkUser();
  }, []);

  // Load User Data when user is set
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const userTx = await db.getTransactions();
        setTransactions(userTx);
      } else {
        setTransactions([]);
      }
    };
    loadUserData();
  }, [user]);

  // Helper to update state and persist to DB
  const updateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    db.saveTransactions(newTransactions);
  };

  // Derived state
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Performance Logic
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  
  const getPerformanceData = () => {
    if (savingsRate > 70) return { emoji: '🚀', label: 'Excelente', color: 'text-primary' };
    if (savingsRate >= 50) return { emoji: '🔥', label: 'Genial', color: 'text-[#FEB019]' }; // Gold
    if (savingsRate >= 20) return { emoji: '👍', label: 'Bien', color: 'text-accent' };
    return { emoji: '😐', label: 'Mejorable', color: 'text-textMuted' };
  };

  const performance = getPerformanceData();

  // Format Helper
  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const balanceFormatted = formatNumber(balance);
  const [balanceInt, balanceDec] = balanceFormatted.split(',');

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount || !newDate) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: newDesc,
      amount: parseFloat(newAmount),
      type: newType,
      category: newCategory,
      date: newDate,
    };

    const updated = [newTransaction, ...transactions];
    updateTransactions(updated);
    
    setNewDesc('');
    setNewAmount('');
    setNewDate(getToday());
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    updateTransactions(updated);
  };

  // Reset/Logout
  const handleLogout = () => {
    db.logout();
    setUser(null);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
  };

  // File Handlers
  const handleExport = () => {
    exportToCSV(transactions);
  };

  const handleImport = async (file: File) => {
    try {
      const importedTransactions = await parseCSV(file);
      updateTransactions(importedTransactions);
      alert(t.fileUploaded);
    } catch (error) {
      console.error(error);
      alert(t.fileError);
    }
  };

  // User Profile Update
  const handleProfileUpdate = async (updatedUser: User, newPassword?: string) => {
    if (user) {
      await db.updateUserProfile(user.email, updatedUser);
      setUser(updatedUser);
    }
  };

  const handleOnboardingComplete = (newUser: User, customRecurring: RecurringItem[], finalExpenseCategories: string[]) => {
    setUser(newUser);
    // Update local state with any custom items created during onboarding
    setRecurringItems(prev => [...prev, ...customRecurring]);
    // Replace expense categories with the ones finalized in onboarding
    setExpenseCategories(finalExpenseCategories);
  };

  // 1. Loading State
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary relative bg-background">
         <Loader2 className="w-8 h-8 animate-spin relative z-10" />
      </div>
    );
  }

  // 2. Not Configured -> Onboarding Flow
  if (!user) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete} 
        t={t} 
        initialRecurringItems={recurringItems}
        initialCategories={expenseCategories}
      />
    );
  }

  // 3. Configured -> Main App
  return (
    <div className={`min-h-screen text-textMain font-sans pb-32 md:pb-10 selection:bg-primary/30 selection:text-white bg-background`}>
      
      {/* Desktop Header */}
      <header className={`hidden md:block sticky top-6 z-20 mx-auto max-w-5xl rounded-2xl glass mb-8 transition-all duration-500`}>
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-black bg-gradient-to-br from-white to-gray-300 shadow-lg`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className={`text-lg font-bold tracking-tight text-textMain`}>FINANZA<span className="font-light text-textMuted">PRO</span></span>
          </div>
          
          <nav className="flex items-center gap-1 p-1 bg-surfaceHighlight rounded-full border border-white/5">
            {[
              { id: 'dashboard', label: t.dashboard },
              { id: 'analytics', label: t.data }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-surface text-textMain shadow-inner border border-white/5' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary/90 hover:bg-primary text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,227,150,0.4)] transition-all"
            >
              + {t.newEntry}
            </button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ring-2 ring-transparent hover:ring-white/20 hover:scale-105 ${user ? 'border-transparent' : 'border-white/20'}`}
            >
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-0">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-8 pt-2">
           <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-surface backdrop-blur-md border border-white/10 shadow-lg`}>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className={`font-bold tracking-tight text-xl block leading-none text-textMain`}>FINANZA</span>
              <span className="font-light text-textMuted text-xs tracking-widest">PRO</span>
            </div>
           </div>
           <button 
              onClick={() => setIsProfileOpen(true)}
              className={`w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg`}
           >
             <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
           </button>
        </div>

        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Net Balance Card */}
            <div className={`col-span-2 p-6 rounded-3xl glass-card relative overflow-hidden group`}>
              <div className="absolute top-6 right-6 p-2 rounded-full bg-surfaceHighlight border border-white/10 shadow-lg backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                <span className="text-2xl" role="img" aria-label="performance">{performance.emoji}</span>
              </div>
              <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">{t.balance}</p>
              <h2 className={`text-4xl md:text-5xl font-bold font-mono tracking-tighter text-textMain`}>
                {currency}{balanceInt}
                <span className="text-xl text-textMuted font-normal">,{balanceDec}</span>
              </h2>
              <div className="mt-4 flex items-center gap-2">
                 <div className={`h-1.5 flex-1 rounded-full overflow-hidden bg-black/10 dark:bg-black/20`}>
                    <div 
                      className={`h-full rounded-full bg-current shadow-[0_0_10px_currentColor] transition-all duration-1000 text-white`}
                      style={{ width: `${Math.min(savingsRate, 100)}%` }}
                    ></div>
                 </div>
                 <span className={`text-xs font-bold ${performance.color}`}>{performance.label}</span>
              </div>
            </div>

            {/* Income Card */}
            <div className={`p-5 rounded-3xl glass-card flex flex-col justify-between group`}>
               <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">{t.income}</p>
                <p className="text-xl font-bold font-mono text-primary drop-shadow-[0_0_8px_rgba(0,227,150,0.5)]">+{currency}{formatNumber(totalIncome)}</p>
               </div>
               <div className="mt-2 text-xs text-textMuted flex items-center gap-1 group-hover:text-textMain transition-colors">
                 <ArrowUp className="w-3 h-3 text-primary" /> {t.vsLast}
               </div>
            </div>

            {/* Expenses Card */}
            <div className={`p-5 rounded-3xl glass-card flex flex-col justify-between group`}>
               <div>
                <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">{t.expenses}</p>
                <p className="text-xl font-bold font-mono text-danger drop-shadow-[0_0_8px_rgba(255,69,96,0.5)]">-{currency}{formatNumber(totalExpense)}</p>
               </div>
               <div className="mt-2 text-xs text-textMuted flex items-center gap-1 group-hover:text-textMain transition-colors">
                 <span className="text-textMuted">{Math.round(100 - savingsRate)}% used</span>
               </div>
            </div>
          </div>
        )}

        <div className="animate-fade-in-up">
          {activeTab === 'dashboard' && (
            <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} currency={currency} t={t} />
          )}

          {activeTab === 'analytics' && (
            <Analytics transactions={transactions} currency={currency} t={t} />
          )}
        </div>
      </main>

      {/* Mobile Navigation & FAB */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center gap-3">
        {/* Navigation Pill */}
        <div className="flex-1 h-16 bg-surface border border-white/10 rounded-full flex items-center justify-between p-1.5 shadow-2xl relative overflow-hidden">
          {/* Dashboard Tab */}
          <button 
             onClick={() => setActiveTab('dashboard')}
             className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ${
               activeTab === 'dashboard' 
                 ? 'bg-textMain text-background shadow-lg' 
                 : 'text-textMuted hover:text-textMain'
             }`}
          >
             <LayoutDashboard className="w-5 h-5" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
             <span className="text-[9px] font-bold tracking-wide">{t.dashboard}</span>
          </button>

          {/* Analytics Tab */}
          <button 
             onClick={() => setActiveTab('analytics')}
             className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ${
               activeTab === 'analytics' 
                 ? 'bg-textMain text-background shadow-lg' 
                 : 'text-textMuted hover:text-textMain'
             }`}
          >
             <Activity className="w-5 h-5" strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
             <span className="text-[9px] font-bold tracking-wide">{t.data}</span>
          </button>
        </div>

        {/* FAB */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-16 w-16 rounded-full bg-textMain text-background flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all shrink-0 border-4 border-surface"
        >
          <Plus className="w-7 h-7" strokeWidth={3} />
        </button>
      </div>

      {/* Settings Modal (App Preferences) */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        t={t}
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
        currency={currency}
        setCurrency={setCurrency}
        onExport={handleExport}
        onImport={handleImport}
        
        incomeCategories={incomeCategories}
        setIncomeCategories={setIncomeCategories}
        expenseCategories={expenseCategories}
        setExpenseCategories={setExpenseCategories}
        recurringItems={recurringItems}
        setRecurringItems={setRecurringItems}
      />

      {/* Profile Modal (User Account) */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        onUpdateUser={handleProfileUpdate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        t={t}
        theme={theme}
      />

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`glass-strong rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-white/20`}>
            <div className={`p-6 border-b border-white/10 flex justify-between items-center`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest text-textMain`}>{t.newEntry}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-textMain transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`py-3 rounded-xl text-sm font-bold uppercase tracking-wider border transition-all ${newType === 'expense' ? 'bg-danger/20 border-danger text-danger' : 'bg-surface border-white/5 text-textMuted hover:bg-surfaceHighlight'}`}
                >
                  {t.expenses}
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`py-3 rounded-xl text-sm font-bold uppercase tracking-wider border transition-all ${newType === 'income' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-textMuted hover:bg-surfaceHighlight'}`}
                >
                  {t.income}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">{t.amount}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className={`glass-input w-full p-4 pl-8 rounded-xl font-mono text-lg outline-none focus:ring-1 focus:ring-primary/50 transition-all text-textMain placeholder-textMuted/50`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">{t.date}</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={`glass-input w-full p-4 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all text-textMain placeholder-textMuted/50`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">{t.description}</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`glass-input w-full p-4 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all text-textMain placeholder-textMuted/50`}
                  placeholder={t.placeholderDesc}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">{t.category}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`glass-input w-full p-4 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 text-sm appearance-none transition-all text-textMain`}
                >
                  {(newType === 'income' ? incomeCategories : expenseCategories).map(c => (
                    <option key={c} value={c} className="bg-surface text-textMain">{c}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className={`w-full mt-2 py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg bg-textMain text-background hover:scale-[1.02]`}
              >
                {t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
