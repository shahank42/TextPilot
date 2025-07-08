import { selectedChatIdAtom } from "@/lib/atoms";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { ChatsListItem } from "../-hooks/use-whatsapp-messages";

export function WhatsappChatsListItem({ message }: { message: ChatsListItem }) {
  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatIdAtom);

  const contactQuery = useQuery(
    orpc.whatsapp.getContact.queryOptions({
      input: { id: message.id },
    })
  );

  return (
    <div
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:cursor-pointer flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight overflow-x-hidden last:border-b-0"
      onClick={() => setSelectedChatId(message.id)}
    >
      <div className="flex w-full items-center gap-2">
        <span>
          {contactQuery.isPending
            ? "Loading contact info..."
            : contactQuery.isError
              ? "Error loading contact info"
              : contactQuery.data.isBusiness
                ? contactQuery.data.verifiedName
                : // TODO: display name for non-business users
                  contactQuery.data.pushname}
        </span>
        <span className="ml-auto text-xs">{message.timestamp}</span>
      </div>
      {/* <span className="font-medium">{mail.subject}</span> */}
      <span className="line-clamp-2 wrap-anywhere text-xs whitespace-pre-wrap">
        {message.lastMessageBody}
      </span>
    </div>
  );
}
