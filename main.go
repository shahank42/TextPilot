package main

import (
	"net/http"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/textpilot-whatsmeow/internal/api"
	"github.com/textpilot-whatsmeow/internal/manager"
)

func main() {
	// Configure zerolog for human-readable output during development.
	// In production, you might want to remove this to output JSON logs.
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	// Set global log level to info. Change to zerolog.DebugLevel for more verbose logs.
	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	// Initialize the ClientManager.
	clientManager := manager.NewClientManager()

	// Reload existing sessions from disk.
	clientManager.ReloadSessions()

	// Create a new API instance with the client manager.
	api := api.NewAPI(clientManager)

	// Get the configured router.
	router := api.NewRouter()

	// Define the port to listen on.
	port := "8082"
	log.Info().Msgf("Server starting on port %s", port)

	// Start the HTTP server.
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
