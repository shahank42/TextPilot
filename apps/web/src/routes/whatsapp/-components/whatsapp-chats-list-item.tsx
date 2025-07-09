import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { selectedChatIdAtom, unreadCountsAtom } from "@/lib/atoms";
import { cn, getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import type { ChatsListItem } from "../-hooks/use-whatsapp-messages";

export function WhatsappChatsListItem({ message }: { message: ChatsListItem }) {
	const [, setSelectedChatId] = useAtom(selectedChatIdAtom);
	const [unreadCounts] = useAtom(unreadCountsAtom);

	const unreadCount = unreadCounts[message.id] || 0;
	const isUnread = unreadCount > 0;

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
				<div className="flex items-center justify-between">
					<span
						className={cn(
							"wrap-anywhere line-clamp-2 whitespace-pre-wrap text-muted-foreground text-xs",
							{
								"font-bold text-foreground": isUnread,
							}
						)}
					>
						{message.lastMessageBody}
					</span>
					{isUnread && (
						<span className="ml-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
							{unreadCount}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
