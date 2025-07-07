import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type WAWebJS from "whatsapp-web.js";

export function WhatsappClient() {
  const messageQuery = useQuery(
    orpc.whatsapp.messagesSSE.experimental_liveOptions()
  );

  // State for all messages, the selected chat, and the new message input
  const [messages, setMessages] = useState<WAWebJS.Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Ref for auto-scrolling to the latest message
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChatId]); // Scroll when messages or selected chat changes

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
      .map((chat) => ({
        id: chat.lastMessage.id.remote,
        // For a real app, you'd fetch chat details to get a proper name
        displayName: chat.lastMessage.id.remote,
        lastMessageBody: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
      }));
  }, [messages]);

  // Filter messages to show only those for the selected chat
  const filteredMessages = messages.filter(
    (msg) => msg.id.remote === selectedChatId
  );

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedChatId) return;

    // For now, we just log it. Later, this would call an oRPC mutation.
    console.log(`Sending to ${selectedChatId}: ${inputValue}`);
    const sentMessage = await orpc.whatsapp.sendMessage.call({
      to: selectedChatId,
      body: inputValue,
    });

    console.log(sentMessage);

    setInputValue("");
  };

  return (
    <div className="w-full h-[90vh] flex border rounded-lg bg-white shadow-lg">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 font-bold border-b">Chats</div>
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                selectedChatId === chat.id ? "bg-blue-100" : ""
              }`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              <p className="font-semibold truncate">{chat.displayName}</p>
              <p className="text-sm text-gray-600 truncate">
                {chat.lastMessageBody}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content: Chat Window */}
      <div className="w-2/3 flex flex-col">
        {selectedChatId ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id.id}
                  className={`flex flex-col ${
                    msg.fromMe ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-lg p-3 rounded-lg shadow-sm ${
                      msg.fromMe ? "bg-blue-500 text-white" : "bg-white border"
                    }`}
                  >
                    {!msg.fromMe && msg.author && (
                      <p className="text-sm font-bold mb-1 text-blue-600">
                        {msg.author}
                      </p>
                    )}
                    <p className="text-base">{msg.body}</p>
                    <p className="text-xs mt-1 text-right opacity-75">
                      {new Date(msg.timestamp * 1000).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div>
              <h2 className="text-2xl font-bold">
                Select a chat to start messaging
              </h2>
              <p className="text-center mt-2">
                Or send a new message from your phone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
