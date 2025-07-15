package api

import (
	"embed"
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

	"github.com/textpilot-whatsmeow/internal/manager"
	"github.com/textpilot-whatsmeow/internal/models"
	"github.com/textpilot-whatsmeow/internal/whatsapp"
)

// @title WhatsApp Client API
// @description This API allows you to manage WhatsApp clients, send messages, and receive events.
// @version 1.0

// @BasePath /

// API holds the dependencies for our API handlers.
type API struct {
	clientManager *manager.ClientManager
	embeddedFiles embed.FS
	sessionDir    string
}

// NewAPI creates a new API instance with the given client manager and embedded files.
func NewAPI(clientManager *manager.ClientManager, embeddedFiles embed.FS, sessionDir string) *API {
	return &API{
		clientManager: clientManager,
		embeddedFiles: embeddedFiles,
		sessionDir:    sessionDir,
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
// connect handles the /clients/connect endpoint.
// It initializes a new WhatsApp client and returns a server-generated clientID.
func (a *API) connect(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := uuid.New().String()

	clientSessionDir := fmt.Sprintf("%s/%s", a.sessionDir, clientID)
	if err := os.MkdirAll(clientSessionDir, 0755); err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("failed to create client session directory")
		return nil, ErrInternalServerError.Wrap(err)
	}
	dbPath := fmt.Sprintf("%s/session.db", clientSessionDir)
	waClient, err := whatsapp.NewWhatsappClient(dbPath)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("failed to create WhatsApp client")
		return nil, ErrInternalServerError.Wrap(err)
	}

	a.clientManager.Add(clientID, waClient)

	go func() {
		log.Info().Str("clientID", clientID).Msg("attempting to connect client")
		if err := waClient.Connect(); err != nil {
			log.Error().Err(err).Str("clientID", clientID).Msg("failed to connect client")
		}
	}()

	log.Info().Str("clientID", clientID).Msg("connect request accepted")
	return clientID, nil
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
// events handles the /clients/{clientID}/events endpoint.
// It establishes an SSE connection to stream real-time events.
func (a *API) events(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for SSE connection")
		return nil, ErrClientNotFound
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		log.Error().Str("clientID", clientID).Msg("streaming unsupported by underlying http.ResponseWriter")
		return nil, ErrStreamingUnsupported.Wrap(fmt.Errorf("http.ResponseWriter does not implement http.Flusher"))
	}

	flusher.Flush()

	a.sendSSEEvent(w, flusher, "buffer", "", clientID)

	log.Info().Str("clientID", clientID).Msg("SSE connection opened")

	if waClient.Client.IsLoggedIn() {
		a.sendSSEEvent(w, flusher, "status", "logged_in", clientID)
	}

	for {
		select {
		case <-r.Context().Done():
			log.Info().Str("clientID", clientID).Msg("SSE client disconnected")
			return nil, nil
		case evt, ok := <-waClient.EventChan:
			if !ok {
				log.Info().Str("clientID", clientID).Msg("WhatsappClient event channel closed")
				return nil, nil
			}
			log.Debug().Str("clientID", clientID).Type("whatsmeowEventType", evt).Msg("received raw event from WhatsappClient.EventChan")

			if apiEvent := whatsapp.ToAPIEvent(evt, clientID); apiEvent != nil {
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
// sendMessage handles the /clients/{clientID}/messages/send endpoint.
// It sends a text message and returns the sent message details.
func (a *API) sendMessage(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for send message request")
		return nil, ErrClientNotFound
	}

	var msgReq struct {
		JID  string `json:"jid"`
		Text string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&msgReq); err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("invalid request body for send message")
		return nil, ErrInvalidRequest.Wrap(err)
	}

	parsedJID, err := types.ParseJID(msgReq.JID)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("jid", msgReq.JID).Msg("invalid JID format for send message")
		return nil, ErrInvalidJID.Wrap(err)
	}

	resp, err := waClient.SendTextMessage(parsedJID, msgReq.Text)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("jid", msgReq.JID).Msg("failed to send message")
		return nil, ErrInternalServerError.Wrap(err)
	}

	sentMessage, found := waClient.GetMessage(resp.ID)
	if !found {
		log.Error().Str("clientID", clientID).Str("messageID", resp.ID).Msg("sent message not found in memory store after sending")
		return nil, ErrInternalServerError.Wrap(fmt.Errorf("message with ID %s not found after sending", resp.ID))
	}

	senderJID, err := types.ParseJID(sentMessage.SenderJID)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("messageID", resp.ID).Msg("failed to parse sender JID")
		return nil, ErrInternalServerError.Wrap(err)
	}

	sentMessage.SenderJID = fmt.Sprintf("%s@%s", senderJID.User, senderJID.Server)

	log.Info().Str("clientID", clientID).Str("messageID", resp.ID).Msg("message sent successfully")
	return sentMessage, nil
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
// getChats handles the /clients/{clientID}/chats endpoint.
// Retrieves all contacts and groups for the client.
func (a *API) getChats(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for get chats request")
		return nil, ErrClientNotFound
	}

	var chats []models.Chat

	whatsmeowContacts, err := waClient.Client.Store.Contacts.GetAllContacts(r.Context())
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("failed to get contacts")
		return nil, ErrInternalServerError.Wrap(err)
	} else {
		for jid, contactInfo := range whatsmeowContacts {
			isGroup := jid.Server == "g.us"

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

	whatsmeowGroups, err := waClient.Client.GetJoinedGroups()
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("failed to get joined groups")
		return nil, ErrInternalServerError.Wrap(err)
	} else {
		for _, groupInfo := range whatsmeowGroups {
			chat := models.Chat{
				JID:     groupInfo.JID.String(),
				Name:    groupInfo.Name,
				IsGroup: true,
			}
			if groupInfo.Topic != "" {
				chat.Description = groupInfo.Topic
			}
			chats = append(chats, chat)
		}
	}

	log.Info().Str("clientID", clientID).Int("chatCount", len(chats)).Msg("chats retrieved successfully")
	return chats, nil
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
// getChat handles the /clients/{clientID}/chats/{chatID} endpoint.
// Retrieves details for a single chat.
func (a *API) getChat(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID, err := url.QueryUnescape(chi.URLParam(r, "clientID"))
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("invalid client ID format for get chat")
		return nil, ErrInvalidJID.Wrap(fmt.Errorf("failed to unescape clientID: %w", err))
	}

	chatID, err := url.QueryUnescape(chi.URLParam(r, "chatID"))
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Msg("invalid chat ID format for get chat")
		return nil, ErrInvalidJID.Wrap(fmt.Errorf("failed to unescape chatID: %w", err))
	}

	log.Debug().Str("chatID", chatID).Msg("retrieving chat details")

	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for get chat request")
		return nil, ErrClientNotFound
	}

	parsedChatJID, err := types.ParseJID(chatID)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("invalid chat ID format for get chat")
		return nil, ErrInvalidJID.Wrap(fmt.Errorf("failed to parse JID: %w", err))
	}

	contactInfo, err := waClient.Client.Store.Contacts.GetContact(r.Context(), parsedChatJID)
	if err != nil {
		log.Warn().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("chat not found in store")
		return nil, ErrClientNotFound.Wrap(err)
	}

	log.Debug().Interface("contactInfo", contactInfo).Msg("retrieved contact info")

	pfpURL := ""
	pfpInfo, err := waClient.Client.GetProfilePictureInfo(parsedChatJID, &whatsmeow.GetProfilePictureParams{
		Preview: true,
	})
	if err != nil {
		log.Warn().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("failed to get profile picture info")
		// Do not return an error here, as the chat can still be returned without a profile picture.
	} else {
		pfpURL = pfpInfo.URL
	}

	isGroup := parsedChatJID.Server == "g.us"

	modifiedJID := fmt.Sprintf("%s@%s", parsedChatJID.User, parsedChatJID.Server)

	name := modifiedJID
	if contactInfo.BusinessName != "" {
		name = contactInfo.BusinessName
	} else if contactInfo.FullName != "" {
		name = contactInfo.FullName
	}

	chat := models.Chat{
		JID:     modifiedJID,
		Name:    name,
		IsGroup: isGroup,
		Pfp:     pfpURL,
	}

	if isGroup {
		groupInfo, err := waClient.Client.GetGroupInfo(parsedChatJID)
		if err != nil {
			log.Error().Err(err).Str("clientID", clientID).Str("chatID", chatID).Msg("failed to get group info")
			// Do not return an error here, as the chat can still be returned without group details.
		} else {
			chat.Name = groupInfo.Name

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

	log.Info().Str("clientID", clientID).Str("chatID", chatID).Msg("chat details retrieved successfully")
	return chat, nil
}

// getMessageByID handles the /clients/{clientID}/messages/{messageID} endpoint.
// Retrieves a single message by its ID.
// getMessageByID handles the /clients/{clientID}/messages/{messageID} endpoint.
// Retrieves a single message by its ID.
func (a *API) getMessageByID(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	messageID := chi.URLParam(r, "messageID")

	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for get message by ID request")
		return nil, ErrClientNotFound
	}

	msg, found := waClient.GetMessage(messageID)
	if !found {
		log.Warn().Str("clientID", clientID).Str("messageID", messageID).Msg("message not found in memory store")
		return nil, ErrMessageNotFound
	}

	log.Info().Str("clientID", clientID).Str("messageID", messageID).Msg("message retrieved successfully from memory store")
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
// disconnect handles the /clients/{clientID}/disconnect endpoint.
// It disconnects the WhatsApp client and cleans up the session.
func (a *API) disconnect(w http.ResponseWriter, r *http.Request) (interface{}, *APIError) {
	clientID := chi.URLParam(r, "clientID")
	waClient, ok := a.clientManager.Get(clientID)
	if !ok {
		log.Warn().Str("clientID", clientID).Msg("client not found for disconnect request")
		return nil, ErrClientNotFound
	}

	waClient.Close()
	a.clientManager.Remove(clientID)

	log.Info().Str("clientID", clientID).Msg("client disconnected and removed successfully")
	return map[string]string{"message": "Client disconnected successfully"}, nil
}

// sendSSEEvent is a helper function to marshal and send an APIEvent over an SSE connection.
// sendSSEEvent is a helper function to marshal and send an APIEvent over an SSE connection.
func (a *API) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}, clientID string) {
	apiEvent := &models.APIEvent{
		ClientId: clientID,
		Type:     eventType,
		Data:     data,
	}

	jsonData, err := json.Marshal(apiEvent)
	if err != nil {
		log.Error().Err(err).Str("clientID", clientID).Str("apiEventType", eventType).Msg("error marshaling APIEvent data for SSE")
		return
	}

	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
	log.Debug().Str("clientID", clientID).Str("apiEventType", eventType).Msg("sent APIEvent over SSE")
}


