import { useQuery } from "@tanstack/react-query";
import {
  SidebarInset,
  SidebarMenuButton,
  SidebarProvider,
} from "../ui/sidebar";
import { ChatsSidebar } from "./chat-sidebar";
import { getClientsByClientIdChatsByChatIdOptions } from "@/lib/api-client/@tanstack/react-query.gen";
import { useLocalChats, type ChatItem } from "@/hooks/use-whatsapp-local-chats";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Chat } from "./chat";
import { useAtom } from "jotai";
import { selectedChatIdAtom } from "@/lib/atoms";

export const ChatLayout = ({ clientId }: { clientId: string }) => {
  // const chatsQuery = useQuery({
  //   ...getClientsByClientIdChatsOptions({ path: { clientID: clientId } }),
  // });

  const chats = useLocalChats();

  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatIdAtom);

  return (
    <SidebarProvider>
      <ChatsSidebar>
        {chats.map((chat) => (
          <ChatsListItem key={chat.id} clientId={clientId} item={chat} />
        ))}
      </ChatsSidebar>

      <SidebarInset>
        {selectedChatId !== null ? (
          <Chat clientId={clientId} chatId={selectedChatId} />
        ) : (
          <></>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};

function ChatsListItem({
  clientId,
  item,
}: {
  clientId: string;
  item: ChatItem;
}) {
  const [, setSelectedChatId] = useAtom(selectedChatIdAtom);

  const contactQuery = useQuery({
    ...getClientsByClientIdChatsByChatIdOptions({
      path: { clientID: clientId, chatID: item.id },
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const displayName = contactQuery.data?.name;

  return (
    <SidebarMenuButton
      // className="flex flex-row items-center gap-4 overflow-x-hidden p-4 text-sm leading-tight hover:cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      className="py-9 px-4 cursor-pointer"
      onClick={() => setSelectedChatId(item.id)}
    >
      <div className="relative">
        <Avatar className="size-8">
          <AvatarImage alt={displayName} src={contactQuery.data?.pfp || ""} />
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
            {item.timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between text-left">
          <span
            className={cn(
              "wrap-anywhere line-clamp-2 whitespace-pre-wrap text-muted-foreground text-xs"
              // {
              //   "font-bold text-foreground": isUnread,
              // }
            )}
          >
            {item.lastMessageBody}
          </span>
        </div>
      </div>
    </SidebarMenuButton>
  );
}
