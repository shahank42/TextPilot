import { messageMapAtom, qrCodeAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import useLocalStorage from "./use-local-storage";
import type { ModelsMessage } from "@/lib/api-client";
import { useImmerAtom } from "jotai-immer";

type WhatsappEventType = "qr_code" | "status" | "buffer" | "message"; // TODO: add more types
type WhatsappStatusEventTypes = "connected" | "disconnected" | "logged_in";

interface WhatsappEventMessage<T> {
  clientId: string;
  event: WhatsappEventType;
  data: T;
}

export const useWhatsappEvent = (clientId: string) => {
  const [, setLocalClientId] = useLocalStorage<string | null>(
    "textpilot-client-id",
    null
  );
  const [, setQrCode] = useAtom(qrCodeAtom);
  const [messageMap, setMessageMap] = useImmerAtom(messageMapAtom);

  const [whatsappConnected, setWhatsappConnected] = useState(false);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const eventSource = new EventSource(
      `http://localhost:8082/clients/${clientId}/events`
    );

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    eventSource.addEventListener("buffer", (_event) => {
      // Placeholder for buffer event handling
    });

    eventSource.addEventListener("qr_code", (event) => {
      const message: WhatsappEventMessage<string> = JSON.parse(event.data);
      setQrCode(message.data);
    });

    eventSource.addEventListener("message", (event) => {
      const { data: messageData }: WhatsappEventMessage<ModelsMessage> =
        JSON.parse(event.data);
      console.log("Received message:", messageData);

      if (messageMap.has(messageData.chatJID as string)) {
        setMessageMap((draft) => {
          draft.get(messageData.chatJID as string)!.push(messageData);
        });
      } else {
        setMessageMap((draft) => {
          draft.set(messageData.chatJID as string, [messageData]);
        });
      }
    });

    eventSource.addEventListener("status", (event) => {
      const message: WhatsappEventMessage<WhatsappStatusEventTypes> =
        JSON.parse(event.data);
      const { data: status } = message;

      switch (status) {
        case "connected":
        case "logged_in":
          setWhatsappConnected(true);
          setLocalClientId(clientId);
          break;
        case "disconnected":
          setWhatsappConnected(false);
          setLocalClientId(null);
          break;
      }
    });

    return () => {
      eventSource.close();
    };
  }, [clientId, setLocalClientId, setQrCode]);

  return { whatsappConnected };
};
