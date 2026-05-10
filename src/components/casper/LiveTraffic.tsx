import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export default function LiveTraffic() {
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedIface, setSelectedIface] = useState('');
  const [useWsl, setUseWsl] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<any[]>([]);
  const [scapyOk, setScapyOk] = useState(false);
  const [packetIdx, setPacketIdx] = useState(0);
  const [pauseScroll, setPauseScroll] = useState(false);

  // Filters
  const [protoFilter, setProtoFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ifaces = await api.getInterfaces();
        setInterfaces(ifaces.interfaces || []);
        const health = await api.getHealth();
        setScapyOk(health.scapy);
      } catch (e) {}
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isCapturing) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getPackets(packetIdx);
        if (data.packets.length > 0) {
          setPackets(prev => [...prev, ...data.packets].slice(-500));
          setPacketIdx(data.total);
        }
      } catch (e) {}
    }, 800);
    return () => clearInterval(interval);
  }, [isCapturing, packetIdx]);

  useEffect(() => {
    if (!pauseScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [packets, pauseScroll]);

  const startCapture = async () => {
    try {
      const data = await api.startCapture(selectedIface || null, useWsl);
      if (data.status === 'started' || data.status === 'already_running') {
        setIsCapturing(true);
        setPackets([]);
        setPacketIdx(0);
      }
    } catch (e) {
      alert('Capture failed to start');
    }
  };

  const stopCapture = async () => {
    try {
      await api.stopCapture();
      setIsCapturing(false);
    } catch (e) {}
  };

  const filteredPackets = packets.filter(p => {
    if (protoFilter && p.proto !== protoFilter) return false;
    if (ipFilter && !p.src.toLowerCase().includes(ipFilter.toLowerCase()) && !p.dst.toLowerCase().includes(ipFilter.toLowerCase())) return false;
    if (serviceFilter && !p.service.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
    return true;
  });

  const protos = Array.from(new Set(packets.map(p => p.proto)));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title uppercase tracking-[3px]">Live Packet Capture</span>
          <div className="flex gap-2 items-center">
            <select 
              value={selectedIface} 
              onChange={e => setSelectedIface(e.target.value)}
              className="scan-input text-[10px] w-40 py-1"
            >
              <option value="">Default Interface</option>
              {interfaces.map(i => <option key={i.name} value={i.name}>{i.name} ({i.ip})</option>)}
            </select>
            <label className="text-[10px] text-grey-dim flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={useWsl} onChange={e => setUseWsl(e.target.checked)} /> WSL
            </label>
            {!isCapturing ? (
              <button onClick={startCapture} className="btn text-[10px] px-3 py-1">▶ Start</button>
            ) : (
              <button onClick={stopCapture} className="btn border-primary-hi text-primary-hi text-[10px] px-3 py-1">■ Stop</button>
            )}
            <button onClick={() => {setPackets([]); setPacketIdx(0);}} className="btn text-[9px] px-2 py-1 opacity-60">Clear</button>
          </div>
        </div>
        <div className="panel-body">
          <div className="flex gap-6 flex-wrap mb-3">
            <div className="text-[11px]"><span className="text-grey-dim font-bold tracking-widest mr-2">STATUS</span> <span className={isCapturing ? 'text-primary-hi' : 'text-grey-dim'}>{isCapturing ? 'CAPTURING' : 'IDLE'}</span></div>
            <div className="text-[11px]"><span className="text-grey-dim font-bold tracking-widest mr-2">PACKETS</span> <span className="text-white">{packetIdx}</span></div>
            <div className="text-[11px]"><span className="text-grey-dim font-bold tracking-widest mr-2">SCAPY</span> <span className={scapyOk ? 'text-grey' : 'text-primary-hi'}>{scapyOk ? 'OK' : 'MISSING'}</span></div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {protos.map(pr => (
              <span key={pr} className="text-[10px]">
                <span className={`font-bold mr-1 uppercase ${pr === 'TCP' ? 'text-grey' : pr === 'UDP' ? 'text-orange-600' : 'text-primary-hi'}`}>{pr}</span>
                <span className="text-grey-dim">{packets.filter(p => p.proto === pr).length}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body py-2 flex flex-wrap gap-2 items-center">
          <span className="text-[9px] tracking-[2px] text-grey-dim mr-2 uppercase">Filter:</span>
          <select value={protoFilter} onChange={e => setProtoFilter(e.target.value)} className="scan-input text-[10px] py-1 w-32">
            <option value="">All Protos</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="DNS">DNS</option>
            <option value="ICMP">ICMP</option>
            <option value="ARP">ARP</option>
          </select>
          <input value={ipFilter} onChange={e => setIpFilter(e.target.value)} placeholder="Filter IP..." className="scan-input text-[10px] py-1 w-36" />
          <input value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} placeholder="Filter service..." className="scan-input text-[10px] py-1 w-36" />
          <label className="text-[10px] text-grey-dim flex items-center gap-1.5 cursor-pointer ml-auto">
            <input type="checkbox" checked={pauseScroll} onChange={e => setPauseScroll(e.target.checked)} /> Pause Scroll
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title uppercase tracking-[3px]">Packet Stream</span>
          <span className="panel-badge uppercase text-grey-dim text-[9px]">{filteredPackets.length} Shown</span>
        </div>
        <div className="panel-body p-0 overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar" ref={scrollRef}>
          <table className="conn-table w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-[9px]">
                <th className="text-left p-2 text-primary tracking-widest uppercase">Time</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Proto</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Source</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Destination</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Service</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Org</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Size</th>
                <th className="text-left p-2 text-primary tracking-widest uppercase">Info</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {filteredPackets.map((p, i) => (
                <tr key={i} className="border-b border-black/10 hover:bg-primary-dim/5">
                  <td className="p-2 text-grey-dim">{p.ts}</td>
                  <td className="p-2">
                    <span className={`font-bold uppercase ${p.proto === 'TCP' ? 'text-grey' : p.proto === 'UDP' ? 'text-orange-600' : 'text-primary-hi'}`}>
                      {p.proto}
                    </span>
                  </td>
                  <td className="p-2 text-grey whitespace-nowrap">{p.src}{p.sport ? `:${p.sport}` : ''}</td>
                  <td className="p-2 text-white whitespace-nowrap">{p.dst}{p.dport ? `:${p.dport}` : ''}</td>
                  <td className="p-2 text-orange-600">{p.service}</td>
                  <td className="p-2 text-grey-dim truncate max-w-[120px]" title={p.org}>{p.org || '—'}</td>
                  <td className="p-2 text-grey-dim">{p.size}B</td>
                  <td className="p-2 text-grey-dim truncate max-w-[200px]" title={p.info}>{p.info}</td>
                </tr>
              ))}
              {filteredPackets.length === 0 && (
                <tr><td colSpan={8} className="text-center p-8 text-grey-dim uppercase tracking-widest">No matching packets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
