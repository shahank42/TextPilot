# Server Context Profile

This document outlines the key components, data flows, and relationships within the `apps/server` directory, serving as a contextual profile for Large Language Models (LLMs).

## Core Technologies

*   **Hono:** A lightweight, fast, and modern web framework for building APIs and web applications.
*   **ORPC (OpenRPC):** A framework for defining and handling Remote Procedure Calls (RPCs), providing a structured and type-safe way to expose backend functionalities.
*   **WhatsApp Web.js:** A library for interacting with the WhatsApp Web client, enabling programmatic control over WhatsApp functionalities.
*   **AI SDK (Google):** Used for integrating with Google's AI models, specifically Gemini 1.5 Flash, for AI-powered features.
*   **Zod:** A TypeScript-first schema declaration and validation library, used for input validation of RPC procedures.
*   **Server-Sent Events (SSE):** A mechanism for pushing real-time updates from the server to the client over a single HTTP connection.

## Components and Their Roles

*   **`index.ts` (Server Entry Point):**
    *   Initializes the Hono application.
    *   Configures middleware (e.g., `hono/cors` for CORS, `hono/logger` for logging).
    *   Sets up the ORPC handler (`RPCHandler`) to process RPC requests under the `/rpc/*` path, routing them via `appRouter`.
    *   Defines a `/ai` POST endpoint for AI interactions, streaming responses from the Google Gemini model.
    *   Includes a basic `/` GET endpoint for health checks.

*   **`routers/index.ts` (Main RPC Router):**
    *   Defines `appRouter`, the root object that aggregates all available RPC procedures.
    *   Includes a `healthCheck` procedure.
    *   Integrates `whatsappRouter` for all WhatsApp-related RPC functionalities.

*   **`routers/whatsapp.ts` (WhatsApp RPC Procedures):**
    *   Contains various RPC procedures for WhatsApp integration.
    *   **SSE Procedures (`qrCodeSSE`, `isReadySSE`, `messagesSSE`):** Provide real-time updates for QR code, WhatsApp client readiness, and new messages using generator functions.
    *   **Utility Procedures (`getContact`, `getPfp`, `getQuotedMessage`, `sendMessage`):** Expose functionalities to retrieve contact information, profile pictures, quoted messages, and send messages.
    *   Uses `zod` for input validation of these procedures.
    *   Relies on `client`, `messageEvents`, and `whatsappClientState` from `@/lib/whatsapp/client` for WhatsApp operations and state management.

*   **`lib/orpc.ts` (ORPC Procedure Definition):**
    *   Defines `publicProcedure`, which is the base for creating RPC procedures.
    *   Ensures that all procedures defined using `publicProcedure` have access to the `Context` object.

*   **`lib/context.ts` (Context Definition):**
    *   Defines the `createContext` function, which constructs the context object available to RPC procedures.
    *   Currently, the `Context` object contains `session: null`, indicating a placeholder for future authentication or session management.
    *   Receives the `HonoContext` as input, linking the RPC context to the underlying HTTP request.

*   **`lib/whatsapp/client.ts` (WhatsApp Client Management - *inferred*):**
    *   (Based on imports in `routers/whatsapp.ts`) This module is responsible for:
        *   Managing the `whatsapp-web.js` client instance.
        *   Maintaining the `whatsappClientState` (e.g., QR code, readiness).
        *   Handling `messageEvents` (e.g., emitting `newMessage` events).

## Data Flows and Relationships

1.  **Server Initialization:** `index.ts` starts the Hono server, sets up middleware, and initializes the ORPC handler.
2.  **RPC Request Handling:**
    *   Clients send RPC requests to `/rpc/*`.
    *   The `RPCHandler` in `index.ts` intercepts these requests.
    *   `createContext` (from `lib/context.ts`) generates a `Context` object for the request.
    *   The `appRouter` (from `routers/index.ts`) dispatches the request to the appropriate procedure (e.g., `healthCheck` or a procedure within `whatsappRouter`).
    *   Procedures defined using `publicProcedure` (from `lib/orpc.ts`) receive the `Context` and validated input (via `zod`).
3.  **WhatsApp Integration:**
    *   `routers/whatsapp.ts` exposes RPC procedures for WhatsApp.
    *   These procedures interact with the `whatsapp-web.js` client via `lib/whatsapp/client.ts`.
    *   Real-time updates (QR code, readiness, new messages) are pushed to clients via SSE procedures.
    *   `sendMessage` procedure emits a `newMessage` event, which is then streamed to clients via `messagesSSE`.
4.  **AI Integration:**
    *   The `/ai` endpoint in `index.ts` receives AI conversation messages.
    *   It uses `@ai-sdk/google` to interact with the Gemini 1.5 Flash model.
    *   The AI response is streamed back to the client.
5.  **Configuration:** Environment variables are used for server configuration (e.g., CORS origin).

## Excluded from Analysis (as per instructions)

*   **Drizzle and Database Connections:** Any files or logic related to Drizzle ORM or direct database interactions have been explicitly excluded from this analysis.
