import { ExpandableChatHeader } from "@/components/ui/chat/expandable-chat";
import type { SelectedChatType } from "../-hooks/use-whatsapp-messages";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@/components/ui/button";
import { CornerDownLeft, Mic, Paperclip } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextPilot } from "@/components/sidebars/textpilot";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ModeToggle } from "@/components/mode-toggle";

export function WhatsappChat({ chat }: { chat: SelectedChatType }) {
  const [inputValue, setInputValue] = useState("");

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !chat.id) return;

    console.log(`Sending to ${chat.id}: ${inputValue}`);
    const sentMessage = await orpc.whatsapp.sendMessage.call({
      to: chat.id,
      body: inputValue,
    });

    console.log(sentMessage);

    setInputValue("");
  };

  return (
    <>
      <div className="w-full h-svh flex flex-col">
        <ExpandableChatHeader>
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex flex-col">
              <span className="font-medium">{chat.id}</span>
              <span className="text-xs">
                active who knows how many mins ago
              </span>
            </div>

            <ModeToggle />
          </div>
        </ExpandableChatHeader>

        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100dvh-73px)]"
        >
          <ResizablePanel className="flex flex-col h-[calc(100dvh-73px)]">
            <ScrollArea className="h-[calc(100dvh-73px-147px)]">
              <ChatMessageList>
                {chat.messages.map((message) => (
                  <ChatBubble
                    key={message.id._serialized}
                    variant={message.fromMe ? "sent" : "received"}
                  >
                    <ChatBubbleAvatar fallback={message.fromMe ? "ME" : "OP"} />
                    <ChatBubbleMessage
                      variant={message.fromMe ? "sent" : "received"}
                    >
                      {message.body}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </ChatMessageList>
            </ScrollArea>

            <div className="w-full py-5 px-7 border-t">
              <form
                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
                onSubmit={handleSendMessage}
              >
                <ChatInput
                  placeholder="Type your message here..."
                  className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
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

                  <Button size="sm" className="ml-auto gap-1.5">
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
