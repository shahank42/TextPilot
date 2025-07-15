import { messageMapAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai-immer";
import { useMemo } from "react";

export interface ChatItem {
  id: string;
  name: string;
  lastMessageBody: string;
  timestamp: number;
}

export const useLocalChats = () => {
  const [messageMap, setMessageMap] = useAtom(messageMapAtom);

  const chats = useMemo(() => {
    const chatIds = Array.from(messageMap.keys());
    return chatIds.map((id) => {
      const messages = messageMap.get(id)!;

      return {
        id,
        name: messages[messages.length - 1].chatJID as string,
        lastMessageBody: messages[messages.length - 1].text as string,
        timestamp: messages[messages.length - 1].timestamp as number,
      };
    });
  }, [Array.from(messageMap.keys())]);

  return chats;
};
