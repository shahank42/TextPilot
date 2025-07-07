import { SidebarChats } from "@/components/sidebars/sidebar-chats";
import { TextPilot } from "@/components/sidebars/textpilot";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatsList } from "./whatsapp-chats-list";
import { useWhatsappMessages } from "../-hooks/use-whatsapp-messages";
import { WhatsappChat } from "./whatsapp-chat";

export function WhatsappChatLayout() {
  const { chats, selectedChat } = useWhatsappMessages();

  return (
    <SidebarProvider>
      <SidebarChats>
        <ChatsList chats={chats} />
      </SidebarChats>

      <SidebarInset>
        {selectedChat === null ? (
          <>No chat selected</>
        ) : (
          <WhatsappChat chat={selectedChat} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
