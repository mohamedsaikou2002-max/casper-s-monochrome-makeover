import { createFileRoute } from "@tanstack/react-router";
import RFSonar from "@/components/casper/RFSonar";

export const Route = createFileRoute("/rf-sonar")({
  head: () => ({
    meta: [
      { title: "RF Sonar // Casper" },
      { name: "description", content: "Wi-Fi CSI based RF sonar — presence and motion across 2.4/5/6/60 GHz bands." },
      { property: "og:title", content: "RF Sonar // Casper" },
      { property: "og:description", content: "Wi-Fi CSI based RF sonar — presence and motion across frequency bands." },
    ],
  }),
  component: RFSonar,
});
