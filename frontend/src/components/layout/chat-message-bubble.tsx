import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import type { ModelsMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function WhatsappChatMessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  onClick,
  isGroup = false,
}: {
  message: ModelsMessage;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isGroup?: boolean;
}) {
  return (
    <ChatBubble
      onClick={onClick}
      variant={message.isFromMe ? "sent" : "received"}
      className={cn({ "-mt-5": !isFirstInGroup })}
    >
      {/* {isGroup ? (
        <ChatBubbleAvatar
          fallback={getInitials(displayName)}
          src={pfpQuery.data}
          className={cn({ invisible: !isLastInGroup })}
        />
      ) : (
        <></>
      )} */}

      <ChatBubbleMessage
        className={cn("cursor-pointer w-fit max-w-[38rem] py-1 text-left", {
          "rounded-tl-none": !isFirstInGroup && !message.isFromMe,
          "rounded-tr-none": !isFirstInGroup && message.isFromMe,
        })}
        variant={message.isFromMe ? "sent" : "received"}
      >
        {/* {message.quotedMessage.stanzaID !== "" ? (
          <div
            className={cn("mb-2 border-l-2 pl-2 ml-0.5", {
              "border-secondary-foreground/50 dark:border-accent-foreground/60":
                message.isFromMe,
              "border-accent-foreground/60 dark:border-accent/70":
                !message.isFromMe,
            })}
          >
            <p
              className={cn("border-accent text-xs", {
                "text-secondary-foreground/90": !message.isFromMe,
                "text-primary-foreground": message.isFromMe,
              })}
            >
              idk who dis from
            </p>
            <p
              className={cn("line-clamp-2 text-sm", {
                "text-muted-foreground": !message.isFromMe,
                "text-secondary-foreground/75 dark:text-secondary":
                  message.isFromMe,
              })}
            >
              {message.quotedMessage.text}
            </p>
          </div>
        ) : (
          <></>
        )} */}

        <span className="text-base leading-tight">{message.text}</span>
      </ChatBubbleMessage>
    </ChatBubble>
  );
}
