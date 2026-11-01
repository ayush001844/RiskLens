import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, MessageSquare, Send, X, Bot, User, CornerDownLeft,
  ChevronRight, RefreshCw, Shield, AlertTriangle, ExternalLink,
  Layers, CheckCheck, Lightbulb, Info
} from 'lucide-react';
import { copilotApi } from '../api/client';
import type { CopilotChatResponse, CopilotQuickPrompt } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ type: string; id: string; title: string }>;
  suggested_followups?: string[];
  timestamp: string;
}

export const CisoCopilotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "**Welcome to the RiskLens CISO Copilot.**\n\nI am your executive AI advisory copilot grounded in Apex Financial Services Ltd.'s active GRC registers, continuous control telemetry, and the ROSI simulation engine.\n\nHow can I assist your risk committee or board briefing today?",
      sources: [
        {"type": "Executive Core", "id": "RISKLENS-V2", "title": "Apex Financial Services Live Registry"},
      ],
      suggested_followups: [
        "Give me a briefing for the board meeting today.",
        "What are our statutory penalty exposures under the DPDP Act 2023?",
        "What is the Return on Security Investment (ROSI) for our proposed initiatives?",
      ],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<CopilotQuickPrompt[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    copilotApi.getQuickPrompts().then(setQuickPrompts).catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res: CopilotChatResponse = await copilotApi.chat(text, history);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.response,
        sources: res.sources,
        suggested_followups: res.suggested_followups,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Copilot error:', err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error querying the GRC intelligence registry. Please try again or rephrase your question.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Persistent Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-[9990] flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white font-semibold text-xs shadow-xl shadow-indigo-600/30 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          title="Open CISO Executive Copilot"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span className="tracking-wide">Ask CISO Copilot</span>
        </button>
      </div>

      {/* Sliding Copilot Drawer */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm animate-in">
            <div className="w-full sm:w-[500px] h-full bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col justify-between relative animate-in slide-in-from-right">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      RiskLens CISO Copilot
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        Online
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Grounded in live telemetry, CCF crosswalk & ROSI models
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMessages(messages.slice(0, 1))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs"
                    title="Reset conversation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Prompts Carousel Bar */}
              <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto flex gap-2 no-scrollbar">
                {quickPrompts.slice(0, 4).map(qp => (
                  <button
                    key={qp.id}
                    onClick={() => handleSend(qp.prompt)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{qp.title}</span>
                  </button>
                ))}
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent text-white font-medium'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 space-y-2'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Sources Attribution */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                            Verified GRC Sources:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-mono"
                              >
                                {s.id}: {s.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Followups */}
                      {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-500 block">
                            Suggested Inquiries:
                          </span>
                          {msg.suggested_followups.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(q)}
                              className="text-left w-full text-[11px] text-indigo-300 hover:text-cyan-300 flex items-start gap-1 py-0.5 transition-colors"
                            >
                              <ChevronRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                              <span>{q}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] text-slate-500 block text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Synthesizing GRC telemetry and calculating answers...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/90">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 focus-within:border-accent transition-all">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about risk appetite, DPDP fines, ROSI, drift..."
                    className="flex-1 bg-transparent border-none text-xs text-slate-200 px-2 py-1.5 focus:outline-none placeholder:text-slate-500"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputMessage.trim() || loading}
                    className="p-2 rounded-lg bg-accent text-white hover:bg-accent/80 disabled:opacity-40 transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-1.5 font-mono">
                  Synthesized for Apex Financial Services Ltd. • Strict GRC Context
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CisoCopilotDrawer;
