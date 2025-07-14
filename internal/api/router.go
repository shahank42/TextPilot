package api

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/MarceloPetrucio/go-scalar-api-reference"
)

// spaFileSystem is a wrapper for an embed.FS that serves index.html for non-existent files.
// This is necessary for single-page applications (SPAs) where routing is handled client-side.
type spaFileSystem struct {
	embed.FS
	root string
}

// Open opens a file from the embedded filesystem.
// If the file doesn't exist, it serves the index.html file from the root.
func (e *spaFileSystem) Open(name string) (fs.File, error) {
	file, err := e.FS.Open(filepath.Join(e.root, name))
	if err == nil {
		return file, nil
	}
	if os.IsNotExist(err) {
		return e.FS.Open(filepath.Join(e.root, "index.html"))
	}
	return nil, err
}

// NewRouter creates a new chi.Router and registers the API handlers.
// It sets up middleware, API routes, and serves the embedded frontend SPA.
func (a *API) NewRouter() *chi.Mux {
	router := chi.NewRouter()

	// Add common middleware.
	router.Use(middleware.Logger)    // Logs HTTP requests.
	router.Use(middleware.Recoverer) // Recovers from panics and logs the error.
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://*"},
	}))

	// API routes
	router.Group(func(r chi.Router) {
		// Top-level route for connecting a new client (server generates ID).
		r.Post("/clients/connect", MakeHTTPHandler(a.connect))

		// Routes for existing clients (use clientID from path).
		r.Route("/clients/{clientID}", func(r chi.Router) {
			r.Get("/events", MakeHTTPHandler(a.events))
			r.Post("/disconnect", MakeHTTPHandler(a.disconnect))
			r.Post("/messages/send", MakeHTTPHandler(a.sendMessage))
			r.Get("/messages/{messageID}", MakeHTTPHandler(a.getMessageByID))
			r.Get("/chats", MakeHTTPHandler(a.getChats))
			r.Get("/chats/{chatID}", MakeHTTPHandler(a.getChat))
		})

		r.Get("/reference", func(w http.ResponseWriter, r *http.Request) {
			htmlContent, err := scalar.ApiReferenceHTML(&scalar.Options{
				SpecURL: "./docs/swagger.json",
				CustomOptions: scalar.CustomOptions{
					PageTitle: "TextPilot API",
				},
				DarkMode: true,
			})

			if err != nil {
				fmt.Printf("%v", err)
			}

			fmt.Fprintln(w, htmlContent)
		})
	})

	// SPA Handler
	spaFS := &spaFileSystem{FS: a.embeddedFiles, root: "frontend/dist"}
	router.Handle("/*", http.FileServer(http.FS(spaFS)))

	return router
}
