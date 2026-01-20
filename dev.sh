#!/bin/bash

# Kill any existing processes on port 3000 and 3001
echo "Cleaning up existing processes..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null

echo "Starting Kawayan AI (Backend + Frontend)..."

# Run the backend and frontend concurrently
npm run dev:full
