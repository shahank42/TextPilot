package api

import (
	_ "github.com/textpilot-whatsmeow/docs" // This line is required for swag to find the docs

	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/textpilot-whatsmeow/internal/manager"
	"github.com/textpilot-whatsmeow/internal/models"
	"github.com/textpilot-whatsmeow/internal/whatsapp"
)

// @title WhatsApp Client API
// @description This API allows you to manage WhatsApp clients, send messages, and receive events.
// @version 1.0
// @host localhost:8080
// @BasePath /

// @title WhatsApp Client API
// @description This API allows you to manage WhatsApp clients, send messages, and receive events.
// @version 1.0
// @host localhost:8080
// @BasePath /

// API holds the dependencies for our API handlers.
type API struct {
	clientManager *manager.ClientManager
}

// NewAPI creates a new API.
func NewAPI(clientManager *manager.ClientManager) *API {
	return &API{
		clientManager: clientManager,
	}
}

// connect handles the /clients/connect endpoint.
// It initializes a new WhatsApp client and returns a server-generated clientID.
// @Summary Connect a new WhatsApp client
// @Description Initializes a new WhatsApp client and returns a server-generated clientID.
// @Tags clients
// @Accept json
// @Produce json
// @Success 200 {string} string "Client ID"
// @Failure 500 {object} APIError "Internal Server Error"
// @Router /clients/connect [post]
func (a *API) connect(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	// Always generate a new clientID.
	clientID := uuid.New().String()

	// Create a new WhatsApp client wrapper.
	// Generate a unique directory and database path for this client.
	clientSessionDir := fmt.Sprintf("sessions/%s", clientID)
	if err := os.MkdirAll(clientSessionDir, 0755); err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Failed to create client session directory")
		return nil, ErrInternalServerError
	}
	dbPath := fmt.Sprintf("%s/session.db", clientSessionDir)
	waClient, err := whatsapp.NewWhatsappClient(dbPath)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Failed to create WhatsApp client")
		return nil, ErrInternalServerError // Use a generic internal error for underlying system failures
	}

	// Add the new client to our manager.
	a.clientManager.Add(clientID, waClient)

	// Start the WhatsApp connection in a goroutine.
	// This allows the HTTP handler to return immediately while the connection happens in the background.
	go func() {
		log.Info().Str("clientID", clientID).Msg("Attempting to connect client")
		if err := waClient.Connect(); err != nil {
			log.Error().Err(err).Str("clientID", clientID).Msg("Failed to connect client")
		}
		// Ensure client is removed from manager if connection fails or terminates.
		// a.clientManager.Remove(clientID)
		// log.Info().Str("clientID", clientID).Msg("Client removed from manager after connection attempt.")
	}()

	log.Info().Str("clientID", clientID).Msg("Connect request accepted")
	return clientID, nil // Return the clientID on success
}

// events handles the /clients/{clientID}/events endpoint.
// It establishes an SSE connection to stream real-time events.
// @Summary Stream real-time events for a client
// @Description Establishes a Server-Sent Events (SSE) connection to stream real-time WhatsApp events (e.g., QR codes, messages, connection status).
// @Tags clients
// @Produce text/event-stream
// @Param clientID path string true "Client ID"
// @Success 200 {string} string "Event stream established"
// @Failure 404 {object} APIError "Client not found"
// @Failure 500 {object} APIError "Streaming unsupported or Internal Server Error"
// @Router /clients/{clientID}/events [get]
func (a *API) events(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) { // Signature changed for consistency with MakeHTTPHandler
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for SSE connection")
		return nil, ErrClientNotFound
	}

	// Set necessary headers for Server-Sent Events.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Get the Flusher interface to send events immediately.
	flusher, ok := w.(http.Flusher)
	if !ok {
		log.Error().Str("clientID", clientID).Msg("Streaming unsupported by underlying http.ResponseWriter")
		return nil, ErrStreamingUnsupported
	}

	// Immediately flush the headers to the client.
	// This signals that the connection is established and ready for events.
	// It helps prevent race conditions where the server sends an event
	// before the client is fully ready to listen.

	flusher.Flush()

	// Send an initial buffer event to confirm the connection is open.
	a.sendSSEEvent(w, flusher, "buffer", "", clientID)

	log.Info().Str("clientID", clientID).Msg("SSE connection opened")

	// If the client is already logged in, send an initial status event.
	if waClient.Client.IsLoggedIn() {
		a.sendSSEEvent(w, flusher, "status", "logged_in", clientID)
	}

	// Loop indefinitely, sending events as they arrive or when the client disconnects.
	for {
		select {
		case <-r.Context().Done():
			// Client disconnected from SSE. We no longer clean up the client here.
			// The session will persist until an explicit disconnect call.
			log.Info().Str("clientID", clientID).Msg("SSE client disconnected.")
			return nil, nil // Return from the handler, closing the SSE stream but keeping the session alive.
		case evt, ok := <-waClient.EventChan:
			if !ok { // Channel was closed by waClient.Close()
				log.Info().Str("clientID", clientID).Msg("WhatsappClient EventChan closed. Not actually Removing client from manager.")
				return nil, nil
			}
			log.Debug().Str("clientID", clientID).Type("whatsmeowEventType", evt).Msg("Received raw event from WhatsappClient.EventChan")

			// Convert the whatsmeow event to our APIEvent format.
			if apiEvent := toAPIEvent(evt, clientID); apiEvent != nil {
				// Send the converted event over SSE.
				a.sendSSEEvent(w, flusher, apiEvent.Type, apiEvent.Data, clientID)
			}
		}
	}
}

