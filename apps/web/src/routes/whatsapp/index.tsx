import { createFileRoute } from "@tanstack/react-router";
import { WhatsappQRCode } from "./-components/whatsapp-qr-code";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { WhatsappChatLayout } from "./-components/whatsapp-chat-layout";

export const Route = createFileRoute("/whatsapp/")({
  component: RouteComponent,
});

function RouteComponent() {
  const isReadyQuery = useQuery(
    orpc.whatsapp.isReadySSE.experimental_liveOptions()
  );

  return (
    <div className="w-full flex justify-center h-full items-center">
      {isReadyQuery.isPending ? (
        "getting client ready status"
      ) : isReadyQuery.isError ? (
        "error getting client ready status"
      ) : !isReadyQuery.data ? (
        <WhatsappQRCode />
      ) : (
        <WhatsappChatLayout />
      )}
    </div>
  );
}
