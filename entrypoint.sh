#!/bin/bash

# Start the backend server in the background
echo "Starting server..."
bun run --cwd ./apps/server start &

# Start the frontend server in the foreground
echo "Starting web..."
bun run --cwd ./apps/web serve --port 4173 --host 0.0.0.0
