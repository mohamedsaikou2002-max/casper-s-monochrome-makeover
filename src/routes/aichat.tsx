import { createFileRoute } from "@tanstack/react-router";
import AIChat from "@/components/casper/AIChat";

export const Route = createFileRoute("/aichat")({
  head: () => ({
    meta: [
      { title: "Casper AI // Casper" },
      { name: "description", content: "Conversational threat analysis assistant." },
      { property: "og:title", content: "Casper AI // Casper" },
      { property: "og:description", content: "Conversational threat analysis assistant." },
    ],
  }),
  component: AIChat,
});
