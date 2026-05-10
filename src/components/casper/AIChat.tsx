import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';

export default function AIChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Filter messages for history format the backend expects
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const data = await api.chat(input, history);
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR] ${data.error || 'System Timeout'}` }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `[CRITICAL ERROR] Failed to connect to LM Studio: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div className="panel h-full flex flex-col mb-0 animate-in fade-in duration-300">
      <div className="panel-header flex-none">
        <span className="panel-title uppercase tracking-[3px]">Aegis Expert System Interface</span>
        <span className="panel-badge uppercase tracking-wider text-primary-hi font-bold">LM Studio</span>
      </div>
      <div 
        className="panel-body flex-1 overflow-y-auto p-4 font-mono text-[12px] bg-black/40 border-b border-border custom-scrollbar"
        ref={streamRef}
      >
        <div className="text-grey-dim mb-4 leading-relaxed">
           SYSTEM 47 // AI INITIALIZED.<br/>
           You are connected to the internal secure network threat analyzer.<br/>
           Ask questions or request scan execution.
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 border ${
              m.role === 'user' ? 'bg-primary-hi/5 border-primary-hi/30 text-white' : 'bg-black/60 border-border text-grey'
            }`}>
              <div className="text-[9px] font-bold tracking-widest text-grey-dim mb-1 uppercase">
                {m.role === 'user' ? 'Operator' : 'Aegis // AI'}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-grey-dim text-[11px] animate-pulse">
            <span className="spin mr-2">◈</span> AEGIS IS THINKING...
          </div>
        )}
      </div>
      <div className="p-3 flex gap-2 flex-none bg-black/20">
        <input 
          className="flex-1 scan-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a command (e.g. 'Scan Wi-Fi' or 'Check phone')..."
        />
        <button 
          onClick={sendMessage}
          disabled={loading}
          className="btn px-8"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
