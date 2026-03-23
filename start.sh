
#!/bin/bash

# Ensure script is run from project root
cd "$(dirname "$0")"

echo "=== Starting Tableau Push Ding Service ==="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed. Please install Bun first (https://bun.sh)."
    exit 1
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    bun install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && bun install && cd ..
fi

# Start Backend in background
echo "Starting Backend (Elysia)..."
bun run index.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to initialize DB
sleep 2

# Start Frontend in background
echo "Starting Frontend (Vite)..."
cd frontend
bun run dev --host > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend PID: $FRONTEND_PID"

echo "========================================"
echo "Service is running!"
echo "Backend Logs: tail -f backend.log"
echo "Frontend Logs: tail -f frontend.log"
echo "Access Frontend at: http://<YOUR_SERVER_IP>:5173"
echo "========================================"
echo "Press Ctrl+C to stop both services."

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Keep script running
wait
