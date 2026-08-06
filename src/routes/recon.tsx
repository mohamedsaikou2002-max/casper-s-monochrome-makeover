import { createFileRoute } from "@tanstack/react-router";
import Recon from "@/components/casper/Recon";

export const Route = createFileRoute("/recon")({
  head: () => ({
    meta: [
      { title: "Recon // Casper" },
      { name: "description", content: "Two-model AI recon pipeline: fingerprint, vuln match, prioritized breakdown." },
      { property: "og:title", content: "Recon // Casper" },
      { property: "og:description", content: "Two-model AI recon pipeline: fingerprint, vuln match, prioritized breakdown." },
    ],
  }),
  component: Recon,
});