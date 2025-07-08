import { useAtom } from "jotai";
import { CornerDownLeft, Mic, Paperclip, X } from "lucide-react";
import { useState } from "react";
import { TextPilot } from "@/components/sidebars/textpilot";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { replyingToAtom } from "@/lib/atoms";
import { orpc } from "@/utils/orpc";
import type { SelectedChatType } from "../-hooks/use-whatsapp-messages";
import { WhatsappChatHeader } from "./whatsapp-chat-header";
import { WhatsappChatMessageBubble } from "./whatsapp-chat-message-bubble";

export function WhatsappChat({ chat }: { chat: SelectedChatType }) {
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useAtom(replyingToAtom);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(inputValue.trim() && chat.id)) return;

    if (replyingTo) {
      console.log("Replying to:", replyingTo);
    }

    console.log(`Sending to ${chat.id}: ${inputValue}`);
    const sentMessage = await orpc.whatsapp.sendMessage.call({
      to: chat.id,
      body: inputValue,
    });

    console.log(sentMessage);

    setInputValue("");
    setReplyingTo(null);
  };

  return (
    <>
      <div className="flex h-svh w-full flex-col">
        <WhatsappChatHeader selectedChatId={chat.id} />

        <ResizablePanelGroup
          className="h-[calc(100dvh-69px)]"
          direction="horizontal"
        >
          <ResizablePanel className="flex h-[calc(100dvh-69px)] flex-col">
            <ScrollArea className="h-[calc(100dvh-69px-147px)]">
              <ChatMessageList>
                {chat.messages.map((message) => (
                  <WhatsappChatMessageBubble
                    key={message.id._serialized}
                    message={message}
                    onDoubleClick={() => {
                      setReplyingTo(message);
                    }}
                  />
                ))}
              </ChatMessageList>
            </ScrollArea>

            <div className="w-full border-t px-7 py-5">
              {replyingTo && (
                <div className="flex items-center justify-between rounded-t-lg bg-secondary p-2">
                  <div>
                    <p className="font-bold text-sm">
                      Replying to {replyingTo.from}
                    </p>
                    <p className="truncate text-sm">{replyingTo.body}</p>
                  </div>
                  <Button
                    onClick={() => setReplyingTo(null)}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              <form
                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
                onSubmit={handleSendMessage}
              >
                <ChatInput
                  className="min-h-12 resize-none rounded-lg border-0 bg-background p-3 shadow-none focus-visible:ring-0"
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message here..."
                  value={inputValue}
                />
                <div className="flex items-center p-3 pt-2">
                  {/* <Button variant="ghost" size="icon">
                    <Paperclip className="size-4" />
                    <span className="sr-only">Attach file</span>
                  </Button>

                  <Button variant="ghost" size="icon">
                    <Mic className="size-4" />
                    <span className="sr-only">Use Microphone</span>
                  </Button> */}

                  <Button className="ml-auto gap-1.5" size="sm">
                    Send Message
                    <CornerDownLeft className="size-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={36}>
            <TextPilot />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
