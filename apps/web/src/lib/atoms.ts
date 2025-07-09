import { atom } from "jotai";
import type WAWebJS from "whatsapp-web.js";

export const whatsappMessagesAtom = atom<WAWebJS.Message[]>([]);
export const selectedChatIdAtom = atom<string | null>(null);
export const replyingToAtom = atom<WAWebJS.Message | null>(null);
export const unreadCountsAtom = atom<Record<string, number>>({});

export const addNewMessageAtom = atom(
	null, // write-only atom
	(get, set, newMessage: WAWebJS.Message) => {
		const messages = get(whatsappMessagesAtom);
		if (messages.find((m) => m.id.id === newMessage.id.id)) return;

		set(whatsappMessagesAtom, [...messages, newMessage]);

		if (!newMessage.fromMe) {
			const selectedChatId = get(selectedChatIdAtom);
			const chatId = newMessage.id.remote;
			if (chatId !== selectedChatId) {
				set(unreadCountsAtom, (prev) => ({
					...prev,
					[chatId]: (prev[chatId] || 0) + 1,
				}));
			}
		}
	}
);
