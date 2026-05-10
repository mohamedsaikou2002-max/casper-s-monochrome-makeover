import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { Activity, AlertTriangle, Users } from "lucide-react";

type Zone = {
  zone: string;
  presence?: boolean;
  hr_bpm?: number;
  rmssd_ms?: number;
  resp_rpm?: number;
  stress?: string;
  alert?: boolean;
};

type Building = {
  ts: number;
  zone_count: number;
  occupied_count?: number;
  alert_count: number;
  alerts: Zone[];
  zones: Record<string, Zone>;
};

export default function HRVOverview() {
  const [data, setData] = useState<Building | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await api.hrvBuilding();
        if (mounted) { setData(d); setErr(null); }
      } catch (e: any) {
        if (mounted) setErr(e.message || "offline");
      }
    };
    load();
    const t = setInterval(load, 2500);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const zones = data ? Object.values(data.zones) : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Zones Online" value={data?.zone_count ?? "—"} icon={<Activity className="w-4 h-4" />} />
        <Stat title="Occupied" value={data?.occupied_count ?? "—"} icon={<Users className="w-4 h-4" />} />
        <Stat title="Active Alerts" value={data?.alert_count ?? "—"} icon={<AlertTriangle className="w-4 h-4" />} crit={(data?.alert_count ?? 0) > 0} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">HRV Zone Grid</span>
          <span className="panel-badge">{err ? `OFFLINE · ${err}` : `${zones.length} zones`}</span>
        </div>
        <div className="panel-body p-0 overflow-x-auto">
          <table className="conn-table w-full">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Presence</th>
                <th>HR (bpm)</th>
                <th>RMSSD (ms)</th>
                <th>Resp (rpm)</th>
                <th>Stress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr><td colSpan={7} className="text-center p-6 text-grey-dim uppercase tracking-widest">Awaiting zone telemetry</td></tr>
              )}
              {zones.map((z) => (
                <tr key={z.zone}>
                  <td>
                    <Link to="/hrv/$zoneId" params={{ zoneId: z.zone }} className="text-white underline-offset-4 hover:underline">
                      {z.zone}
                    </Link>
                  </td>
                  <td className="text-grey-dim">{z.presence ? "YES" : "—"}</td>
                  <td className="text-white">{z.hr_bpm ?? "—"}</td>
                  <td className="text-grey">{z.rmssd_ms ?? "—"}</td>
                  <td className="text-grey">{z.resp_rpm ?? "—"}</td>
                  <td className="uppercase text-[10px] tracking-widest text-white">{z.stress ?? "—"}</td>
                  <td>
                    <span className={`text-[9px] px-1.5 py-0.5 border uppercase tracking-wider ${z.alert ? "border-white text-white animate-pulse" : "border-border text-grey-dim"}`}>
                      {z.alert ? "ALERT" : "OK"}
                    </span>
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

function Stat({ title, value, icon, crit }: { title: string; value: any; icon: React.ReactNode; crit?: boolean }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">{icon}{title}</span>
      </div>
      <div className="panel-body">
        <div className={`stat-value ${crit ? "animate-pulse" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
