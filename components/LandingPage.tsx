
import React from 'react';
import { Activity, ArrowRight, Lock } from 'lucide-react';

interface Props {
  onLoginClick: () => void;
  t: any;
}

export const LandingPage: React.FC<Props> = ({ onLoginClick, t }) => {
  return (
    <div className="min-h-screen bg-[#0F1112] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[128px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg text-center space-y-8 animate-fade-in-up">
        
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-surface border border-white/10 flex items-center justify-center shadow-2xl mb-4">
          <Activity className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
          FYNEX
        </h1>

        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white">
            {t.landingTitle}
          </h2>
          <p className="text-textMuted text-sm md:text-base leading-relaxed max-w-md mx-auto">
            {t.landingSubtitle}
          </p>
        </div>

        <div className="grid w-full gap-4 mt-8">
          <button 
            onClick={onLoginClick}
            className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            {t.login} / {t.signup} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-12 flex items-center gap-2 text-xs text-textMuted opacity-60">
          <Lock className="w-3 h-3" />
          <span className="uppercase tracking-widest">Secure Local Encryption</span>
        </div>
      </div>
    </div>
  );
};
