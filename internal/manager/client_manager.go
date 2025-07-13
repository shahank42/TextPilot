package manager

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/rs/zerolog/log"
	"github.com/textpilot-whatsmeow/internal/whatsapp"
)

// ClientManager holds a collection of active whatsmeow clients.
type ClientManager struct {
	clients map[string]*whatsapp.WhatsappClient
	mutex   sync.Mutex
}

// NewClientManager creates a new ClientManager.
func NewClientManager() *ClientManager {
	return &ClientManager{
		clients: make(map[string]*whatsapp.WhatsappClient),
	}
}

// Add adds a new client to the manager.
func (m *ClientManager) Add(clientID string, client *whatsapp.WhatsappClient) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.clients[clientID] = client
}

// Get retrieves a client from the manager.
func (m *ClientManager) Get(clientID string) (*whatsapp.WhatsappClient, bool) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	client, ok := m.clients[clientID]
	return client, ok
}

// Remove removes a client from the manager.
func (m *ClientManager) Remove(clientID string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	delete(m.clients, clientID)
}

// ReloadSessions scans the sessions directory and reloads existing client sessions.
func (m *ClientManager) ReloadSessions() {
	log.Info().Msg("Attempting to reload existing sessions...")
	sessionDir := "sessions"
	files, err := os.ReadDir(sessionDir)
	if err != nil {
		if os.IsNotExist(err) {
			log.Info().Msg("Sessions directory does not exist, no sessions to reload.")
			return
		}
		log.Error().Err(err).Msg("Failed to read sessions directory")
		return
	}

	for _, file := range files {
		if file.IsDir() {
			clientID := file.Name()
			log.Info().Str("clientID", clientID).Msg("Reloading session")
			dbPath := filepath.Join(sessionDir, clientID, "session.db")

			// Check if the session database file actually exists.
			if _, err := os.Stat(dbPath); os.IsNotExist(err) {
				log.Warn().Str("clientID", clientID).Msg("Session directory found but session.db is missing, skipping.")
				continue
			}

			waClient, err := whatsapp.NewWhatsappClient(dbPath)
			if err != nil {
				log.Error().Err(err).Str("clientID", clientID).Msg("Failed to create WhatsApp client for reloading")
				continue
			}

			m.Add(clientID, waClient)

			go func(client *whatsapp.WhatsappClient, id string) {
				log.Info().Str("clientID", id).Msg("Attempting to reconnect reloaded client")
				if err := client.Connect(); err != nil {
					log.Error().Err(err).Str("clientID", id).Msg("Failed to connect reloaded client")
				}
			}(waClient, clientID)
		}
	}
	log.Info().Msg("Finished reloading sessions.")
}
