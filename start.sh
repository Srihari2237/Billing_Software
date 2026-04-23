#!/bin/bash
echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   Anju Trading Billing System v2.0   ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# Start backend
echo "[1/2] Starting FastAPI backend on http://localhost:8000 ..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "[2/2] Starting Next.js frontend on http://localhost:3000 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  Both servers running."
echo "  Open http://localhost:3000 in your browser."
echo "  Press Ctrl+C to stop both."
echo ""

# Wait and kill both on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Stopped.'" EXIT
wait
