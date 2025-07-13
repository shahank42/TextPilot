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

// NewWhatsappClient creates a new WhatsappClient.
func NewWhatsappClient(dbPath string) (*WhatsappClient, error) {
	// Initialize the SQL store for whatsmeow.
	// This is where whatsmeow will store session data, messages, etc.
	// We're using SQLite for simplicity, storing data in the provided dbPath.
	container, err := sqlstore.New(context.Background(), "sqlite3", fmt.Sprintf("file:%s?_foreign_keys=on", dbPath), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create SQL store: %w", err)
	}

	// Get the first device from the store. This represents a WhatsApp session.
	// If no session exists, whatsmeow will create a new one.
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get device from store: %w", err)
	}

	// Create a buffered channel for events. This allows us to send events
	// without blocking if the receiver isn't immediately ready.
	internalEventChan := make(chan interface{}, 100) // Buffer of 100 events

	// Create the whatsmeow client.
	client := whatsmeow.NewClient(deviceStore, nil)

	// --- IMPORTANT: Disable automatic history sync ---
	client.ManualHistorySyncDownload = true
	// ---------------------------------------------------

	// Create our wrapper struct.
	wc := &WhatsappClient{
		Client:    client,
		EventChan: internalEventChan, // Expose the read-only channel publicly
		eventChan: internalEventChan, // Keep the write-only channel private
		messages:  make(map[string]models.Message),
	}

	// Register our event handler with the whatsmeow client.
	client.AddEventHandler(wc.eventHandler)

	return wc, nil
}

// eventHandler is the callback function for whatsmeow events.
func (wc *WhatsappClient) eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		log.Info().Str("from", v.Info.Sender.String()).Str("text", v.Message.GetConversation()).Msg("Received message")

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
		log.Debug().Str("messageID", msg.ID).Msg("Stored message in memory.")

		wc.eventChan <- v
		log.Debug().Msg("Pushed Message event to channel.")
	case *events.QR:
		log.Info().Strs("codes", v.Codes).Msg("Received QR code event")
		wc.eventChan <- v
		log.Debug().Msg("Pushed QR event to channel.")
	case *events.Connected:
		log.Info().Msg("WhatsApp client connected.")
		wc.eventChan <- v
		log.Debug().Msg("Pushed Connected event to channel.")
	case *events.Disconnected:
		log.Info().Msg("WhatsApp client disconnected.")
		wc.eventChan <- v
		log.Debug().Msg("Pushed Disconnected event to channel.")
		wc.Close() // Trigger close on disconnect
	case *events.LoggedOut:
		log.Info().Msg("WhatsApp client logged out.")
		wc.eventChan <- v
		log.Debug().Msg("Pushed LoggedOut event to channel.")
		wc.Close() // Trigger close on logout
	default:
		log.Debug().Type("eventType", v).Msg("Received unhandled event type")
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
func (wc *WhatsappClient) Close() {
	log.Info().Msg("Closing WhatsappClient...")
	// Disconnect whatsmeow client
	wc.Client.Disconnect()
	// Close the event channel to signal to consumers that no more events will come.
	// This will cause the `range` over EventChan in SSE handler to terminate.
	close(wc.eventChan)
	log.Info().Msg("WhatsappClient closed.")
}

// SendTextMessage sends a text message to the given JID.
func (wc *WhatsappClient) SendTextMessage(jid types.JID, text string) (whatsmeow.SendResponse, error) {
	// Send a simple text message.
	resp, err := wc.Client.SendMessage(context.Background(), jid, &proto.Message{Conversation: &text})
	if err != nil {
		return resp, err
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
func (wc *WhatsappClient) GetMessage(messageID string) (models.Message, bool) {
	wc.messagesMutex.RLock()
	defer wc.messagesMutex.RUnlock()
	msg, ok := wc.messages[messageID]
	return msg, ok
}
