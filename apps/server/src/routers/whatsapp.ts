import {
  client,
  messageEvents,
  whatsappClientState,
} from "@/lib/whatsapp/client";
import { publicProcedure } from "../lib/orpc";
import type WAWebJS from "whatsapp-web.js";
import { EventEmitter } from "node:events";
import { z } from "zod/v4";

const sendMessageEvent = new EventEmitter();

export const whatsappRouter = {
  qrCodeSSE: publicProcedure.handler(async function* () {
    while (true) {
      yield whatsappClientState.qrCode;
      if (whatsappClientState.isReady) return;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }),
  isReadySSE: publicProcedure.handler(async function* ({ input, lastEventId }) {
    while (true) {
      yield whatsappClientState.isReady;
      if (whatsappClientState.isReady) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }),
  messagesSSE: publicProcedure.handler(async function* () {
    const queue: WAWebJS.Message[] = [];
    let resolve: ((value: unknown) => void) | undefined;

    const listener = (message: WAWebJS.Message) => {
      queue.push(message);
      if (resolve) {
        resolve(undefined);
        resolve = undefined;
      }
    };

    messageEvents.on("newMessage", listener);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise((r) => (resolve = r));
        }
      }
    } finally {
      messageEvents.removeListener("newMessage", listener);
    }
  }),

  sendMessage: publicProcedure
    .input(
      z.object({
        to: z.string(),
        body: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const sentMessage = await client.sendMessage(input.to, input.body);
      messageEvents.emit("newMessage", sentMessage);
      console.log("[WWEBJS] sent message", sentMessage);
      return sentMessage;
    }),
};
export type WhatsappRouter = typeof whatsappRouter;
