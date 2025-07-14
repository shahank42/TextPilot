import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { CornerDownLeft } from "lucide-react";
import { ChatMessageList } from "../ui/chat/chat-message-list";
import { ChatInput } from "../ui/chat/chat-input";
import { useState } from "react";
import { messageMapAtom } from "@/lib/atoms";
import { WhatsappChatMessageBubble } from "./chat-message-bubble";
import { WhatsappChatHeader } from "./chat-header";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getClientsByClientIdChatsByChatIdOptions,
  postClientsByClientIdMessagesSendMutation,
} from "@/lib/api-client/@tanstack/react-query.gen";
import { type ModelsSendMessageRequest } from "@/lib/api-client";
import { useImmerAtom } from "jotai-immer";

export const Chat = ({
  clientId,
  chatId,
}: {
  clientId: string;
  chatId: string;
}) => {
  const [messagesMap, setMessagesMap] = useImmerAtom(messageMapAtom);

  const chat = messagesMap.get(chatId)!;

  const [inputValue, setInputValue] = useState("");
  const replyingTo = false;

  const contactQuery = useQuery({
    ...getClientsByClientIdChatsByChatIdOptions({
      path: { clientID: clientId, chatID: chatId as string },
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const sendMessageMutation = useMutation({
    mutationFn: postClientsByClientIdMessagesSendMutation().mutationFn,
    onSettled: () => {
      setInputValue("");
    },
  });

  return (
    <div className="flex h-svh w-full flex-col">
      <WhatsappChatHeader clientId={clientId} chatId={chatId} />

      <ResizablePanelGroup
        className="h-[calc(100dvh-69px)]"
        direction="horizontal"
      >
        <ResizablePanel className="flex h-[calc(100dvh-69px)] flex-col">
          <ScrollArea
            className={cn({
              "h-[calc(100dvh-69px-143px+8px)]": !replyingTo,
              "h-[calc(100dvh-69px-32px-147px-69px+32px)] ": replyingTo,
            })}
          >
            <ChatMessageList>
              {chat.map((message, index) => {
                const previousMessage = chat[index - 1];
                const nextMessage = chat[index + 1];

                const isFirstInGroup =
                  !previousMessage ||
                  previousMessage.senderJID !== message.senderJID;
                const isLastInGroup =
                  !nextMessage || nextMessage.senderJID !== message.senderJID;

                return (
                  <WhatsappChatMessageBubble
                    key={message.id}
                    clientId={clientId}
                    message={message}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onClick={() => {
                      // if (replyingTo && replyingTo.id === message.id)
                      //   setReplyingTo(null);
                      // else
                      // setReplyingTo(message);
                    }}
                    isGroup={contactQuery.data?.isGroup}
                  />
                );
              })}
            </ChatMessageList>
          </ScrollArea>

          <div
            className={cn("flex w-full flex-col border-t px-4 pt-4 pb-4", {
              "h-[calc(69px+147px-73px-8px)]": !replyingTo,
              "h-[calc(69px+147px+32px-32px)] justify-between": replyingTo,
            })}
          >
            {/* {replyingTo && (
                <WhatsappReplyQuote
                  message={replyingTo.message.conversation}
                  onClose={() => setReplyingTo(null)}
                />
              )} */}
            <form
              className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
              onSubmit={async (e) => {
                e.preventDefault();

                if (!(inputValue.trim() && chatId)) return;

                const messageToSend: ModelsSendMessageRequest = {
                  jid: chatId,
                  text: inputValue,
                };

                const sentMessage = await sendMessageMutation.mutateAsync({
                  path: { clientID: clientId },
                  body: messageToSend,
                });

                if (messagesMap.has(sentMessage.chatJID as string)) {
                  setMessagesMap((draft) => {
                    draft.get(sentMessage.chatJID as string)!.push(sentMessage);
                  });
                } else {
                  setMessagesMap((draft) => {
                    draft.set(sentMessage.chatJID as string, [sentMessage]);
                  });
                }

                console.log("SENT", sentMessage);
              }}
            >
              <ChatInput
                className="min-h-12 resize-none rounded-lg border-0 bg-background p-3 shadow-none focus-visible:ring-0"
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                value={inputValue}
              />
              <div className="flex items-center p-3 pt-2">
                <Button className="ml-auto gap-1.5" size="sm">
                  Send Message
                  <CornerDownLeft className="size-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={36}>{/* <TextPilot /> */}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
