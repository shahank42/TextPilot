package whatsapp

import (
	"context"
	"fmt"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/zerolog/log"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"github.com/textpilot-whatsmeow/internal/models"
)

// WhatsappClient is a wrapper around the whatsmeow client.
type WhatsappClient struct {
	Client    *whatsmeow.Client
	EventChan <-chan interface{} // Public channel for reading events
	eventChan chan<- interface{} // Private channel for writing events

	// In-memory message store
	messages      map[string]models.Message
	messagesMutex sync.RWMutex
}

// NewWhatsappClient creates a new WhatsappClient instance.
// It initializes the whatsmeow client, sets up the event handler, and configures the message store.
func NewWhatsappClient(dbPath string) (*WhatsappClient, error) {
	container, err := sqlstore.New(context.Background(), "sqlite3", fmt.Sprintf("file:%s?_foreign_keys=on", dbPath), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create SQL store: %w", err)
	}

	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get device from store: %w", err)
	}

	internalEventChan := make(chan interface{}, 100)

	client := whatsmeow.NewClient(deviceStore, nil)

	client.ManualHistorySyncDownload = true

	wc := &WhatsappClient{
		Client:    client,
		EventChan: internalEventChan,
		eventChan: internalEventChan,
		messages:  make(map[string]models.Message),
	}

	client.AddEventHandler(wc.eventHandler)

	return wc, nil
}

// eventHandler is the callback function for whatsmeow events.
// It processes incoming events, stores relevant messages, and pushes events to the internal channel.
func (wc *WhatsappClient) eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		log.Info().Str("from", v.Info.Sender.String()).Str("text", v.Message.GetConversation()).Msg("received message")

		msgText := v.Message.GetConversation()
		if msgText == "" {
			msgText = *v.Message.GetExtendedTextMessage().Text
		}

		// Convert whatsmeow message to our API Message model and store it.
		msg := models.Message{
			ID:        v.Info.ID,
			Timestamp: v.Info.Timestamp.Unix(),
			Text:      msgText,
			ChatJID:   v.Info.Chat.String(),
			SenderJID: v.Info.Sender.String(),
			IsFromMe:  v.Info.IsFromMe,
		}

		wc.messagesMutex.Lock()
		wc.messages[msg.ID] = msg
		wc.messagesMutex.Unlock()
		log.Debug().Str("messageID", msg.ID).Msg("stored message in memory")

		wc.eventChan <- v
		log.Debug().Msg("pushed Message event to channel")
	case *events.QR:
		log.Info().Strs("codes", v.Codes).Msg("received QR code event")
		wc.eventChan <- v
		log.Debug().Msg("pushed QR event to channel")
	case *events.Connected:
		log.Info().Msg("WhatsApp client connected")
		wc.eventChan <- v
		log.Debug().Msg("pushed Connected event to channel")
	case *events.Disconnected:
		log.Info().Msg("WhatsApp client disconnected")
		wc.eventChan <- v
		log.Debug().Msg("pushed Disconnected event to channel")
		wc.Close() // Trigger close on disconnect
	case *events.LoggedOut:
		log.Info().Msg("WhatsApp client logged out")
		wc.eventChan <- v
		log.Debug().Msg("pushed LoggedOut event to channel")
		wc.Close() // Trigger close on logout
	default:
		log.Debug().Type("eventType", v).Msg("received unhandled event type")
	}
}

// Connect connects the client to WhatsApp.
func (wc *WhatsappClient) Connect() error {
	// Connect to WhatsApp. This is a blocking call until connected or an error occurs.
	return wc.Client.Connect()
}

// Disconnect disconnects the client from WhatsApp.
func (wc *WhatsappClient) Disconnect() {
	// Disconnect from WhatsApp.
	wc.Client.Disconnect()
}

// Close disconnects the whatsmeow client and cleans up resources.
// It also closes the event channel to signal to consumers that no more events will be sent.
func (wc *WhatsappClient) Close() {
	log.Info().Msg("closing WhatsappClient")
	// Disconnect whatsmeow client
	wc.Client.Disconnect()
	// Close the event channel to signal to consumers that no more events will come.
	// This will cause the `range` over EventChan in SSE handler to terminate.
	close(wc.eventChan)
	log.Info().Msg("WhatsappClient closed")
}

// SendTextMessage sends a text message to the given JID.
// It returns the whatsmeow SendResponse and any error encountered.
func (wc *WhatsappClient) SendTextMessage(jid types.JID, text string) (whatsmeow.SendResponse, error) {
	// Send a simple text message.
	resp, err := wc.Client.SendMessage(context.Background(), jid, &proto.Message{Conversation: &text})
	if err != nil {
		return resp, fmt.Errorf("failed to send message: %w", err)
	}

	// Store the sent message in the in-memory map for retrieval by ID.
	msg := models.Message{
		ID:        resp.ID,
		Timestamp: time.Now().Unix(), // Use current time as whatsmeow response might not have it
		Text:      text,
		ChatJID:   jid.String(),
		SenderJID: wc.Client.Store.ID.String(), // Our client's JID
		IsFromMe:  true,
	}

	wc.messagesMutex.Lock()
	wc.messages[msg.ID] = msg
	wc.messagesMutex.Unlock()
	log.Debug().Str("messageID", msg.ID).Msg("Stored sent message in memory.")

	return resp, nil
}

// GetMessage retrieves a message from the in-memory store by its ID.
// It returns the message and a boolean indicating if the message was found.
func (wc *WhatsappClient) GetMessage(messageID string) (models.Message, bool) {
	wc.messagesMutex.RLock()
	defer wc.messagesMutex.RUnlock()
	msg, ok := wc.messages[messageID]
	return msg, ok
}

// ToAPIEvent converts a whatsmeow event to a models.APIEvent.
// It returns nil if the event is not one we want to forward.
func ToAPIEvent(evt interface{}, clientID string) *models.APIEvent {
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
