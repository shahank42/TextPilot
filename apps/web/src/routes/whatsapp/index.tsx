import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { WhatsappChatLayout } from "./-components/whatsapp-chat-layout";
import { WhatsappQRCode } from "./-components/whatsapp-qr-code";

export const Route = createFileRoute("/whatsapp/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isReadyQuery = useQuery(
		orpc.whatsapp.isReadySSE.experimental_liveOptions()
	);

	return (
		<div className="flex h-full w-full items-center justify-center">
			{isReadyQuery.isPending ? (
				"getting client ready status"
			) : isReadyQuery.isError ? (
				"error getting client ready status"
			) : isReadyQuery.data ? (
				<WhatsappChatLayout />
			) : (
				<WhatsappQRCode />
			)}
		</div>
	);
}
