@echo off
echo Testing Backend Server...
echo.

curl -f http://localhost:8000/api/v1/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend server is running!
    curl http://localhost:8000/api/v1/health
) else (
    echo ❌ Backend server is not accessible
    echo Make sure the backend server is running on port 8000
)

echo.
pause