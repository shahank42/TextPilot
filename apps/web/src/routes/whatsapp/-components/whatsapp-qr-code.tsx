import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { orpc } from "@/utils/orpc";

export function WhatsappQRCode() {
	const qrCodeQuery = useQuery(
		orpc.whatsapp.qrCodeSSE.experimental_liveOptions()
	);

	return (
		<div className="flex h-full w-full items-center justify-center">
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
