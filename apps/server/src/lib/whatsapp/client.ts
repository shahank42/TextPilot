import WAWebJS, { Client, LocalAuth } from "whatsapp-web.js";
import { EventEmitter } from "node:events";

// const client = new Client({ puppeteer: {} });
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});

let messageEvents = new EventEmitter();

const whatsappClientState: {
  qrCode: string | null;
  authData: {
    browserId: string;
    secretBundle: string;
    token1: string;
    token2: string;
  } | null;
  isReady: boolean;
  messages: WAWebJS.Message[];
} = {
  qrCode: null,
  authData: null,
  isReady: false,
  messages: [],
};

client.once("ready", () => {
  console.log("[WWEBJS] Client is ready!");
  whatsappClientState.isReady = true;
});

client.on("qr", (qr) => {
  console.log("[WWEBJS] QR code:", qr);
  whatsappClientState.qrCode = qr;
});

client.on("authenticated", async (data) => {
  console.log("[WWEBJS] Successfully authenticated!");
  if (data) {
    whatsappClientState.authData = {
      browserId: data.WABrowserId,
      secretBundle: data.WASecretBundle,
      token1: data.WAToken1,
      token2: data.WAToken2,
    };

    console.log(whatsappClientState.authData);
  }
  // console.log("getting chats...");
  // const chats = await client.getChats();
  // console.log(chats);
});

client.on("message", async (message) => {
  console.log("[WWEBJS] MESSAGE from ", message.author, ":", message.body);
  whatsappClientState.messages.push(message);
  messageEvents.emit("newMessage", message);
  // const chat = await message.getChat();
  // const sent = await client.sendMessage(
  //   `${chat.id.user}@${chat.id.server}`,
  //   "ping"
  // );
});

// console.log("getting chats...");
// const chats = await client.getChats();
// console.log(chats[10]);

client.initialize();

export { client, whatsappClientState, messageEvents };
