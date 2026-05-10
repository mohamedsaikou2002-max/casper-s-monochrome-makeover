import { createFileRoute } from "@tanstack/react-router";
import HRVZone from "@/components/casper/HRVZone";

export const Route = createFileRoute("/hrv/$zoneId")({
  head: ({ params }) => ({
    meta: [
      { title: `HRV ${params.zoneId} // Casper` },
      { name: "description", content: `Live HRV, RR intervals, and respiration for zone ${params.zoneId}.` },
      { property: "og:title", content: `HRV ${params.zoneId} // Casper` },
      { property: "og:description", content: `Live HRV, RR intervals, and respiration for zone ${params.zoneId}.` },
    ],
  }),
  component: Page,
});

function Page() {
  const { zoneId } = Route.useParams();
  return <HRVZone zoneId={zoneId} />;
}
