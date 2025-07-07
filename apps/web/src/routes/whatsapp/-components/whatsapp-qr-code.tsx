import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";

export function WhatsappQRCode() {
  const qrCodeQuery = useQuery(
    orpc.whatsapp.qrCodeSSE.experimental_liveOptions()
  );

  return (
    <div className="w-full flex justify-center h-full items-center">
      {qrCodeQuery.isPending ? (
        "Pending..."
      ) : qrCodeQuery.isError ? (
        "Error"
      ) : qrCodeQuery.data === null ? (
        "Pending..."
      ) : (
        <QRCode value={qrCodeQuery.data} />
      )}
    </div>
  );
}
