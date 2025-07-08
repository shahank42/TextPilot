import { useQuery } from "@tanstack/react-query";
import type WAWebJS from "whatsapp-web.js";
import {
	ChatBubble,
	ChatBubbleAvatar,
	ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function WhatsappChatMessageBubble({
	message,
}: {
	message: WAWebJS.Message;
}) {
	const contactQuery = useQuery(
		orpc.whatsapp.getContact.queryOptions({
			input: { id: message.from },
		})
	);

	const pfpQuery = useQuery(
		orpc.whatsapp.getPfp.queryOptions({
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
		<ChatBubble variant={message.fromMe ? "sent" : "received"}>
			<ChatBubbleAvatar
				fallback={getInitials(displayName)}
				src={pfpQuery.data}
			/>
			<ChatBubbleMessage variant={message.fromMe ? "sent" : "received"}>
				{message.body}
			</ChatBubbleMessage>
		</ChatBubble>
	);
}
