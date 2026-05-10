import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Ctx = {
  monitorRunning: boolean;
  setMonitorRunning: (b: boolean) => void;
  apiStatus: "ONLINE" | "OFFLINE" | "CONNECTING";
  toggleMonitor: () => Promise<void>;
};

const CasperCtx = createContext<Ctx | null>(null);

export function CasperProvider({ children }: { children: React.ReactNode }) {
  const [monitorRunning, setMonitorRunning] = useState(true);
  const [apiStatus, setApiStatus] = useState<Ctx["apiStatus"]>("CONNECTING");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const data = await api.getHealth();
        if (!mounted) return;
        setApiStatus("ONLINE");
        setMonitorRunning(data.monitor === "running");
      } catch {
        if (mounted) setApiStatus("OFFLINE");
      }
    };
    check();
    const t = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const toggleMonitor = async () => {
    const action = monitorRunning ? "stop" : "start";
    try {
      const data = await api.controlMonitor(action);
      setMonitorRunning(data.monitor === "running");
    } catch (e) { console.error(e); }
  };

  return (
    <CasperCtx.Provider value={{ monitorRunning, setMonitorRunning, apiStatus, toggleMonitor }}>
      {children}
    </CasperCtx.Provider>
  );
}

export function useCasper() {
  const ctx = useContext(CasperCtx);
  if (!ctx) throw new Error("useCasper must be used within CasperProvider");
  return ctx;
}
