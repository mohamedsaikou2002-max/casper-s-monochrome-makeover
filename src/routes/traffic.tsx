import { createFileRoute } from "@tanstack/react-router";
import LiveTraffic from "@/components/casper/LiveTraffic";

export const Route = createFileRoute("/traffic")({
  head: () => ({
    meta: [
      { title: "Live Traffic // Casper" },
      { name: "description", content: "Live packet capture and protocol breakdown." },
      { property: "og:title", content: "Live Traffic // Casper" },
      { property: "og:description", content: "Live packet capture and protocol breakdown." },
    ],
  }),
  component: LiveTraffic,
});
