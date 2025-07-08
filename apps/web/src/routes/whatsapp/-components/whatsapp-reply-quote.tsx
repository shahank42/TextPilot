import type WAWebJS from "whatsapp-web.js";
import { Button } from "@/components/ui/button";
import { Reply, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export function WhatsappReplyQuote({
  message,
  onClose,
}: {
  message: WAWebJS.Message;
  onClose: () => void;
}) {
  const contactQuery = useQuery(
    orpc.whatsapp.getContact.queryOptions({
      input: { id: message.from },
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
    <div className="flex gap-3">
      <div
        onClick={(e) => {
          console.log(message);
        }}
        className="flex w-full items-center gap-4 p-3 py-4 mb-2 bg-card hover:bg-card/80 text-card-foreground border-l-4 border-accent rounded-lg shadow-md cursor-pointer"
      >
        <div className="flex flex-col h-full justify-center">
          <Reply className="size-6 text-accent-foreground/70" />
        </div>

        <div className="flex flex-col w-full overflow-hidden">
          <p className="text-xs text-accent-foreground/90">{displayName}</p>
          <p className="text-sm text-muted-foreground line-clamp-1 max-w-full">
            {message.body}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-muted-foreground hover:text-destructive cursor-pointer ml-4"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
