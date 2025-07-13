package api

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/MarceloPetrucio/go-scalar-api-reference"
)

// NewRouter creates a new chi.Router and registers the API handlers.
func (a *API) NewRouter() *chi.Mux {
	router := chi.NewRouter()

	// Add common middleware.
	router.Use(middleware.Logger)    // Logs HTTP requests.
	router.Use(middleware.Recoverer) // Recovers from panics and logs the error.
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://*"},
	}))

	// Top-level route for connecting a new client (server generates ID).
	router.Post("/clients/connect", MakeHTTPHandler(a.connect))

	// Routes for existing clients (use clientID from path).
	router.Route("/clients/{clientID}", func(r chi.Router) {
		r.Get("/events", MakeHTTPHandler(a.events))
		r.Post("/disconnect", MakeHTTPHandler(a.disconnect))
		r.Post("/messages/send", MakeHTTPHandler(a.sendMessage))
		r.Get("/messages/{messageID}", MakeHTTPHandler(a.getMessageByID))
		r.Get("/chats", MakeHTTPHandler(a.getChats))
		r.Get("/chats/{chatID}", MakeHTTPHandler(a.getChat))
	})

	router.Get("/reference", func(w http.ResponseWriter, r *http.Request) {
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

	return router
}
