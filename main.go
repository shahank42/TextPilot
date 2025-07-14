package main

import (
	"embed"
	"net/http"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/textpilot-whatsmeow/internal/api"
	"github.com/textpilot-whatsmeow/internal/manager"
)

//go:embed all:frontend/dist
var embeddedFiles embed.FS

// main is the entry point of the TextPilot application.
// It initializes logging, sets up the WhatsApp client manager,
// configures API routes, and starts the HTTP server.
func main() {
	// Configure zerolog for human-readable output during development.
	// In production, you might want to remove this to output JSON logs.
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	// Set global log level to info. Change to zerolog.DebugLevel for more verbose logs.
	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	sessionDir := os.Getenv("SESSION_DIR")
	if sessionDir == "" {
		sessionDir = "sessions" // Default session directory
	}

	// Initialize the ClientManager.
	clientManager := manager.NewClientManager(sessionDir)

	// Reload existing sessions from disk.
	clientManager.ReloadSessions()

	// Create a new API instance with the client manager.
	api := api.NewAPI(clientManager, embeddedFiles, sessionDir)

	// Get the configured router.
	router := api.NewRouter()

	// Define the port to listen on.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082" // Default port
	}
	log.Info().Msgf("Server starting on port %s", port)

	// Start the HTTP server.
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal().Err(err).Msg("failed to start server")
	}
}