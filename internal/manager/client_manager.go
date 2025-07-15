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
	sessionDir string
}

// NewClientManager creates a new ClientManager.
func NewClientManager(sessionDir string) *ClientManager {
	return &ClientManager{
		clients: make(map[string]*whatsapp.WhatsappClient),
		sessionDir: sessionDir,
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
// It iterates through subdirectories in the "sessions" directory, attempts to create
// a WhatsappClient for each, and reconnects them.
func (m *ClientManager) ReloadSessions() {
	log.Info().Msg("attempting to reload existing sessions")
	
	files, err := os.ReadDir(m.sessionDir)
	if err != nil {
		if os.IsNotExist(err) {
			log.Info().Msg("sessions directory does not exist, no sessions to reload")
			return
		}
		log.Error().Err(err).Msg("failed to read sessions directory")
		return
	}

	for _, file := range files {
		if file.IsDir() {
			clientID := file.Name()
			log.Info().Str("clientID", clientID).Msg("reloading session")
			dbPath := filepath.Join(m.sessionDir, clientID, "session.db")

			// Check if the session database file actually exists.
			if _, err := os.Stat(dbPath); os.IsNotExist(err) {
				log.Warn().Str("clientID", clientID).Msg("session directory found but session.db is missing, skipping")
				continue
			}

			waClient, err := whatsapp.NewWhatsappClient(dbPath)
			if err != nil {
				log.Error().Err(err).Str("clientID", clientID).Msg("failed to create WhatsApp client for reloading")
				continue
			}

			m.Add(clientID, waClient)

			go func(client *whatsapp.WhatsappClient, id string) {
				log.Info().Str("clientID", id).Msg("attempting to reconnect reloaded client")
				if err := client.Connect(); err != nil {
					log.Error().Err(err).Str("clientID", id).Msg("failed to connect reloaded client")
				}
			}(waClient, clientID)
		}
	}
	log.Info().Msg("Finished reloading sessions.")
}
