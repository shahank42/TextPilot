import { useQuery } from "@tanstack/react-query";
import { Reply, X } from "lucide-react";
import type WAWebJS from "whatsapp-web.js";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export function WhatsappReplyQuote({
	message,
	onClose,
}: {
	message: WAWebJS.Message;
	onClose: () => void;
}) {
	const contactQuery = useQuery(
		orpc.whatsapp.getContact.queryOptions({
			input: { id: message.from },
		})
	);

	const displayName = contactQuery.isPending
		? "Loading..."
		: contactQuery.isError
			? "Error"
			: contactQuery.data.isBusiness
				? contactQuery.data.verifiedName
				: // TODO: display name for non-business users
					contactQuery.data.pushname;

	return (
		<div className="flex gap-3">
			<div
				className="mb-2 flex w-full cursor-pointer items-center gap-4 rounded-lg border-accent border-l-4 bg-card p-3 py-4 text-card-foreground shadow-md hover:bg-card/80"
				onClick={(e) => {
					console.log(message);
				}}
			>
				<div className="flex h-full flex-col justify-center">
					<Reply className="size-6 text-accent-foreground/70" />
				</div>

				<div className="flex w-full flex-col overflow-hidden">
					<p className="text-accent-foreground/90 text-xs">{displayName}</p>
					<p className="line-clamp-1 max-w-full text-muted-foreground text-sm">
						{message.body}
					</p>
				</div>
				<Button
					className="ml-4 cursor-pointer text-muted-foreground hover:text-destructive"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					size="icon"
					variant="ghost"
				>
					<X className="size-4" />
				</Button>
			</div>
		</div>
	);
}
