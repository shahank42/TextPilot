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
import { WhatsappChatHeader } from "./whatsapp-chat-header";
import { WhatsappChatMessageBubble } from "./whatsapp-chat-message-bubble";

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
        <WhatsappChatHeader selectedChatId={chat.id} />

        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100dvh-69px)]"
        >
          <ResizablePanel className="flex flex-col h-[calc(100dvh-69px)]">
            <ScrollArea className="h-[calc(100dvh-69px-147px)]">
              <ChatMessageList>
                {chat.messages.map((message) => (
                  <WhatsappChatMessageBubble
                    key={message.id._serialized}
                    message={message}
                  />
                ))}
              </ChatMessageList>
            </ScrollArea>

            <div className="w-full py-5 px-7 border-t">
              <form
                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
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
