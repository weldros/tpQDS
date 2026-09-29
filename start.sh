#!/bin/bash

echo "======================================================"
echo " Starting tpQKD Quantum Teleportation Framework"
echo "======================================================"

# 1. Setup Backend
echo -e "\n[1/4] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
fi
source venv/bin/activate
echo "Installing backend dependencies..."
pip install -r requirements.txt -q

# 2. Setup Frontend
echo -e "\n[2/4] Setting up Frontend dependencies..."
cd frontend
npm install --silent
cd ..

# 3. Run Both Servers
echo -e "\n[3/4] Booting FastAPI Backend Server..."
source venv/bin/activate
python -m uvicorn backend.api.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo -e "\n[4/4] Booting Vite Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo -e "\n======================================================"
echo -e " All systems operational!"
echo -e " Backend API running at:  http://127.0.0.1:8000"
echo -e " Frontend UI running at:  http://localhost:5173"
echo -e "======================================================\n"
echo "Press Ctrl+C to stop both servers."

# Wait for user interrupt
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
