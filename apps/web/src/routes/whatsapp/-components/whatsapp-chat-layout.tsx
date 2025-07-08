import { ModeToggle } from "@/components/mode-toggle";
import { SidebarChats } from "@/components/sidebars/sidebar-chats";
import { TextPilot } from "@/components/sidebars/textpilot";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useWhatsappMessages } from "../-hooks/use-whatsapp-messages";
import { WhatsappChat } from "./whatsapp-chat";
import { ChatsList } from "./whatsapp-chats-list";

export function WhatsappChatLayout() {
	const { chats, selectedChat } = useWhatsappMessages();

	return (
		<SidebarProvider>
			<SidebarChats>
				<ChatsList chats={chats} />
			</SidebarChats>

			<SidebarInset>
				{selectedChat === null ? (
					<div className="flex w-full items-center justify-end gap-2 p-4">
						<ModeToggle />
					</div>
				) : (
					<WhatsappChat chat={selectedChat} />
				)}
			</SidebarInset>
		</SidebarProvider>
	);
}
