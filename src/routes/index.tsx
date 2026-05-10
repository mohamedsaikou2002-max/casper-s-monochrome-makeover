import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/casper/Dashboard";
import { useCasper } from "@/lib/casper-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard // Casper" },
      { name: "description", content: "Live system telemetry: CPU, memory, disk, and device identity." },
      { property: "og:title", content: "Dashboard // Casper" },
      { property: "og:description", content: "Live system telemetry: CPU, memory, disk, and device identity." },
    ],
  }),
  component: Page,
});

function Page() {
  const { monitorRunning } = useCasper();
  return <Dashboard monitorRunning={monitorRunning} />;
}
