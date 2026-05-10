import { useState, useEffect, useRef } from 'react';

export default function TerminalLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // We expose a global window function temporarily to mirror the legacy behavior
  // but better to use a Context or custom Event in a real React app
  useEffect(() => {
    (window as any).aegisLog = (lvl: string, msg: string) => {
      const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setLogs(prev => [...prev.slice(-200), { ts, lvl, msg }]);
    };
    return () => { delete (window as any).aegisLog; };
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const clearLog = () => setLogs([]);

  return (
    <div className="panel animate-in fade-in duration-300">
      <div className="panel-header">
        <span className="panel-title uppercase tracking-[3px]">System Event Log</span>
        <button onClick={clearLog} className="btn text-[9px] px-3 py-1 uppercase tracking-widest">Clear</button>
      </div>
      <div className="panel-body p-0">
        <div id="log" className="bg-black p-4 h-[460px] overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar" ref={logRef}>
          {logs.map((l, i) => (
            <div key={i} className={`log-line mb-1 relative pl-6 ${
              l.lvl === 'OK' ? 'text-grey-dim' : 
              l.lvl === 'INFO' ? 'text-grey' : 
              l.lvl === 'WARN' ? 'text-orange-600' : 'text-primary-hi'
            }`}>
              <span className="absolute left-0 text-red-900 opacity-40">&gt;</span>
              <span className="text-grey-dim mr-2">[{l.ts}]</span>
              <span className="mr-2">[{l.lvl}]</span>
              {l.msg}
            </div>
          ))}
          {logs.length === 0 && <div className="text-grey-dim italic">Waiting for system events...</div>}
        </div>
      </div>
    </div>
  );
}
