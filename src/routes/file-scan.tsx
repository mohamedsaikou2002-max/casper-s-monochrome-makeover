import { createFileRoute } from "@tanstack/react-router";
import FileScan from "@/components/casper/FileScan";

export const Route = createFileRoute("/file-scan")({
  head: () => ({
    meta: [
      { title: "File Scan // Casper" },
      { name: "description", content: "Hash and reputation analysis on uploaded files." },
      { property: "og:title", content: "File Scan // Casper" },
      { property: "og:description", content: "Hash and reputation analysis on uploaded files." },
    ],
  }),
  component: FileScan,
});
