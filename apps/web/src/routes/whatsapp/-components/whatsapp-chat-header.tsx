import { useQuery } from "@tanstack/react-query";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import { getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function WhatsappChatHeader({
	selectedChatId,
}: {
	selectedChatId: string;
}) {
	const contactQuery = useQuery(
		orpc.whatsapp.getContact.queryOptions({
			input: { id: selectedChatId },
		})
	);

	const pfpQuery = useQuery(
		orpc.whatsapp.getPfp.queryOptions({
			input: { id: selectedChatId },
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
		<ExpandableChatHeader className="">
			<div className="flex h-[36px] w-full items-center justify-between gap-2">
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="size-10">
							<AvatarImage alt="Kelly King" src={pfpQuery.data} />
							<AvatarFallback>{getInitials(displayName)}</AvatarFallback>
						</Avatar>

						{/* TODO: do something about the ephemerally online indicator */}
						<span className="-end-0.5 -bottom-0.5 absolute size-3 rounded-full border-2 border-background bg-emerald-500">
							<span className="sr-only">Online</span>
						</span>
					</div>

					<div className="flex flex-col">
						<span className="font-medium text-xl">{displayName}</span>
						<span className="text-xs">
							{contactQuery.isPending
								? "Loading phone number..."
								: contactQuery.isError
									? "Error loading phone number"
									: contactQuery.data.number}
						</span>
					</div>
				</div>

				<ModeToggle />
			</div>
		</ExpandableChatHeader>
	);
}
