import { createFileRoute } from "@tanstack/react-router";
import IPScan from "@/components/casper/IPScan";

export const Route = createFileRoute("/ip-scan")({
  head: () => ({
    meta: [
      { title: "IP Scan // Casper" },
      { name: "description", content: "Port and service scan for any IPv4 target." },
      { property: "og:title", content: "IP Scan // Casper" },
      { property: "og:description", content: "Port and service scan for any IPv4 target." },
    ],
  }),
  component: IPScan,
});
