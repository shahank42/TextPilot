import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { whatsappMessagesAtom, selectedChatIdAtom } from "@/lib/atoms";
import { useEffect, useMemo, useState } from "react";
import type WAWebJS from "whatsapp-web.js";
import type { ChatsListItem } from "../-components/whatsapp-chats-list";

export interface SelectedChatType {
  id: string;
  messages: WAWebJS.Message[];
}

export function useWhatsappMessages() {
  const messageQuery = useQuery(
    orpc.whatsapp.messagesSSE.experimental_liveOptions()
  );

  // State for all messages, the selected chat, and the new message input
  // const [messages, setMessages] = useState<WAWebJS.Message[]>([]);
  const [messages, setMessages] = useAtom(whatsappMessagesAtom);
  const [selectedChatId, _] = useAtom(selectedChatIdAtom);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (messageQuery.data) {
      // `data` is the latest message. We maintain an array in our state.
      setMessages((prevMessages) => {
        if (prevMessages.find((msg) => msg.id.id === messageQuery.data.id.id)) {
          return prevMessages;
        }
        return [...prevMessages, messageQuery.data];
      });
    }
  }, [messageQuery.data]);

  // Derive a list of unique chats from the messages
  const chats = useMemo(() => {
    const chatMap = new Map<string, { lastMessage: WAWebJS.Message }>();
    messages.forEach((msg) => {
      const chatId = msg.id.remote;
      const existing = chatMap.get(chatId);
      if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
        chatMap.set(chatId, { lastMessage: msg });
      }
    });

    return Array.from(chatMap.values())
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
      .map(
        (chat) =>
          ({
            id: chat.lastMessage.id.remote,
            displayName: chat.lastMessage.id.remote,
            lastMessageBody: chat.lastMessage.body,
            timestamp: chat.lastMessage.timestamp,
          }) as ChatsListItem
      );
  }, [messages]);

  // Filter messages to show only those for the selected chat
  const selectedChatMessages = messages.filter(
    (msg) => msg.id.remote === selectedChatId
  );

  const selectedChat: SelectedChatType | null = selectedChatId
    ? {
        id: selectedChatId,
        messages: selectedChatMessages,
      }
    : null;

  return { messages, chats, selectedChat };
}
