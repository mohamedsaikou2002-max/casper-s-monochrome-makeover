import { useState } from 'react';
import { api } from '@/lib/api';

export default function Wireless() {
  const [btDevices, setBtDevices] = useState<any[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<any[]>([]);
  const [loadingBt, setLoadingBt] = useState(false);
  const [loadingWifi, setLoadingWifi] = useState(false);
  const [wifiInfo, setWifiInfo] = useState<any>(null);

  const scanBluetooth = async () => {
    setLoadingBt(true);
    try {
      const data = await api.scanBluetooth();
      setBtDevices(data.devices || []);
    } catch (e) {}
    setLoadingBt(false);
  };

  const scanWifi = async () => {
    setLoadingWifi(true);
    try {
      const data = await api.scanWifi();
      setWifiNetworks(data.networks || []);
      setWifiInfo(data);
    } catch (e) {}
    setLoadingWifi(false);
  };

  const lookupMac = async (mac: string) => {
    try {
      const data = await api.lookupMac(mac);
      alert(`MAC: ${mac}\nVendor: ${d.vendor}`);
    } catch (e) {}
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Bluetooth Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title uppercase tracking-[3px]">Bluetooth Scan</span>
          <div className="flex items-center gap-3">
            <span className="panel-badge uppercase text-grey-dim text-[9px]">{btDevices.length} Devices</span>
            <button 
              onClick={scanBluetooth} 
              disabled={loadingBt}
              className="btn text-[9px] px-3 py-1 uppercase tracking-widest"
            >
              ▶ Scan
            </button>
          </div>
        </div>
        <div className="panel-body">
          {loadingBt && <div className="text-grey-dim text-[11px] tracking-widest mb-3 flex items-center"><span className="spin mr-2">◈</span> Scanning...</div>}
          <div className="text-[10px] text-grey-dim mb-3">⚠ Requires hcitool (Linux) / system_profiler (Mac) / pnputil (Windows). May need sudo.</div>
          <div className="overflow-x-auto">
            <table className="conn-table w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Mac</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Name</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Type</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Vendor</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">RSSI</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {btDevices.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-6 text-grey-dim uppercase tracking-widest">Click scan</td></tr>
                ) : (
                  btDevices.map((d, i) => (
                    <tr key={i} className="border-b border-black/20 hover:bg-primary-dim/10 transition-colors">
                      <td className="p-2 text-grey">{d.mac}</td>
                      <td className="p-2 text-white">{d.name || 'Unknown'}</td>
                      <td className="p-2">{d.type}</td>
                      <td className="p-2 text-grey-dim">{d.vendor || '—'}</td>
                      <td className="p-2 whitespace-nowrap">{d.rssi != null ? `${d.rssi} dBm` : '—'}</td>
                      <td className="p-2">
                        <button onClick={() => lookupMac(d.mac)} className="btn text-[8px] px-2 py-0.5 tracking-tighter">Lookup</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Wifi Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title uppercase tracking-[3px]">Wifi Scan</span>
          <div className="flex items-center gap-3">
            <span className="panel-badge uppercase text-grey-dim text-[9px]">{wifiNetworks.length} Networks</span>
            <button 
              onClick={scanWifi} 
              disabled={loadingWifi}
              className="btn text-[9px] px-3 py-1 uppercase tracking-widest"
            >
              ▶ Scan
            </button>
          </div>
        </div>
        <div className="panel-body">
          {loadingWifi && <div className="text-grey-dim text-[11px] tracking-widest mb-3 flex items-center"><span className="spin mr-2">◈</span> Scanning...</div>}
          {wifiInfo?.error && (
            <div className="p-4 mb-4 border border-red-900/50 bg-red-900/10">
              <div className="text-primary-hi text-xs">⚠ {wifiInfo.error}</div>
              {wifiInfo.fix && <div className="text-orange-600 text-[10px] mt-1.5 uppercase tracking-wider">Fix: {wifiInfo.fix}</div>}
            </div>
          )}
          <div className="text-[10px] text-grey-dim mb-3">⚠ Requires nmcli/iwlist (Linux) / airport (Mac) / netsh (Windows). May need sudo.</div>
          <div className="overflow-x-auto">
            <table className="conn-table w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">SSID</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">BSSID</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Signal</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Channel</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Encryption</th>
                  <th className="text-left p-2 text-primary uppercase text-[9px] tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {wifiNetworks.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-6 text-grey-dim uppercase tracking-widest">Click scan</td></tr>
                ) : (
                  wifiNetworks.map((n, i) => {
                    const sig = parseInt(n.signal) || 0;
                    const scClass = sig > -60 ? 'text-grey-dim' : sig > -75 ? 'text-orange-600' : 'text-primary-hi';
                    const enc = (n.enc || '').toUpperCase();
                    const eClass = enc === 'NONE' || enc === 'OFF' ? 'text-primary-hi' : 'text-grey-dim';
                    return (
                      <tr key={i} className="border-b border-black/20 hover:bg-primary-dim/10 transition-colors">
                        <td className="p-2 text-white font-medium">{n.ssid || '(hidden)'}</td>
                        <td className="p-2 text-grey">{n.mac || '—'}</td>
                        <td className={`p-2 font-bold ${scClass}`}>{n.signal}</td>
                        <td className="p-2">{n.channel}</td>
                        <td className={`p-2 uppercase font-medium ${eClass}`}>{n.enc || '—'}</td>
                        <td className="p-2">
                          <button onClick={() => lookupMac(n.mac)} className="btn text-[8px] px-2 py-0.5 tracking-tighter">Lookup</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
