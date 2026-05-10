import { createFileRoute } from "@tanstack/react-router";
import TerminalLog from "@/components/casper/TerminalLog";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Terminal Log // Casper" },
      { name: "description", content: "Live system event stream." },
      { property: "og:title", content: "Terminal Log // Casper" },
      { property: "og:description", content: "Live system event stream." },
    ],
  }),
  component: TerminalLog,
});
