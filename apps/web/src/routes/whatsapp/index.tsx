import { createFileRoute } from "@tanstack/react-router";
import { WhatsappQRCode } from "./-components/whatsapp-qr-code";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { WhatsappClient } from "./-components/whatsapp-client";

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
        <WhatsappClient />
      )}
    </div>
  );
}
