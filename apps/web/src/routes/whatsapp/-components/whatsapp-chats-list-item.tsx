import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { selectedChatIdAtom } from "@/lib/atoms";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { ChatsListItem } from "../-hooks/use-whatsapp-messages";
import { getInitials } from "@/lib/utils";

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
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:cursor-pointer flex flex-row items-center gap-4 border-b p-4 text-sm leading-tight overflow-x-hidden last:border-b-0"
      onClick={() => setSelectedChatId(message.id)}
    >
      <div className="relative">
        <Avatar className="size-10">
          <AvatarImage src={pfpQuery.data} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
          <span className="sr-only">Online</span>
        </span>
      </div>
      <div className="flex w-full flex-col gap-1 overflow-hidden">
        <div className="flex w-full items-center gap-2">
          <span className="truncate font-semibold">{displayName}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        </div>
        <span className="line-clamp-2 wrap-anywhere whitespace-pre-wrap text-xs text-muted-foreground">
          {message.lastMessageBody}
        </span>
      </div>
    </div>
  );
}
