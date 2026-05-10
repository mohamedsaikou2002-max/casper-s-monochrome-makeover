import { useState } from 'react';
import { api } from '../lib/api';

export default function IPScan() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const doScan = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.scanIp(ip);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const KvField = ({ k, v, red }: { k: string, v: any, red?: boolean }) => (
    <div className="kv-row border-b border-border py-1.5 flex justify-between">
      <span className="kv-key text-grey-dim text-[11px] uppercase tracking-wider">{k}</span>
      <span className={`kv-val text-right text-[12px] ${red ? 'text-primary-hi font-bold' : 'text-white'}`}>{v ?? '—'}</span>
    </div>
  );

  return (
    <div className="panel animate-in fade-in duration-300">
      <div className="panel-header">
        <span className="panel-title uppercase tracking-[3px]">IP Threat Intelligence</span>
        <span className="panel-badge uppercase tracking-wider">AbuseIPDB + Geo</span>
      </div>
      <div className="panel-body">
        <div className="flex gap-3 mb-6">
          <input 
            className="flex-1 bg-black border border-border text-white px-4 py-2 text-sm tracking-wider focus:border-primary-hi outline-none" 
            value={ip} 
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doScan()}
            placeholder="Enter IP address e.g. 8.8.8.8"
          />
          <button 
            onClick={doScan} 
            disabled={loading}
            className="btn px-8"
          >
            {loading ? 'BUSY...' : 'Scan'}
          </button>
        </div>

        {loading && <div className="text-grey-dim text-[11px] tracking-widest"><span className="spin mr-2">◈</span> Querying intelligence data...</div>}
        {error && <div className="text-primary-hi text-[11px] mb-4">⚠ {error}</div>}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in slide-in-from-bottom-2 duration-500">
            <div className="panel mb-0">
              <div className="panel-header"><span className="panel-title">Geo Location</span></div>
              <div className="panel-body text-[12px] space-y-1">
                <KvField k="IP" v={result.ip} />
                <KvField k="Country" v={result.geo?.country} />
                <KvField k="Region" v={result.geo?.region} />
                <KvField k="City" v={result.geo?.city} />
                <KvField k="ISP" v={result.geo?.isp} />
                <KvField k="Org" v={result.geo?.org} />
                <KvField k="Proxy" v={result.geo?.proxy ? 'YES' : 'No'} red={result.geo?.proxy} />
                <KvField k="Hosting" v={result.geo?.hosting ? 'YES' : 'No'} red={result.geo?.hosting} />
              </div>
            </div>
            <div className="panel mb-0">
              <div className="panel-header"><span className="panel-title">Abuse Report</span></div>
              <div className="panel-body">
                {result.abuse?.error ? (
                  <div className="text-primary-hi text-xs italic">{result.abuse.error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4 border-b border-border/40">
                      <div className="text-[10px] text-grey-dim tracking-[2px] mb-1">CONFIDENCE SCORE</div>
                      <div className={`text-3xl font-bold ${result.abuse?.score > 50 ? 'text-primary-hi shadow-red-900/40 drop-shadow-md' : result.abuse?.score > 10 ? 'text-orange-600' : 'text-grey'}`}>
                        {result.abuse?.score ?? 0}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <KvField k="Total Reports" v={result.abuse?.reports} />
                      <KvField k="Last Reported" v={result.abuse?.last} />
                      <KvField k="Usage Type" v={result.abuse?.type} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
