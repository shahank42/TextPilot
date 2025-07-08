import { createFileRoute } from "@tanstack/react-router";
import { WhatsappChatLayout } from "./whatsapp/-components/whatsapp-chat-layout";

export const Route = createFileRoute("/chat")({
	component: RouteComponent,
});

function RouteComponent() {
	return <WhatsappChatLayout />;
}
