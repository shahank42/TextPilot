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
	WrappedError error  `json:"-"` // The underlying error, excluded from JSON
}

// Error implements the error interface for APIError.
func (e *APIError) Error() string {
	if e.WrappedError != nil {
		return fmt.Sprintf("API Error: %s (Code: %s, Status: %d, Wrapped: %v)", e.Message, e.Code, e.HTTPStatus, e.WrappedError)
	}
	return fmt.Sprintf("API Error: %s (Code: %s, Status: %d)", e.Message, e.Code, e.HTTPStatus)
}

// Unwrap provides compatibility for Go 1.13 error chains.
func (e *APIError) Unwrap() error {
	return e.WrappedError
}

// Wrap returns a new APIError that wraps the given error.
func (e *APIError) Wrap(err error) *APIError {
	newErr := *e // Create a copy of the original APIError
	newErr.WrappedError = err
	return &newErr
}

// Predefined API Errors
var (
	// ErrClientNotFound indicates that the requested client was not found.
	ErrClientNotFound       = &APIError{Message: "Client not found", Code: "CLIENT_NOT_FOUND", HTTPStatus: http.StatusNotFound}
	// ErrInvalidRequest indicates that the request was malformed or invalid.
	ErrInvalidRequest       = &APIError{Message: "Invalid request", Code: "INVALID_REQUEST", HTTPStatus: http.StatusBadRequest}
	// ErrInvalidJID indicates that the provided JID (Jabber ID) format is invalid.
	ErrInvalidJID           = &APIError{Message: "Invalid JID format", Code: "INVALID_JID", HTTPStatus: http.StatusBadRequest}
	// ErrClientAlreadyExists indicates that a client with the given ID already exists.
	ErrClientAlreadyExists  = &APIError{Message: "Client with this ID already exists", Code: "CLIENT_ALREADY_EXISTS", HTTPStatus: http.StatusConflict}
	// ErrStreamingUnsupported indicates that streaming is not supported for the current operation.
	ErrStreamingUnsupported = &APIError{Message: "Streaming unsupported", Code: "STREAMING_UNSUPPORTED", HTTPStatus: http.StatusInternalServerError}
	// ErrInternalServerError indicates an unexpected error occurred on the server.
	ErrInternalServerError  = &APIError{Message: "Internal server error", Code: "INTERNAL_SERVER_ERROR", HTTPStatus: http.StatusInternalServerError}
	// ErrMessageNotFound indicates that the requested message was not found.
	ErrMessageNotFound      = &APIError{Message: "Message not found", Code: "MESSAGE_NOT_FOUND", HTTPStatus: http.StatusNotFound}
)
