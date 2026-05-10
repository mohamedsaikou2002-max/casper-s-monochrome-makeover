import { createFileRoute } from "@tanstack/react-router";
import Wireless from "@/components/casper/Wireless";

export const Route = createFileRoute("/wireless")({
  head: () => ({
    meta: [
      { title: "Wireless // Casper" },
      { name: "description", content: "Bluetooth and Wi-Fi reconnaissance." },
      { property: "og:title", content: "Wireless // Casper" },
      { property: "og:description", content: "Bluetooth and Wi-Fi reconnaissance." },
    ],
  }),
  component: Wireless,
});
