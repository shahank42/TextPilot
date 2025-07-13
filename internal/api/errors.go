package api

import (
	"fmt"
	"net/http"
)

// APIError represents a structured error for API responses.
type APIError struct {
	Message    string `json:"message"`
	Code       string `json:"code"`
	HTTPStatus int    `json:"-"` // Exclude from JSON marshaling
}

// Error implements the error interface for APIError.
func (e *APIError) Error() string {
	return fmt.Sprintf("API Error: %s (Code: %s, Status: %d)", e.Message, e.Code, e.HTTPStatus)
}

// Predefined API Errors
var (
	ErrClientNotFound       = &APIError{Message: "Client not found", Code: "CLIENT_NOT_FOUND", HTTPStatus: http.StatusNotFound}
	ErrInvalidRequest       = &APIError{Message: "Invalid request", Code: "INVALID_REQUEST", HTTPStatus: http.StatusBadRequest}
	ErrInvalidJID           = &APIError{Message: "Invalid JID format", Code: "INVALID_JID", HTTPStatus: http.StatusBadRequest}
	ErrClientAlreadyExists  = &APIError{Message: "Client with this ID already exists", Code: "CLIENT_ALREADY_EXISTS", HTTPStatus: http.StatusConflict}
	ErrStreamingUnsupported = &APIError{Message: "Streaming unsupported", Code: "STREAMING_UNSUPPORTED", HTTPStatus: http.StatusInternalServerError}
	ErrInternalServerError  = &APIError{Message: "Internal server error", Code: "INTERNAL_SERVER_ERROR", HTTPStatus: http.StatusInternalServerError}
	ErrMessageNotFound      = &APIError{Message: "Message not found", Code: "MESSAGE_NOT_FOUND", HTTPStatus: http.StatusNotFound}
)
