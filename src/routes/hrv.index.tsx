import { createFileRoute } from "@tanstack/react-router";
import HRVOverview from "@/components/casper/HRVOverview";

export const Route = createFileRoute("/hrv/")({
  head: () => ({
    meta: [
      { title: "HRV Building // Casper" },
      { name: "description", content: "Per-zone heart rate variability and presence detection across the building." },
      { property: "og:title", content: "HRV Building // Casper" },
      { property: "og:description", content: "Per-zone heart rate variability and presence detection across the building." },
    ],
  }),
  component: HRVOverview,
});
