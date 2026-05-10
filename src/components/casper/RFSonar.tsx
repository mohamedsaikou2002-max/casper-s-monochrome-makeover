import { useEffect, useRef, useState } from "react";
import { Radio, Wifi } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";

type Zone = {
  zone: string;
  presence?: boolean;
  hr_bpm?: number;
  resp_rpm?: number;
  alert?: boolean;
};

const FREQ_BANDS = [
  { band: "2.4 GHz", note: "Wi-Fi CSI · primary HRV carrier" },
  { band: "5 GHz",   note: "Wi-Fi CSI · high-resolution scatter" },
  { band: "6 GHz",   note: "Wi-Fi 6E mesh sweep" },
  { band: "60 GHz",  note: "mmWave fine-grained motion" },
];

export default function RFSonar() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samples = useRef<number[]>([]);

  // Pull live zone snapshots
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const z = await api.hrvZones();
        if (!mounted) return;
        setZones(Object.values(z || {}));
        setErr(null);
      } catch (e: any) {
        if (mounted) setErr(e.message || "offline");
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  // Animated sonar waveform synthesized from active zones
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = canvasRef.current;
      if (!c) { raf = requestAnimationFrame(draw); return; }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const w = c.width = c.clientWidth * window.devicePixelRatio;
      const h = c.height = c.clientHeight * window.devicePixelRatio;

      // Synthesize a CSI-like amplitude: sum of zone HR sinusoids + noise
      const t = performance.now() / 1000;
      const present = zones.filter((z) => z.presence);
      let v = 0;
      if (present.length === 0) {
        v = (Math.random() - 0.5) * 8;
      } else {
        for (const z of present) {
          const hz = (z.hr_bpm ?? 60) / 60;
          v += Math.sin(t * 2 * Math.PI * hz) * 18;
          const rhz = (z.resp_rpm ?? 14) / 60;
          v += Math.sin(t * 2 * Math.PI * rhz) * 30;
        }
        v += (Math.random() - 0.5) * 6;
      }
      samples.current.push(v);
      if (samples.current.length > 600) samples.current.shift();

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = (h / 8) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Waveform
      ctx.strokeStyle = present.length === 0 ? "#444" : "#fff";
      ctx.lineWidth = 1.5 * window.devicePixelRatio;
      ctx.beginPath();
      const mid = h / 2;
      const step = w / Math.max(samples.current.length, 1);
      samples.current.forEach((s, i) => {
        const x = i * step;
        const y = mid - s * (h / 200);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [zones]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title flex items-center gap-2"><Radio className="w-4 h-4" /> RF Sonar · CSI Waveform</span>
          <span className="panel-badge uppercase">{err ? `OFFLINE · ${err}` : `${zones.length} nodes`}</span>
        </div>
        <div className="panel-body">
          <canvas ref={canvasRef} style={{ width: "100%", height: 240, display: "block" }} />
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[10px] uppercase tracking-widest text-grey-dim">
            <span>Carrier · 2.4/5 GHz</span>
            <span>Sample Window · 600</span>
            <span>Mode · CSI Amplitude</span>
            <span className="text-white">Live</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title flex items-center gap-2"><Wifi className="w-4 h-4" /> Frequency Bands</span>
        </div>
        <div className="panel-body grid grid-cols-1 md:grid-cols-2 gap-3">
          {FREQ_BANDS.map((b) => (
            <div key={b.band} className="border border-border p-3">
              <div className="text-white text-[14px] tracking-[2px]">{b.band}</div>
              <div className="text-grey-dim text-[10px] uppercase tracking-widest mt-1">{b.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Zone Returns</span>
          <span className="panel-badge">{zones.filter((z) => z.presence).length} occupied</span>
        </div>
        <div className="panel-body p-0 overflow-x-auto">
          <table className="conn-table w-full">
            <thead>
              <tr><th>Zone</th><th>Presence</th><th>HR</th><th>Resp</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr><td colSpan={6} className="text-center p-6 text-grey-dim uppercase tracking-widest">No CSI returns</td></tr>
              )}
              {zones.map((z) => (
                <tr key={z.zone}>
                  <td className="text-white">{z.zone}</td>
                  <td className="text-grey">{z.presence ? "YES" : "—"}</td>
                  <td className="text-grey">{z.hr_bpm ?? "—"}</td>
                  <td className="text-grey">{z.resp_rpm ?? "—"}</td>
                  <td>
                    <span className={`text-[9px] px-1.5 py-0.5 border uppercase tracking-wider ${z.alert ? "border-white text-white animate-pulse" : "border-border text-grey-dim"}`}>
                      {z.alert ? "ALERT" : "OK"}
                    </span>
                  </td>
                  <td>
                    <Link to="/hrv/$zoneId" params={{ zoneId: z.zone }} className="text-[10px] tracking-widest text-white hover:underline">OPEN →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
