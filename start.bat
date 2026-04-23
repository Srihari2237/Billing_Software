@echo off
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║   Anju Trading Billing System v2.0   ║
echo  ╚═══════════════════════════════════════╝
echo.

:: Start backend in a new window
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "Anju Trading - Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait 2 seconds then start frontend
timeout /t 2 /nobreak > nul

echo [2/2] Starting Next.js frontend on http://localhost:3000 ...
start "Anju Trading - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo  Both servers starting...
echo  Open http://localhost:3000 in your browser.
echo.
pause
