import React, { useState, useEffect, useRef } from 'react';
import { X, User as UserIcon, Pencil, Save, Loader2, Settings } from 'lucide-react';
import { User, Theme } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User, newPassword?: string) => Promise<void>;
  onOpenSettings: () => void;
  t: any;
  theme: Theme;
}

export const ProfileModal: React.FC<Props> = ({
  isOpen, onClose, user, onLogout, onUpdateUser, onOpenSettings, t, theme
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateUser({
        ...user,
        name,
        email: user.email,
        avatar
      });
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Error updating profile. Email might be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`glass-strong w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in border border-white/20`}>
        
        {/* Header */}
        <div className={`p-6 border-b border-white/10 flex justify-between items-center bg-surfaceHighlight`}>
          <h3 className={`text-sm font-bold uppercase tracking-widest text-textMain`}>
            Perfil
          </h3>
          <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 bg-surface">
          
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-surfaceHighlight shadow-2xl glass">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Pencil className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 bg-textMain text-background p-2 rounded-full shadow-lg">
                <Pencil className="w-3 h-3" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{t.name}</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`glass-input w-full p-4 pl-11 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all text-textMain`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-textMain text-background hover:scale-[1.02] shadow-lg`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t.save}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-dashed border-white/10 flex flex-col gap-3">
             <button
               onClick={() => {
                 onClose();
                 onOpenSettings();
               }}
               className="w-full py-3 text-textMain border border-white/10 hover:bg-surfaceHighlight rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors"
             >
               <Settings className="w-4 h-4" /> {t.settings}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};