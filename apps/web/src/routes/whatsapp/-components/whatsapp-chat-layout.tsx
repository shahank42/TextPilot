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
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex flex-col">
                <span className="font-medium">No chat selected</span>
                <span className="text-xs">
                  active who knows how many mins ago
                </span>
              </div>

              <ModeToggle />
            </div>
          </div>
        ) : (
          <WhatsappChat chat={selectedChat} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
