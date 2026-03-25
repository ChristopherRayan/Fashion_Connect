@echo off
echo Starting FashionConnect Servers...
echo.

echo 1. Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo 2. Starting Frontend Server...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers should be starting now.
echo Frontend will be available at http://localhost:5173
echo Backend API will be available at http://localhost:8000
echo.
pause