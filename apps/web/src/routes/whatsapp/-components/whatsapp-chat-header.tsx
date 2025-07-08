import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import { getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

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
      <div className="flex items-center justify-between w-full h-[36px] gap-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage src={pfpQuery.data} alt="Kelly King" />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            {/* TODO: do something about the ephemerally online indicator */}
            <span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
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
