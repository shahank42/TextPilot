import { useQuery } from "@tanstack/react-query";
import type WAWebJS from "whatsapp-web.js";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { cn, getInitials } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export function WhatsappChatMessageBubble({
  message,
  onClick,
}: {
  message: WAWebJS.Message;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  const contactQuery = useQuery(
    orpc.whatsapp.getContact.queryOptions({
      input: { id: message.from },
    })
  );

  const pfpQuery = useQuery(
    orpc.whatsapp.getPfp.queryOptions({
      input: { id: message.from },
    })
  );

  const quotedMessageQuery = useQuery(
    orpc.whatsapp.getQuotedMessage.queryOptions({
      input: { id: message.id._serialized! },
      enabled: message.hasQuotedMsg,
    })
  );

  const quotedMessageContactQuery = useQuery(
    orpc.whatsapp.getContact.queryOptions({
      input: { id: quotedMessageQuery.data?.from! },
      enabled: message.hasQuotedMsg,
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

  const quotedMessageDisplayName = quotedMessageContactQuery.isPending
    ? "Loading..."
    : quotedMessageContactQuery.isError
      ? "Error"
      : quotedMessageContactQuery.data.isBusiness
        ? quotedMessageContactQuery.data.verifiedName
        : // TODO: display name for non-business users
          quotedMessageContactQuery.data.pushname;

  return (
    <ChatBubble
      onClick={onClick}
      variant={message.fromMe ? "sent" : "received"}
    >
      <ChatBubbleAvatar
        fallback={getInitials(displayName)}
        src={pfpQuery.data}
      />
      <ChatBubbleMessage
        className="cursor-pointer"
        variant={message.fromMe ? "sent" : "received"}
      >
        {message.hasQuotedMsg ? (
          quotedMessageQuery.isPending ? (
            <>Loading quoted message...</>
          ) : quotedMessageQuery.isError ? (
            <>Error loading quoted message</>
          ) : (
            <div
              className={cn("mb-2 border-l-2 pl-2", {
                "border-accent/50": message.fromMe,
                "border-accent-foreground/70": !message.fromMe,
              })}
            >
              <p className="border-accent text-xs">
                {quotedMessageQuery.data.fromMe
                  ? "You"
                  : quotedMessageDisplayName}
              </p>
              <p className="line-clamp-2 text-sm">
                {quotedMessageQuery.data.body}
              </p>
            </div>
          )
        ) : (
          <></>
        )}
        {message.body}
      </ChatBubbleMessage>
    </ChatBubble>
  );
}
