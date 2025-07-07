import { useAtom } from "jotai";
import { selectedChatIdAtom } from "@/lib/atoms";

export interface ChatsListItem {
  id: string;
  displayName: string;
  lastMessageBody: string;
  timestamp: number;
}

export function ChatsList({ chats }: { chats: ChatsListItem[] }) {
  // const [messages, setMessages] = useAtom(messagesAtom);
  const [_, setSelectedChatId] = useAtom(selectedChatIdAtom);

  return (
    <>
      {chats.map((message) => (
        <div
          key={message.id}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:cursor-pointer flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight overflow-x-hidden last:border-b-0"
          onClick={() => setSelectedChatId(message.id)}
        >
          <div className="flex w-full items-center gap-2">
            <span>{message.displayName}</span>
            <span className="ml-auto text-xs">{message.timestamp}</span>
          </div>
          {/* <span className="font-medium">{mail.subject}</span> */}
          <span className="line-clamp-2 wrap-anywhere text-xs whitespace-pre-wrap">
            {message.lastMessageBody}
          </span>
        </div>
      ))}
    </>
  );
}
