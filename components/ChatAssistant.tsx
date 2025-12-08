import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Language, Currency } from '../types';
import { sendFinancialChatMessage } from '../services/geminiService';
import { Send, User as UserIcon, Bot, Loader2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  lang: Language;
  currency: Currency;
  t: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatAssistant: React.FC<Props> = ({ transactions, lang, currency, t }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t.chatWelcome,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendFinancialChatMessage(input, transactions, lang, currency);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-[2rem] flex flex-col h-[calc(100vh-200px)] md:h-[600px] overflow-hidden transition-colors duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-surfaceHighlight/50 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-white/5 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,227,150,0.2)]">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-textMain">Finanza AI</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(0,227,150,0.8)]"></span>
            <span className="text-[10px] text-textMuted uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border backdrop-blur-sm ${
                msg.role === 'user' 
                  ? 'bg-surfaceHighlight border-white/10 text-textMain' 
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg backdrop-blur-md border ${
                msg.role === 'user'
                  ? 'bg-surface text-textMain rounded-tr-sm border-white/10'
                  : 'bg-surfaceHighlight text-textMain rounded-tl-sm border-white/5'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex shrink-0 items-center justify-center text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-textMuted/50 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-textMuted/50 rounded-full animate-bounce delay-75"></span>
                   <span className="w-1.5 h-1.5 bg-textMuted/50 rounded-full animate-bounce delay-150"></span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surfaceHighlight/20 border-t border-white/5 backdrop-blur-lg">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            className="w-full glass-input rounded-full py-4 pl-6 pr-14 text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder-textMuted shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2.5 bg-textMain text-background rounded-full hover:bg-surfaceHighlight hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-lg"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};