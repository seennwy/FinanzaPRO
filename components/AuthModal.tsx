
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { Theme } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
  t: any;
  theme: Theme;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLogin, onRegister, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
    } catch (err: any) {
      if (err.message === 'User already exists') {
        setError(t.errorUserExists);
      } else if (err.message === 'Invalid credentials') {
        setError(t.errorInvalidCreds);
      } else {
        setError(t.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-gray-200 dark:border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-surfaceHighlight flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-textMain">
             {isLogin ? t.login : t.signup}
          </h3>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 bg-surface">
          {error && (
            <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{t.name}</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                    className="glass-input w-full p-4 pl-11 rounded-xl focus:border-primary focus:outline-none text-sm transition-colors text-textMain placeholder-textMuted caret-primary"
                    placeholder="Tu Nombre" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="glass-input w-full p-4 pl-11 rounded-xl focus:border-primary focus:outline-none text-sm transition-colors text-textMain placeholder-textMuted caret-primary"
                  placeholder="name@example.com" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="glass-input w-full p-4 pl-11 rounded-xl focus:border-primary focus:outline-none text-sm transition-colors text-textMain placeholder-textMuted caret-primary"
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-textMain text-background hover:scale-[1.02] shadow-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? t.login : t.signup}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-xs text-textMuted hover:text-textMain transition-colors uppercase tracking-widest font-bold"
            >
              {isLogin ? t.dontHaveAccount : t.haveAccount} <span className="text-primary underline decoration-2 underline-offset-4">{isLogin ? t.signup : t.login}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
