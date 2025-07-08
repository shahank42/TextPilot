import { ModeToggle } from "@/components/mode-toggle";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
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

  return (
    <ExpandableChatHeader className="">
      <div className="flex items-center justify-between w-full h-[36px] gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-xl">
            {contactQuery.isPending
              ? "Loading contact info..."
              : contactQuery.isError
                ? "Error loading contact info"
                : contactQuery.data.isBusiness
                  ? contactQuery.data.verifiedName
                  : // TODO: display name for non-business users
                    contactQuery.data.pushname}
          </span>
          <span className="text-xs">
            {contactQuery.isPending
              ? "Loading contact info..."
              : contactQuery.isError
                ? "Error loading contact info"
                : contactQuery.data.number}
          </span>
        </div>

        <ModeToggle />
      </div>
    </ExpandableChatHeader>
  );
}
