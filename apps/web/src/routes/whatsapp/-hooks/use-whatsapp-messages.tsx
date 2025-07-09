import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type WAWebJS from "whatsapp-web.js";
import {
  addNewMessageAtom,
  replyingToAtom,
  selectedChatIdAtom,
  unreadCountsAtom,
  whatsappMessagesAtom,
} from "@/lib/atoms";
import { orpc } from "@/utils/orpc";

export interface SelectedChatType {
  id: string;
  messages: WAWebJS.Message[];
  isGroup: boolean;
}

export interface ChatsListItem {
  id: string;
  displayName: string;
  lastMessageBody: string;
  timestamp: number;
}

export function useWhatsappMessages() {
  const messageQuery = useQuery(
    orpc.whatsapp.messagesSSE.experimental_liveOptions()
  );

  // Fire a contact query whenever a message is recieved
  useQuery(
    orpc.whatsapp.getContact.queryOptions({
      input: { id: messageQuery.data?.id.remote! },
      enabled: !!messageQuery.data?.id.remote,
    })
  );

  // Fire a pfp query whenever a message is recieved
  useQuery(
    orpc.whatsapp.getPfp.queryOptions({
      input: { id: messageQuery.data?.id.remote! },
      enabled: !!messageQuery.data?.id.remote,
    })
  );

  const [messages] = useAtom(whatsappMessagesAtom);
  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatIdAtom);
  const [replyingTo, setReplyingTo] = useAtom(replyingToAtom);
  const [, setUnreadCounts] = useAtom(unreadCountsAtom);
  const [, addNewMessage] = useAtom(addNewMessageAtom);

  useHotkeys("esc", () => {
    if (replyingTo) setReplyingTo(null);
    else setSelectedChatId(null);
  });

  useEffect(() => {
    if (messageQuery.data) {
      addNewMessage(messageQuery.data);
    }
  }, [messageQuery.data, addNewMessage]);

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

  useEffect(() => {
    setReplyingTo(null);
    if (selectedChatId) {
      setUnreadCounts((prev) => {
        if (!prev[selectedChatId]) return prev;
        const newCounts = { ...prev };
        delete newCounts[selectedChatId];
        return newCounts;
      });
    }
  }, [selectedChatId, setReplyingTo, setUnreadCounts]);

  // Filter messages to show only those for the selected chat
  const selectedChatMessages = messages.filter(
    (msg) => msg.id.remote === selectedChatId
  );

  const selectedChat: SelectedChatType | null = selectedChatId
    ? {
        id: selectedChatId,
        messages: selectedChatMessages,
        isGroup: selectedChatMessages.some((msg) =>
          msg.id.remote.includes("@g.us")
        ),
      }
    : null;

  return { messages, chats, selectedChat };
}
