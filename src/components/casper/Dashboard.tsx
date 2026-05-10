import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Dashboard({ monitorRunning }: { monitorRunning: boolean }) {
  const [stats, setStats] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [ts, setTs] = useState('--');

  useEffect(() => {
    const loadDevice = async () => {
      try { const d = await api.getDevice(); setDevice(d); } catch (e) {}
    };
    loadDevice();
  }, []);

  useEffect(() => {
    if (!monitorRunning) return;
    const loadStats = async () => {
      try {
        const d = await api.getStats();
        if (d.paused) return;
        setStats(d);
        setTs(new Date().toLocaleTimeString('en-GB', { hour12: false }));
      } catch (e) {}
    };
    loadStats();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, [monitorRunning]);

  const StatPanel = ({ title, value, pct, sub, badge }: any) => (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        <span className="panel-badge">{badge || '--'}</span>
      </div>
      <div className="panel-body">
        <div className="stat-label">UTILIZATION</div>
        <div className="stat-value">{value || '—'}</div>
        <div className="meter-bar">
          <div 
            className={`meter-fill ${pct > 85 ? 'crit' : pct > 65 ? 'warn' : 'ok'}`} 
            style={{ width: `${Math.min(pct || 0, 100)}%` }}
          ></div>
        </div>
        {sub && <div className="stat-sub text-[10px] text-grey-dim mt-1.5">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatPanel 
          title="CPU LOAD" 
          value={stats ? `${Math.round(stats.cpu)}%` : '—'} 
          pct={stats?.cpu} 
          badge={ts}
        />
        <StatPanel 
          title="MEMORY" 
          value={stats ? `${Math.round(stats.ram_pct)}%` : '—'} 
          pct={stats?.ram_pct} 
          badge={ts}
          sub={stats ? `${stats.ram_used_gb} GB / ${stats.ram_total_gb} GB` : '— GB / — GB'}
        />
        <StatPanel 
          title="DISK" 
          value={stats ? `${Math.round(stats.disk_pct)}%` : '—'} 
          pct={stats?.disk_pct} 
          badge={ts}
          sub={stats ? `${stats.disk_free_gb} GB free` : '— GB free'}
        />
      </div>

      <div className="panel mt-4">
        <div className="panel-header">
          <span className="panel-title">DEVICE IDENTITY</span>
          <span className="panel-badge uppercase tracking-wider">Local Node</span>
        </div>
        <div className="panel-body space-y-1">
          <div className="kv-row border-b border-border py-1 flex justify-between">
            <span className="kv-key text-grey-dim text-[12px] uppercase tracking-wider">Hostname</span>
            <span className="kv-val text-white">{device?.hostname || '—'}</span>
          </div>
          <div className="kv-row border-b border-border py-1 flex justify-between">
            <span className="kv-key text-grey-dim text-[12px] uppercase tracking-wider">Local IP</span>
            <span className="kv-val text-white">{device?.local_ip || '—'}</span>
          </div>
          <div className="kv-row border-b border-border py-1 flex justify-between">
            <span className="kv-key text-grey-dim text-[12px] uppercase tracking-wider">Mac Address</span>
            <span className="kv-val text-white">{device?.mac || '—'}</span>
          </div>
          <div className="kv-row py-1 flex justify-between">
            <span className="kv-key text-grey-dim text-[12px] uppercase tracking-wider">Operating System</span>
            <span className="kv-val text-white">{device?.os || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
