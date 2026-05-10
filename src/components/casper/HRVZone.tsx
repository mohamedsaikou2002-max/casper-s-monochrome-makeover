import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { ChevronLeft, Heart, Wind, Gauge } from "lucide-react";
import { api } from "@/lib/api";

type Reading = {
  ts?: number;
  hr_bpm?: number;
  rmssd_ms?: number;
  sdnn_ms?: number;
  resp_rpm?: number;
  stress?: string;
  alert?: boolean;
  rr_ms?: number[];
};

export default function HRVZone({ zoneId }: { zoneId: string }) {
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [z, h] = await Promise.all([
          api.hrvZone(zoneId).catch(() => null),
          api.hrvZoneHistory(zoneId).catch(() => ({ history: [] })),
        ]);
        if (!mounted) return;
        setLatest(z);
        setHistory((h?.history || []).map((r: Reading, i: number) => ({ ...r, idx: i })));
        setErr(null);
      } catch (e: any) {
        if (mounted) setErr(e.message || "offline");
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => { mounted = false; clearInterval(t); };
  }, [zoneId]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Link to="/hrv" className="btn inline-flex items-center gap-2 text-[10px]">
          <ChevronLeft className="w-3 h-3" /> All Zones
        </Link>
        <div className="text-[10px] tracking-[3px] text-grey-dim uppercase">Zone · <span className="text-white">{zoneId}</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric icon={<Heart className="w-4 h-4" />} label="Heart Rate" value={latest?.hr_bpm ?? "—"} unit="bpm" alert={latest?.alert} />
        <Metric icon={<Gauge className="w-4 h-4" />} label="RMSSD" value={latest?.rmssd_ms ?? "—"} unit="ms" />
        <Metric icon={<Wind className="w-4 h-4" />} label="Respiration" value={latest?.resp_rpm ?? "—"} unit="rpm" />
      </div>

      <Chart title="HEART RATE (BPM)" data={history} dataKey="hr_bpm" refLow={45} refHigh={110} />
      <Chart title="HRV · RMSSD (MS)" data={history} dataKey="rmssd_ms" refLow={20} />
      <Chart title="RESPIRATION (RPM)" data={history} dataKey="resp_rpm" />

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">RR Intervals (Last 20)</span>
          <span className="panel-badge uppercase">{latest?.stress ?? "—"}</span>
        </div>
        <div className="panel-body">
          <div className="flex flex-wrap gap-1.5">
            {(latest?.rr_ms ?? []).map((v, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 border border-border text-grey">{Math.round(v)}</span>
            ))}
            {!latest?.rr_ms?.length && <span className="text-grey-dim text-[10px] uppercase tracking-widest">No data {err ? `· ${err}` : ""}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, unit, alert }: { icon: React.ReactNode; label: string; value: any; unit: string; alert?: boolean }) {
  return (
    <div className="panel">
      <div className="panel-header"><span className="panel-title flex items-center gap-2">{icon}{label}</span></div>
      <div className="panel-body">
        <div className={`stat-value ${alert ? "animate-pulse" : ""}`}>
          {value} <span className="text-[12px] text-grey-dim font-normal tracking-widest uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function Chart({ title, data, dataKey, refLow, refHigh }: { title: string; data: any[]; dataKey: string; refLow?: number; refHigh?: number }) {
  return (
    <div className="panel">
      <div className="panel-header"><span className="panel-title">{title}</span></div>
      <div className="panel-body" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, bottom: 0, left: -10 }}>
            <XAxis dataKey="idx" tick={{ fill: "#666", fontSize: 9 }} stroke="#222" />
            <YAxis tick={{ fill: "#666", fontSize: 9 }} stroke="#222" />
            <Tooltip contentStyle={{ background: "#000", border: "1px solid #333", fontSize: 11 }} labelStyle={{ color: "#fff" }} />
            {refLow !== undefined && <ReferenceLine y={refLow} stroke="#555" strokeDasharray="3 3" />}
            {refHigh !== undefined && <ReferenceLine y={refHigh} stroke="#555" strokeDasharray="3 3" />}
            <Line type="monotone" dataKey={dataKey} stroke="#fff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
