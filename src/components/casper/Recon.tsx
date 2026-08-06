import { useState } from "react";
import { api } from "@/lib/api";
import { Radar, Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

type Suggestion = {
  id: string;
  cve?: string;
  title?: string;
  severity?: string;
  source?: string;
  reference?: string;
};

type ReconResult = {
  job_id: string;
  target: string;
  status: string;
  raw?: Record<string, string>;
  structured?: unknown;
  vuln_matches?: Array<Record<string, unknown>>;
  analysis?: string;
  exploit_suggestions?: Suggestion[];
};

export default function Recon() {
  const [target, setTarget] = useState("");
  const [fast, setFast] = useState(true);
  const [scope, setScope] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ReconResult | null>(null);
  const [approver, setApprover] = useState("");
  const [instructions, setInstructions] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    setErr(null); setInstructions(null); setResult(null);
    if (!target.trim()) { setErr("Target required."); return; }
    if (!scope) { setErr("Confirm scope authorization before scanning."); return; }
    setLoading(true);
    try {
      const data = await api.recon(target.trim(), fast);
      setResult(data);
    } catch (e: any) {
      setErr(e?.message ?? "Recon failed.");
    } finally { setLoading(false); }
  };

  const approveAndFetch = async (s: Suggestion) => {
    if (!result) return;
    if (!approver.trim()) { setErr("Enter approver name first."); return; }
    setErr(null);
    try {
      await api.reconApprove(result.job_id, s.id, approver.trim());
      const inst = await api.reconManualInstructions(result.job_id, s.id);
      setInstructions(inst);
    } catch (e: any) {
      setErr(e?.message ?? "Approval failed.");
    }
  };

  const sevClass = (sev?: string) => {
    const s = (sev ?? "").toLowerCase();
    if (s.includes("crit")) return "text-white border-white";
    if (s.includes("high")) return "text-white/90 border-white/70";
    if (s.includes("med")) return "text-grey border-grey";
    return "text-grey-dim border-grey-dim";
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title uppercase tracking-[3px] flex items-center gap-2">
            <Radar className="w-4 h-4" /> Recon // Target Intake
          </span>
        </div>
        <div className="panel-body p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="example.com or 10.0.0.5"
              className="flex-1 bg-black border border-border px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
            <button onClick={run} disabled={loading} className="btn flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {loading ? "SCANNING…" : "RUN RECON"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] tracking-widest uppercase text-grey">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} />
              Fast scan
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={scope} onChange={(e) => setScope(e.target.checked)} />
              I confirm target is in-scope & authorized
            </label>
          </div>
          {err && (
            <div className="flex items-center gap-2 text-[11px] text-white border border-white/50 px-3 py-2">
              <AlertTriangle className="w-4 h-4" /> {err}
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title uppercase tracking-[3px]">Analyst Breakdown</span>
              <span className="text-[10px] text-grey-dim tracking-widest">JOB {result.job_id.slice(0, 8)}</span>
            </div>
            <div className="panel-body p-4">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-grey">
                {result.analysis || "(no analysis returned)"}
              </pre>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title uppercase tracking-[3px]">Vuln Matches ({result.vuln_matches?.length ?? 0})</span>
              </div>
              <div className="panel-body p-4 max-h-[420px] overflow-y-auto custom-scrollbar">
                {(result.vuln_matches ?? []).length === 0 && (
                  <div className="text-grey-dim italic text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> No template matches.
                  </div>
                )}
                <div className="space-y-2">
                  {(result.vuln_matches ?? []).map((v, i) => (
                    <div key={i} className="border border-border p-3 text-[12px] font-mono text-grey">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title uppercase tracking-[3px] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Exploit Suggestions
                </span>
              </div>
              <div className="panel-body p-4 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
                <input
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder="Approver name (required for manual instructions)"
                  className="w-full bg-black border border-border px-3 py-2 text-xs text-white outline-none focus:border-white"
                />
                {(result.exploit_suggestions ?? []).length === 0 && (
                  <div className="text-grey-dim italic text-sm">No suggestions.</div>
                )}
                {(result.exploit_suggestions ?? []).map((s) => (
                  <div key={s.id} className={`border p-3 ${sevClass(s.severity)}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] tracking-widest uppercase">{s.severity ?? "unknown"}</span>
                      <span className="text-[10px] text-grey-dim">{s.cve ?? s.source ?? ""}</span>
                    </div>
                    <div className="text-sm text-white mb-2">{s.title ?? s.id}</div>
                    <div className="flex items-center justify-between gap-2">
                      {s.reference && (
                        <a href={s.reference} target="_blank" rel="noreferrer"
                          className="text-[10px] tracking-widest uppercase text-grey hover:text-white">
                          reference ↗
                        </a>
                      )}
                      <button onClick={() => approveAndFetch(s)} className="btn text-[10px] px-2 py-1 tracking-widest">
                        APPROVE → INSTRUCTIONS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {instructions && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title uppercase tracking-[3px]">Manual Run Instructions</span>
              </div>
              <div className="panel-body p-4">
                <pre className="whitespace-pre-wrap font-mono text-[12px] text-grey">
                  {JSON.stringify(instructions, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title uppercase tracking-[3px]">Raw Tool Output</span>
            </div>
            <div className="panel-body p-4 space-y-3">
              {Object.entries(result.raw ?? {}).map(([tool, out]) => (
                <details key={tool} className="border border-border">
                  <summary className="px-3 py-2 text-[11px] tracking-widest uppercase text-grey cursor-pointer hover:text-white">
                    {tool}
                  </summary>
                  <pre className="p-3 bg-black text-[11px] font-mono text-grey-dim overflow-x-auto whitespace-pre-wrap">
                    {out}
                  </pre>
                </details>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}