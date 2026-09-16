import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { UserSession } from '../types';
import { getAuthHeaders } from '../services/questionnaireApiClient';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  auditId: string;
  client: string;
  distributor: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  auditId,
  client,
  distributor
}) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm the DMP AI Copilot. I can help you understand and analyze information available in the DMP, explain audit concepts, and assist with audit documentation."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue;
    const currentMessages = [...messages, { sender: 'user', text: userMsg }];
    setMessages(currentMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.name || '',
          'x-user-role': currentUser?.role || 'Auditor',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          message: userMsg,
          history: currentMessages.slice(-6),
          context: {
            auditId,
            client,
            distributor,
            role: currentUser?.role || 'Unknown',
            userName: currentUser?.name || 'Unknown'
          }
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success && data.text) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
      } else {
        if (res.status === 401) {
          setMessages(prev => [...prev, { sender: 'ai', text: "Authentication required. Please log in to use AI Copilot." }]);
        } else if (data.error && data.error.includes("not configured")) {
          setMessages(prev => [...prev, { sender: 'ai', text: "AI Copilot is not configured for this environment." }]);
        } else {
          setMessages(prev => [...prev, { sender: 'ai', text: "AI Copilot is temporarily unavailable. Please try again." }]);
        }
      }
    } catch (err) {
      console.error('AI copilot fetch error:', err);
      setMessages(prev => [...prev, { sender: 'ai', text: "AI Copilot is temporarily unavailable. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 h-full flex flex-col justify-between shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4 animate-pulse text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">DMP AI Audit Copilot</h2>
              <p className="text-[10px] text-slate-400">Powered by Gemini 2.5 Flash & Audit Intelligence</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="h-7 w-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-indigo-600 text-white font-medium rounded-tr-none' 
                  : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
              }`}>
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3 rounded-xl max-w-[85%] bg-slate-950/80 text-slate-400 border border-slate-800 rounded-tl-none">
                Consulting Copilot...
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Quick AI Actions</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button 
              onClick={() => {
                setInputValue('Draft a formal observation memo for the current audit exceptions.');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg whitespace-nowrap cursor-pointer"
            >
              Draft Observation Memo
            </button>
            <button 
              onClick={() => {
                setInputValue("Explain what Benford's Law is used for.");
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg whitespace-nowrap cursor-pointer"
            >
              Explain Benford's Law
            </button>
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="text"
              placeholder="Ask Copilot about the current audit or concepts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

