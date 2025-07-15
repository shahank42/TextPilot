import { useWhatsappEvent } from "@/hooks/use-whatsapp-event";
import { qrCodeAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import QRCode from "react-qr-code";
import { ChatLayout } from "./chat-layout";
import Header from "../header";

export const ClientLayout = ({
  clientId,
  showQR,
}: {
  clientId: string;
  showQR: boolean;
}) => {
  const { whatsappConnected } = useWhatsappEvent(clientId);

  const [qrCode] = useAtom(qrCodeAtom);

  return (
    <>
      {whatsappConnected ? (
        <ChatLayout clientId={clientId} />
      ) : (
        <div className="flex flex-col h-full">
          <Header />
          <span>You're client {clientId}</span>
          <div className="flex w-full h-full justify-center items-center">
            {qrCode !== null ? <QRCode value={qrCode} /> : <>Loading QR...</>}
          </div>
        </div>
      )}
    </>
  );
};
