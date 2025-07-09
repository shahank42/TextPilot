# Frontend Context Profile: `apps/web`

This document provides a high-level overview of the frontend application's architecture, key libraries, and data flow. It is intended to be used by LLMs to quickly gain context about the web application.

## 1. Core Technologies & Libraries

- **UI Framework:** React
- **Routing:** TanStack Router (v1, file-based)
- **API Communication:** oRPC (end-to-end typesafe RPC)
- **State Management:**
  - **TanStack Query:** For server state, caching, and data fetching. It's heavily used with oRPC for queries, mutations, and real-time updates via Server-Sent Events (SSE).
  - **Jotai:** For global client-side state (e.g., managing message lists, selected chat ID).
- **Styling:** Tailwind CSS with `shadcn/ui` components. The `cn` utility function (`lib/utils.ts`) is used for merging Tailwind classes.
- **Icons:** Lucide React
- **AI:** The Vercel AI SDK (`@ai-sdk/react`) is used for the AI chat interface on the `/ai` route.

## 2. Project Structure Overview

- **`src/main.tsx`**: The application entry point. It sets up providers: `QueryClientProvider` (for TanStack Query), `ThemeProvider`, and `RouterProvider` (for TanStack Router).
- **`src/routes/`**: Contains all application routes, following TanStack Router's file-based routing convention.
  - **`__root.tsx`**: The root layout component. It includes the main `<Header />` and an `<Outlet />` where child routes are rendered.
  - **`index.tsx`**: The home page.
  - **`whatsapp/`**: The main feature directory, containing all components and logic for the WhatsApp client.
- **`src/components/`**: Home to reusable components.
  - **`ui/`**: Contains the `shadcn/ui` components.
  - **`header.tsx`**: The main site header.
  - **`loader.tsx`**: A generic loading spinner component.
- **`src/hooks/`**: Contains custom React hooks, such as `useSidebarResize` for the resizable panel logic.
- **`src/lib/`**: Contains shared utilities and state definitions.
  - **`atoms.ts`**: Defines all global Jotai atoms, which are central to the application's client-side state management.
  - **`utils.ts`**: Contains utility functions like `cn` (for classnames) and `getInitials`.
- **`src/utils/`**:
  - **`orpc.ts`**: Initializes and exports the `oRPC` client, which is the single point of contact for all backend API calls.

## 3. Key Feature: WhatsApp Client (`/whatsapp`)

This is the core functionality of the application.

### Data Flow & Real-time Updates

The application relies heavily on Server-Sent Events (SSE) for real-time communication with the backend, facilitated by TanStack Query's `experimental_liveOptions` with the oRPC client.

1.  **Authentication (`/whatsapp/index.tsx`)**:
    -   A live query (`orpc.whatsapp.status.experimental_liveOptions()`) continuously checks the user's WhatsApp authentication status.
    -   If the status is `unauthenticated`, the `WhatsappQRCode` component is rendered, which uses its own live query to fetch and display the QR code from the backend.
    -   If the status is `authenticated`, the main `WhatsappChatLayout` is rendered.

2.  **Message Handling (`/whatsapp/-hooks/use-whatsapp-messages.tsx`)**:
    -   This is the primary hook for the chat interface.
    -   It establishes a live SSE connection via `orpc.whatsapp.messagesSSE.experimental_liveOptions()` to receive new messages in real-time.
    -   Incoming messages are stored in a global Jotai atom: `whatsappMessagesAtom`.
    -   The hook derives a list of unique chats from all messages and provides the currently selected chat's data to the UI.

### Component Breakdown

-   **`WhatsappChatLayout.tsx`**: The main layout for the chat UI. It displays a list of chats on the left (`ChatsList`) and the active chat window on the right (`WhatsappChat`).
-   **`ChatsList.tsx` / `WhatsappChatsListItem.tsx`**: Renders the list of conversations. Clicking an item updates the `selectedChatIdAtom`, which causes the main chat view to update.
-   **`WhatsappChat.tsx`**: The component for the active conversation.
    -   It displays all messages for the `selectedChatId`.
    -   It uses `WhatsappChatMessageBubble` to render each message.
    -   It includes a `ChatInput` form to send new messages or reply to existing ones. Sending is handled by an `oRPC` mutation (`orpc.whatsapp.sendMessage.call`).
    -   It features a resizable panel that includes the `<TextPilot />` AI assistant component.
-   **`WhatsappChatMessageBubble.tsx`**: Renders an individual message bubble, handling sent vs. received styles, quoted replies, and fetching user/contact details via oRPC queries.

## 4. Global State (Jotai Atoms)

Defined in `src/lib/atoms.ts`:

-   **`whatsappMessagesAtom`**: `atom<WAWebJS.Message[]>` - The central store for all received WhatsApp messages.
-   **`selectedChatIdAtom`**: `atom<string | null>` - Stores the ID of the currently active conversation. This is written to by `WhatsappChatsListItem` and read by `useWhatsappMessages` to filter messages.
-   **`replyingToAtom`**: `atom<WAWebJS.Message | null>` - Stores the message object that the user is currently replying to. This is used by `WhatsappChat` to show a reply preview and send the reply context to the backend.
