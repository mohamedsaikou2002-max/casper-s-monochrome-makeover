import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Connections({ monitorRunning }: { monitorRunning: boolean }) {
  const [conns, setConns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await api.getConnections(100);
      setConns(data.connections || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <div className="panel animate-in fade-in duration-300">
      <div className="panel-header">
        <span className="panel-title uppercase tracking-[3px]">Active Network Connections</span>
        <button 
          onClick={loadConnections}
          disabled={loading}
          className="btn text-[9px] px-3 py-1 uppercase tracking-widest"
        >
          {loading ? 'BUSY...' : 'Refresh'}
        </button>
      </div>
      <div className="panel-body p-0 overflow-x-auto">
        <table className="conn-table w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">PID</th>
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Process</th>
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Local</th>
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Remote</th>
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Status</th>
              <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Type</th>
            </tr>
          </thead>
          <tbody>
            {!monitorRunning ? (
              <tr><td colSpan={6} className="text-center p-6 text-red-600 uppercase tracking-widest">Monitor Paused</td></tr>
            ) : conns.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-6 text-grey-dim uppercase tracking-widest">No active connections</td></tr>
            ) : (
              conns.map((c, i) => (
                <tr key={i} className="border-b border-black/20 hover:bg-primary-dim/10 transition-colors">
                  <td className="p-2 text-grey-dim">{c.pid}</td>
                  <td className="p-2 text-white font-medium">{c.proc}</td>
                  <td className="p-2 text-grey-dim">{c.local}</td>
                  <td className="p-2 text-primary-hi font-bold">{c.remote}</td>
                  <td className="p-2">
                    <span className="text-[9px] px-1.5 py-0.5 border border-border text-grey-dim uppercase tracking-wider">{c.status}</span>
                  </td>
                  <td className="p-2">
                    <span className={`text-[9px] font-bold uppercase ${c.type === 'TCP' ? 'text-grey' : 'text-orange-600'}`}>{c.type}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
