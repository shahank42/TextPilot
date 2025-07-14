# Stage 1: Frontend Builder
FROM oven/bun:latest AS frontend-builder

WORKDIR /app/frontend

# Copy dependency files and install
COPY frontend/package.json frontend/bun.lock ./
RUN bun install

# Copy the rest of the frontend code and build
COPY frontend/ ./
RUN bun run build

# Stage 2: Backend Builder
FROM golang:alpine AS backend-builder

WORKDIR /app

# Copy Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend source code
COPY . .

# Copy built frontend assets from the first stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install CGO dependencies for go-sqlite3
RUN apk add --no-cache gcc musl-dev

# Build the Go application with CGO enabled
RUN CGO_ENABLED=1 go build -ldflags="-w -s" -o /app/server .

# Stage 3: Final Production Image
FROM alpine:latest

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the compiled binary from the backend-builder stage
COPY --from=backend-builder /app/server .

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 8082

# Run the application
ENTRYPOINT ["./server"]
