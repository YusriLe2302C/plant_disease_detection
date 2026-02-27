@echo off
echo ========================================
echo   AgroDetect AI - Live Camera System
echo ========================================
echo.

echo [1/4] Starting MongoDB...
start "MongoDB" cmd /k "mongod"
timeout /t 3 /nobreak >nul

echo [2/4] Starting ML Service (Flask)...
start "ML Service" cmd /k "cd AI_MODELS && python ml_service.py"
timeout /t 5 /nobreak >nul

echo [3/4] Starting Backend (Node.js)...
start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend (Vite)...
start "Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo ML API:   http://localhost:5001
echo.
echo For mobile access, find your PC IP:
echo   Run: ipconfig
echo   Then open: http://YOUR_PC_IP:5173/live-scan
echo.
pause
