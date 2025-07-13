package api

import (
	"encoding/json"
	"net/http"

	"github.com/rs/zerolog/log"
)

// HandlerFunc is a custom handler type that returns a data interface and an error.
type HandlerFunc func(w http.ResponseWriter, r *http.Request) (interface{}, *APIError)

// MakeHTTPHandler wraps our custom HandlerFunc to handle errors centrally.
func MakeHTTPHandler(handler HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, apiErr := handler(w, r)
		if apiErr != nil {
			// Log the error
			log.Error().Err(apiErr).Str("errorCode", apiErr.Code).Int("httpStatus", apiErr.HTTPStatus).Msg(apiErr.Message)

			// Respond with structured JSON error
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(apiErr.HTTPStatus)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": apiErr})
			return
		}

		// If no error, respond with the data
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(data)
	}
}
