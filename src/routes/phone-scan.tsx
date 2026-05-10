import { createFileRoute } from "@tanstack/react-router";
import PhoneScan from "@/components/casper/PhoneScan";

export const Route = createFileRoute("/phone-scan")({
  head: () => ({
    meta: [
      { title: "Phone Scan // Casper" },
      { name: "description", content: "Mobile device package and threat scan." },
      { property: "og:title", content: "Phone Scan // Casper" },
      { property: "og:description", content: "Mobile device package and threat scan." },
    ],
  }),
  component: PhoneScan,
});