// sendMessage handles the /clients/{clientID}/messages/send endpoint.
// It sends a text message and returns the sent message details.
// @Summary Send a text message
// @Description Sends a text message to a specified JID (Jabber ID) for a given client.
// @Tags clients
// @Accept json
// @Produce json
// @Param clientID path string true "Client ID"
// @Param message body models.SendMessageRequest true "Message details"
// @Success 200 {object} models.Message "Message sent successfully"
// @Failure 400 {object} APIError "Invalid request body or JID format"
// @Failure 404 {object} APIError "Client not found"
// @Failure 500 {object} APIError "Internal Server Error"
// @Router /clients/{clientID}/messages/send [post]
func (a *API) sendMessage(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for send message request")
		return nil, ErrClientNotFound
	}

	// Define a struct to parse the incoming request body.
	var msgReq struct {
		JID  string `json:"jid"`
		Text string `json:"text"`
	}

	// Decode the JSON request body.
	if err := json.NewDecoder(r.Body).Decode(&msgReq); err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Invalid request body for send message")
		return nil, ErrInvalidRequest
	}

	// Parse the JID string into whatsmeow's JID type.
	parsedJID, err := types.ParseJID(msgReq.JID)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("jid", msgReq.JID).Msg("Invalid JID format for send message")
		return nil, ErrInvalidJID
	}

	// Call the WhatsappClient's SendTextMessage method.
	resp, err := waClient.SendTextMessage(parsedJID, msgReq.Text)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("jid", msgReq.JID).Msg("Failed to send message")
		return nil, ErrInternalServerError // Generic error for underlying send failure
	}

	// Retrieve the sent message from the in-memory store to ensure consistency.
	sentMessage, found := waClient.GetMessage(resp.ID)
	if !found {
		log.Error().Str("clientID", clientID).Str("messageID", resp.ID).Msg("Sent message not found in memory store after sending")
		return nil, ErrInternalServerError // This indicates a logic error
	}

	log.Info().Str("clientID", clientID).Str("messageID", resp.ID).Msg("Message sent successfully")
	return sentMessage, nil // Return the sent message on success
}

