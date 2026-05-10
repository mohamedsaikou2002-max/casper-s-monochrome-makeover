import { createFileRoute } from "@tanstack/react-router";
import Connections from "@/components/casper/Connections";
import { useCasper } from "@/lib/casper-context";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Connections // Casper" },
      { name: "description", content: "Active network connections by process and remote endpoint." },
      { property: "og:title", content: "Connections // Casper" },
      { property: "og:description", content: "Active network connections by process and remote endpoint." },
    ],
  }),
  component: Page,
});

function Page() {
  const { monitorRunning } = useCasper();
  return <Connections monitorRunning={monitorRunning} />;
}
