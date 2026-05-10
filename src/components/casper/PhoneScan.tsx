import { useState } from 'react';
import { api } from '@/lib/api';

export default function PhoneScan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showDeepScan, setShowDeepScan] = useState(false);

  const scanPhone = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.scanPhone();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deepScan = async () => {
    setLoading(true);
    try {
      const data = await api.phoneDeepScan('/sdcard/Download');
      alert(`Deep Scan Verdict: ${data.ai_verdict.analysis || data.ai_verdict.error}`);
    } catch (e) {}
    setLoading(false);
  };

  const vtCheck = async () => {
    if (!result?.packages) return;
    setLoading(true);
    try {
      const data = await api.phoneVtCheck(result.packages);
      setResult({ ...result, vt_results: data.results });
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="panel animate-in fade-in duration-300">
      <div className="panel-header">
        <span className="panel-title uppercase tracking-[3px]">Android Phone Scanner</span>
        <span className="panel-badge uppercase tracking-wider">ADB + VirusTotal</span>
      </div>
      <div className="panel-body">
        <div className="text-[10px] text-grey-dim mb-4 leading-relaxed uppercase tracking-widest">
          <span className="text-primary-hi font-bold">Setup:</span> Enable Developer Options → USB Debugging on Android. Connect via USB then click SCAN.
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={scanPhone} disabled={loading} className="btn">
            {loading ? 'BUSY...' : '▶ Scan Connected Phone'}
          </button>
          {result?.connected && (
            <>
              <button 
                onClick={deepScan} 
                className="btn border-orange-600 text-orange-600 hover:bg-orange-600/10 text-[9px]"
                title="AI-powered Deep Scan with LM Studio"
              >
                Achilles Deep Scan
              </button>
              <button onClick={vtCheck} className="btn text-[9px]">VT Check Top Apps</button>
            </>
          )}
        </div>

        {loading && <div className="text-grey-dim text-[11px] tracking-widest mb-4"><span className="spin mr-2">◈</span> Accessing device via ADB...</div>}
        {error && <div className="text-primary-hi text-[11px] mb-4">⚠ {error}</div>}

        {result?.connected && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="panel mb-0">
                <div className="panel-header"><span className="panel-title">Device Info</span></div>
                <div className="panel-body space-y-1 text-[11px]">
                  <div className="flex justify-between border-b border-border py-1"><span className="text-grey-dim">MODEL</span><span className="text-white">{result.model}</span></div>
                  <div className="flex justify-between border-b border-border py-1"><span className="text-grey-dim">BRAND</span><span className="text-white">{result.brand}</span></div>
                  <div className="flex justify-between border-b border-border py-1"><span className="text-grey-dim">ANDROID</span><span className="text-white">{result.android}</span></div>
                  <div className="flex justify-between py-1"><span className="text-grey-dim">SERIAL</span><span className="text-grey">{result.serial}</span></div>
                </div>
              </div>
              <div className="panel mb-0">
                <div className="panel-header"><span className="panel-title">Permission Audit</span></div>
                <div className="panel-body">
                  {result.dangerous_permissions?.length > 0 ? (
                    <div className="space-y-2">
                      {result.dangerous_permissions.map((p: any, i: number) => (
                        <div key={i} className="text-[10px]">
                          <div className="text-orange-600 font-bold mb-1">{p.pkg}</div>
                          <div className="flex flex-wrap gap-1">
                            {p.perms.map((perm: string) => (
                              <span key={perm} className="bg-red-900/10 border border-red-900/30 text-red-600 px-1 py-0.5 text-[8px]">{perm}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-grey-dim text-[10px] italic">No high-risk permissions found in top apps.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Installed Packages (3rd Party)</span>
                <span className="panel-badge">{result.package_count} Packages</span>
              </div>
              <div className="panel-body p-0 overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
                <table className="conn-table w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase tracking-widest text-primary">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Package</th>
                      <th className="text-left p-2">VT Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {result.packages.map((pkg: string, i: number) => {
                      const vtResult = result.vt_results?.find((r: any) => r.pkg === pkg);
                      return (
                        <tr key={pkg} className="border-b border-black/10 hover:bg-primary-dim/5">
                          <td className="p-2 text-grey-dim">{i + 1}</td>
                          <td className="p-2 text-white">{pkg}</td>
                          <td className="p-2 uppercase tracking-tighter">
                            {vtResult ? (
                              <span className={vtResult.vt?.verdict === 'MALICIOUS' ? 'text-primary-hi font-bold animate-pulse' : 'text-grey'}>
                                {vtResult.vt?.verdict || 'Ready'}
                              </span>
                            ) : (
                              <span className="text-grey-dim opacity-50">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
