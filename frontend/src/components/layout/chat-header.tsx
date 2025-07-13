import { useQuery } from "@tanstack/react-query";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import { getInitials } from "@/lib/utils";
import { getClientsByClientIdChatsByChatIdOptions } from "@/lib/api-client/@tanstack/react-query.gen";

export function WhatsappChatHeader({
  clientId,
  chatId,
}: {
  clientId: string;
  chatId: string;
}) {
  const contactQuery = useQuery({
    ...getClientsByClientIdChatsByChatIdOptions({
      path: { clientID: clientId, chatID: chatId },
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const displayName = contactQuery.data?.name;

  return (
    // <ExpandableChatHeader className="">
      <div className="flex w-full items-center justify-between gap-2 border-b py-3 px-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-8">
              <AvatarImage alt={displayName} src={contactQuery.data?.pfp || ""} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            {/* TODO: do something about the ephemerally online indicator */}
            <span className="-end-0.5 -bottom-0.5 absolute size-3 rounded-full border-2 border-background bg-emerald-500">
              <span className="sr-only">Online</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-medium text-xl">
              {displayName}
            </span>
            {/* <span className="text-xs">
              {contactQuery.isPending
                ? "Loading phone number..."
                : contactQuery.isError
                  ? "Error loading phone number"
                  : contactQuery.data.isGroup ? "Group" : "Chat"}
            </span> */}
          </div>
        </div>

        {/* <ModeToggle /> */}
      </div>
    // </ExpandableChatHeader>
  );
}