// getChats handles the /clients/{clientID}/chats endpoint.
// Retrieves all contacts and groups for the client.
// @Summary Get all chats for a client
// @Description Retrieves a list of all contacts and groups (chats) associated with a specific client.
// @Tags clients
// @Produce json
// @Param clientID path string true "Client ID"
// @Success 200 {array} models.Chat "List of chats retrieved successfully"
// @Failure 404 {object} APIError "Client not found"
// @Failure 500 {object} APIError "Internal Server Error"
// @Router /clients/{clientID}/chats [get]
func (a *API) getChats(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for get chats request")
		return nil, ErrClientNotFound
	}

	var chats []models.Chat

	// Get all individual contacts from the whatsmeow client's store.
	whatsmeowContacts, err := waClient.Client.Store.Contacts.GetAllContacts(r.Context())
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Failed to get contacts")
		// Continue even if contacts fail, as groups might still be available.
	} else {
		for jid, contactInfo := range whatsmeowContacts {
			// Determine if it's a group chat by checking the JID server.
			isGroup := jid.Server == "g.us"

			// Only add individual contacts here; groups will be added from GetJoinedGroups.
			if !isGroup {
				name := jid.String()
				if contactInfo.PushName != "" {
					name = contactInfo.PushName
				} else if contactInfo.FullName != "" {
					name = contactInfo.FullName
				}
				chats = append(chats, models.Chat{
					JID:     jid.String(),
					Name:    name,
					IsGroup: false,
				})
			}
		}
	}

	// Get all joined groups from the whatsmeow client.
	whatsmeowGroups, err := waClient.Client.GetJoinedGroups()
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Failed to get joined groups")
		// Continue even if groups fail.
	} else {
		for _, groupInfo := range whatsmeowGroups {
			// For groups, we can get more detailed info directly.
			chat := models.Chat{
				JID:     groupInfo.JID.String(),
				Name:    groupInfo.Name,
				IsGroup: true,
			}
			if groupInfo.Topic != "" {
				chat.Description = groupInfo.Topic
			}
			// Participants are available in groupInfo.Participants, but we'll fetch them
			// in getChat for full detail, or if needed, iterate here.
			chats = append(chats, chat)
		}
	}

	log.Info().Str("clientID", clientID).Int("chatCount", len(chats)).Msg("Chats retrieved successfully")
	return chats, nil // Return the combined list of chats on success
}

// getChat handles the /clients/{clientID}/chats/{chatID} endpoint.
// Retrieves details for a single chat.
// @Summary Get chat details
// @Description Retrieves detailed information for a specific chat, including participants for groups.
// @Tags clients
// @Produce json
// @Param clientID path string true "Client ID"
// @Param chatID path string true "Chat JID (e.g., 1234567890@s.whatsapp.net or 123456-7890@g.us)"
// @Success 200 {object} models.Chat "Chat details retrieved successfully"
// @Failure 400 {object} APIError "Invalid chat ID format"
// @Failure 404 {object} APIError "Client or chat not found"
// @Failure 500 {object} APIError "Internal Server Error"
// @Router /clients/{clientID}/chats/{chatID} [get]
func (a *API) getChat(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID, err := url.QueryUnescape(chi.URLParam(r, "clientID"))
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Invalid client ID format for get chat")
		return nil, ErrInvalidJID
	}

	chatID, err := url.QueryUnescape(chi.URLParam(r, "chatID"))
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("Invalid chat ID format for get chat")
		return nil, ErrInvalidJID
	}

	fmt.Println("ChatID:", chatID)

	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for get chat request")
		return nil, ErrClientNotFound
	}

	parsedChatJID, err := types.ParseJID(chatID)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("Invalid chat ID format for get chat")
		return nil, ErrInvalidJID
	}

	// Get contact info from the store.
	contactInfo, err := waClient.Client.Store.Contacts.GetContact(r.Context(), parsedChatJID)
	if err != nil {
		// If there's an error, assume chat not found for simplicity.
		log.Warn().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("Chat not found in store")
		return nil, ErrClientNotFound // Use ClientNotFound for chat not found
	}

	fmt.Printf("Contanct INFO: %+v\n", contactInfo)

	pfpURL := ""
	pfpInfo, err := waClient.Client.GetProfilePictureInfo(parsedChatJID, &whatsmeow.GetProfilePictureParams{
		Preview: true, // Set to true for preview/thumbnail
	})
	if err != nil {
		log.Warn().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("Failed to get profile picture info")
	} else {
		pfpURL = pfpInfo.URL
	}

	// Determine if it's a group chat by checking the JID server.
	isGroup := parsedChatJID.Server == "g.us"

	// Use PushName or FullName if available, otherwise default to the JID.
	name := parsedChatJID.String()
	if contactInfo.BusinessName != "" {
		name = contactInfo.BusinessName
	} else if contactInfo.FullName != "" {
		name = contactInfo.FullName
	}

	chat := models.Chat{
		JID:     parsedChatJID.String(),
		Name:    name,
		IsGroup: isGroup,
		Pfp:     pfpURL,
	}

	// If it's a group, fetch additional group info.
	if isGroup {
		groupInfo, err := waClient.Client.GetGroupInfo(parsedChatJID)
		if err != nil {
			log.Error().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("Failed to get group info")
			// Continue without group-specific details if fetching fails.
		} else {
			if groupInfo.Topic != "" {
				chat.Description = groupInfo.Topic
			}
			for _, participant := range groupInfo.Participants {
				chat.Participants = append(chat.Participants, models.Participant{
					JID:     participant.JID.String(),
					IsAdmin: participant.IsAdmin,
				})
			}
		}
	}

	log.Info().Str("clientID", clientID).Str("chatID", chatID).Msg("Chat details retrieved successfully")
	// fmt.Printf("%+v\n", chat)
	return chat, nil // Return the chat details on success
}

