import { SidebarChats } from "@/components/sidebars/sidebar-chats";
import { TextPilot } from "@/components/sidebars/textpilot";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatsList } from "./whatsapp-chats-list";
import { useWhatsappMessages } from "../-hooks/use-whatsapp-messages";
import { WhatsappChat } from "./whatsapp-chat";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import { ModeToggle } from "@/components/mode-toggle";

export function WhatsappChatLayout() {
  const { chats, selectedChat } = useWhatsappMessages();

  return (
    <SidebarProvider>
      <SidebarChats>
        <ChatsList chats={chats} />
      </SidebarChats>

      <SidebarInset>
        {selectedChat === null ? (
          <div className="flex items-center justify-end p-4 w-full gap-2">
            <ModeToggle />
          </div>
        ) : (
          <WhatsappChat chat={selectedChat} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
