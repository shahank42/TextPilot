import type { ChatsListItem } from "../-hooks/use-whatsapp-messages";
import { WhatsappChatsListItem } from "./whatsapp-chats-list-item";

// NOTE: this component might be redundant
export function ChatsList({ chats }: { chats: ChatsListItem[] }) {
	return (
		<>
			{chats.map((message) => (
				<WhatsappChatsListItem key={message.id} message={message} />
			))}
		</>
	);
}
