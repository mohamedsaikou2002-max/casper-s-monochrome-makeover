import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Ghost, Menu, LayoutDashboard, Network, Activity, Wifi,
  Search, FileSearch, Smartphone, Bug, Terminal, MessageSquare,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCasper } from "@/lib/casper-context";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/connections", label: "Connections", icon: Network },
  { to: "/traffic", label: "Live Traffic", icon: Activity },
  { to: "/wireless", label: "Wireless", icon: Wifi },
  { to: "/ip-scan", label: "IP Scan", icon: Search },
  { to: "/file-scan", label: "File Scan", icon: FileSearch },
  { to: "/phone-scan", label: "Phone Scan", icon: Smartphone },
  { to: "/malware-lib", label: "Malware Lib", icon: Bug },
  { to: "/terminal", label: "Terminal Log", icon: Terminal },
  { to: "/aichat", label: "Casper AI", icon: MessageSquare },
] as const;

export default function CasperLayout({ children }: { children: React.ReactNode }) {
  const { monitorRunning, apiStatus, toggleMonitor } = useCasper();
  const [clock, setClock] = useState("");
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toUTCString().slice(17, 25) + " UTC"), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <video id="bg-video" autoPlay muted loop playsInline>
        <source src="/casper/bg.mp4" type="video/mp4" />
      </video>
      <div id="scanlines" />
      <div id="vignette" />

      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open navigation"
                  className="p-2 border border-border hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5 text-white" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-black border-r border-border w-72 p-0">
                <SheetHeader className="px-5 py-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <Ghost className="w-6 h-6" />
                    <span className="casper-logo text-lg">CASPER</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="py-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = path === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-5 py-3 text-[12px] tracking-[2px] uppercase border-l-2 transition-colors ${
                          active
                            ? "border-white bg-white/10 text-white"
                            : "border-transparent text-grey hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2">
              <Ghost className="w-6 h-6 text-white" />
              <span className="casper-logo">CASPER</span>
              <span className="casper-logo-sub hidden sm:inline">// node 47</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center gap-1.5 text-[11px] tracking-widest text-grey">
              <div className={`status-dot ${apiStatus === "ONLINE" ? "" : "grey"}`} />
              <span>{apiStatus}</span>
            </div>
            <button
              onClick={toggleMonitor}
              className={`btn flex items-center gap-2 ${!monitorRunning ? "opacity-60" : ""}`}
            >
              <span className="text-sm leading-none">{monitorRunning ? "■" : "▶"}</span>
              <span className="hidden sm:inline">{monitorRunning ? "STOP" : "START"}</span>
            </button>
            <div className="text-[11px] tracking-widest text-grey-dim min-w-[90px] text-right hidden md:block">
              {clock}
            </div>
          </div>
        </header>

        {!monitorRunning && (
          <div className="bg-white/5 border-b border-border text-center py-1.5 text-[10px] tracking-[4px] text-white animate-pulse uppercase">
            ⚠ Monitor Paused — Live Data Collection Halted ⚠
          </div>
        )}

        <main className="flex-1 p-5 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
