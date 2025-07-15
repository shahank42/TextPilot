import { ClientLayout } from "@/components/layout/client-layout";
import useLocalStorage from "@/hooks/use-local-storage";
import { postClientsConnectMutation } from "@/lib/api-client/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react"; // Import useRef

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [localClientId, setLocalClientId, isLocalStorageReady] =
    useLocalStorage<string | null>("textpilot-client-id", null);

  const connectMutation = useMutation({
    mutationFn: postClientsConnectMutation().mutationFn,
  });

  const mutationTriggered = useRef(false); // Ref to track if mutation has been triggered

  useEffect(() => {
    if (
      isLocalStorageReady &&
      localClientId === null &&
      !connectMutation.isPending &&
      !connectMutation.isSuccess &&
      !mutationTriggered.current // Only trigger if not already triggered
    ) {
      connectMutation.mutate({});
      mutationTriggered.current = true; // Mark as triggered
    }
  }, [isLocalStorageReady, localClientId, connectMutation]);

  // Determine the clientId to use for ClientLayout
  const clientIdToUse = localClientId || connectMutation.data;

  // Determine if QR code should be shown
  const showQR = localClientId === null && connectMutation.isSuccess;

  if (!isLocalStorageReady) {
    return <div className="text-center">Loading application...</div>;
  }

  if (!clientIdToUse) {
    // Display loading or error state while waiting for a client ID
    return (
      <div className="text-center">
        {connectMutation.isPending ? (
          "awaiting client id"
        ) : connectMutation.isError ? (
          "failed to connect to server"
        ) : (
          "Initializing client..." // This state should be brief or not reached if logic is sound
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <ClientLayout clientId={clientIdToUse} showQR={showQR} />
    </div>
  );
}
