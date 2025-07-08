import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { selectedChatIdAtom } from "@/lib/atoms";
import { getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import type { ChatsListItem } from "../-hooks/use-whatsapp-messages";

export function WhatsappChatsListItem({ message }: { message: ChatsListItem }) {
	const [selectedChatId, setSelectedChatId] = useAtom(selectedChatIdAtom);

	const contactQuery = useQuery(
		orpc.whatsapp.getContact.queryOptions({
			input: { id: message.id },
		})
	);

	const pfpQuery = useQuery(
		orpc.whatsapp.getPfp.queryOptions({
			input: { id: message.id },
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
		<div
			className="flex flex-row items-center gap-4 overflow-x-hidden border-b p-4 text-sm leading-tight last:border-b-0 hover:cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			onClick={() => setSelectedChatId(message.id)}
		>
			<div className="relative">
				<Avatar className="size-10">
					<AvatarImage alt={displayName} src={pfpQuery.data} />
					<AvatarFallback>{getInitials(displayName)}</AvatarFallback>
				</Avatar>
				<span className="-end-0.5 -bottom-0.5 absolute size-3 rounded-full border-2 border-background bg-emerald-500">
					<span className="sr-only">Online</span>
				</span>
			</div>
			<div className="flex w-full flex-col gap-1 overflow-hidden">
				<div className="flex w-full items-center gap-2">
					<span className="truncate font-semibold">{displayName}</span>
					<span className="ml-auto text-muted-foreground text-xs">
						{message.timestamp}
					</span>
				</div>
				<span className="wrap-anywhere line-clamp-2 whitespace-pre-wrap text-muted-foreground text-xs">
					{message.lastMessageBody}
				</span>
			</div>
		</div>
	);
}
