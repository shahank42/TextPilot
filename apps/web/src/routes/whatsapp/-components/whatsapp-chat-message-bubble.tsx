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
  isFirstInGroup,
  isLastInGroup,
  onClick,
}: {
  message: WAWebJS.Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
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
      className={cn({ "-mt-5": !isFirstInGroup })}
    >
      <ChatBubbleAvatar
        fallback={getInitials(displayName)}
        src={pfpQuery.data}
        className={cn({ invisible: !isLastInGroup })}
      />

      <ChatBubbleMessage
        className={cn("cursor-pointer", {
          "rounded-tl-none": !isFirstInGroup && !message.fromMe,
          "rounded-tr-none": !isFirstInGroup && message.fromMe,
        })}
        variant={message.fromMe ? "sent" : "received"}
      >
        {message.hasQuotedMsg ? (
          quotedMessageQuery.isPending ? (
            <>Loading quoted message...</>
          ) : quotedMessageQuery.isError ? (
            <>Error loading quoted message</>
          ) : (
            <div
              className={cn("mb-2 border-l-2 pl-2 ml-0.5", {
                "border-secondary-foreground/50 dark:border-accent-foreground/60":
                  message.fromMe,
                "border-accent-foreground/60 dark:border-accent/70":
                  !message.fromMe,
              })}
            >
              <p
                className={cn("border-accent text-xs", {
                  "text-secondary-foreground/90": !message.fromMe,
                  "text-primary-foreground": message.fromMe,
                })}
              >
                {quotedMessageQuery.data.fromMe
                  ? "You"
                  : quotedMessageDisplayName}
              </p>
              <p
                className={cn("line-clamp-2 text-sm", {
                  "text-muted-foreground": !message.fromMe,
                  "text-secondary-foreground/75 dark:text-secondary":
                    message.fromMe,
                })}
              >
                {quotedMessageQuery.data.body}
              </p>
            </div>
          )
        ) : (
          <></>
        )}
        <span className="text-sm leading-tight">{message.body}</span>
      </ChatBubbleMessage>
    </ChatBubble>
  );
}