// getMessageByID handles the /clients/{clientID}/messages/{messageID} endpoint.
// Retrieves a single message by its ID.
func (a *API) getMessageByID(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	messageID := chi.URLParam(r, "messageID")

	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for get message by ID request")
		return nil, ErrClientNotFound
	}

	msg, found := waClient.GetMessage(messageID)
	if !found {
		log.Warn().Str("clientID", clientID).Str("messageID", messageID).Msg("Message not found in memory store")
		return nil, ErrMessageNotFound
	}

	log.Info().Str("clientID", clientID).Str("messageID", messageID).Msg("Message retrieved successfully from memory store")
	return msg, nil
}

// disconnect handles the /clients/{clientID}/disconnect endpoint.
// It disconnects the WhatsApp client and cleans up the session.
// @Summary Disconnect a WhatsApp client
// @Description Disconnects the specified client, closes the WhatsApp session, and cleans up resources.
// @Tags clients
// @Accept json
// @Produce json
// @Param clientID path string true "Client ID"
// @Success 200 {object} map[string]string "Success message"
// @Failure 404 {object} APIError "Client not found"
// @Router /clients/{clientID}/disconnect [post]
func (a *API) disconnect(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("Client not found for disconnect request")
		return nil, ErrClientNotFound
	}

	// Close the WhatsApp client connection.
	waClient.Close()
	// Remove the client from the manager.
	a.clientManager.Remove(clientID)

	log.Info().Str("clientID", clientID).Msg("Client disconnected and removed successfully")
	return map[string]string{"message": "Client disconnected successfully"}, nil
}

// sendSSEEvent is a helper function to marshal and send an APIEvent over an SSE connection.
func (a *API) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}, clientID string) {
	apiEvent := &models.APIEvent{
		ClientId: clientID,
		Type:     eventType,
		Data:     data,
	}

	jsonData, err := json.Marshal(apiEvent)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("apiEventType", eventType).Msg("Error marshaling APIEvent data for SSE")
		return
	}

	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
	log.Debug().Str("clientID", clientID).Str("apiEventType", eventType).Msg("Sent APIEvent over SSE")
}

// toAPIEvent converts a whatsmeow event to a models.APIEvent.
// It returns nil if the event is not one we want to forward.
func toAPIEvent(evt interface{}, clientID string) *models.APIEvent {
	switch v := evt.(type) {
	case *events.QR:
		return &models.APIEvent{Type: "qr_code", Data: v.Codes[0]}
	case *events.Message:
		msgText := v.Message.GetConversation()
		if msgText == "" {
			msgText = *v.Message.GetExtendedTextMessage().Text
		}

		return &models.APIEvent{
			Type: "message",
			Data: models.Message{
				ID:        v.Info.ID,
				Timestamp: v.Info.Timestamp.Unix(),
				Text:      msgText,
				ChatJID:   v.Info.Chat.String(),
				SenderJID: v.Info.Sender.String(),
				IsFromMe:  v.Info.IsFromMe,
			},
		}
	case *events.Connected:
		return &models.APIEvent{Type: "status", Data: "connected"}
	case *events.Disconnected:
		return &models.APIEvent{Type: "status", Data: "disconnected"}
	case *events.LoggedOut:
		return &models.APIEvent{Type: "status", Data: "logged_out"}
	default:
		log.Debug().Str("clientID", clientID).Type("unhandledEventType", evt).Msg("Unhandled event type from whatsmeow, skipping SSE")
		return nil // Skip sending this event over SSE
	}
}
