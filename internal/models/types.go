package models

// SendMessageRequest represents the request body for sending a message.
// @Description Request body for sending a message.
type SendMessageRequest struct {
	JID  string `json:"jid" example:"1234567890@s.whatsapp.net"` // JID of the recipient
	Text string `json:"text" example:"Hello from TextPilot!"`    // Text content of the message
}

// Message represents a single WhatsApp message.
// @Description Represents a single WhatsApp message.
type Message struct {
	ID        string `json:"id" example:"ABCD123"`                          // Unique ID of the message
	Timestamp int64  `json:"timestamp" example:1678886400`                  // Unix timestamp of the message
	Text      string `json:"text" example:"Hello World!"`                   // Text content of the message
	ChatJID   string `json:"chatJID" example:"1234567890@s.whatsapp.net"`   // JID of the chat the message belongs to
	SenderJID string `json:"senderJID" example:"0987654321@s.whatsapp.net"` // JID of the sender
	IsFromMe  bool   `json:"isFromMe" example:true`                         // Indicates if the message was sent by the client
	// Chat      Chat
}

// Chat represents a single WhatsApp chat (one-on-one or group).
// @Description Represents a single WhatsApp chat (one-on-one or group).
type Chat struct {
	JID          string        `json:"jid" example:"1234567890@s.whatsapp.net"` // JID of the chat
	Name         string        `json:"name" example:"John Doe"`                 // Display name of the chat
	Pfp          string        `json:"pfp" example:""`
	IsGroup      bool          `json:"isGroup" example:false`                                     // Indicates if the chat is a group
	Description  string        `json:"description,omitempty" example:"Group for project updates"` // Description for group chats
	Participants []Participant `json:"participants,omitempty"`                                    // List of participants for group chats
}

// Participant represents a single participant in a group chat.
// @Description Represents a single participant in a group chat.
type Participant struct {
	JID     string `json:"jid" example:"1234567890@s.whatsapp.net"` // JID of the participant
	IsAdmin bool   `json:"isAdmin" example:false`                   // Indicates if the participant is an admin
}

// APIEvent represents a standardized event to be sent over SSE.
// @Description Represents a standardized event to be sent over Server-Sent Events (SSE).
type APIEvent struct {
	ClientId string      `json:"clientId" example:"client123"`
	Type     string      `json:"event" example:"qr_code"` // Type of the event (e.g., "qr_code", "message", "status")
	Data     interface{} `json:"data"`                    // Event data, can be a string (for QR) or a Message object
}
