@echo off
title LexGuard AI Suite Launcher
color 0A
mode con: cols=85 lines=25

echo ===================================================================================
echo               L E X G U A R D   A I   -   P R E M I U M   S U I T E                
echo ===================================================================================
echo.
echo  [SYSTEM] Initializing LexGuard AI Dev Gateway...
echo.
echo  This script will automatically:
echo    1. Boot the FastAPI Backend Daemon (Port 8000)
echo    2. Spin up the Vite React Frontend Daemon (Port 5173/5174)
echo    3. Launch your browser directly to the Glassmorphism Suite
echo.
echo ===================================================================================
echo.

:: 1. Boot Backend Server in a new window
echo  [1/3] Starting FastAPI AI Compliance Backend...
start "LexGuard Backend Server" cmd /c "cd /d "%~dp0backend" && echo [LexGuard Backend] Activating environment... && call venv\Scripts\activate && echo [LexGuard Backend] Booting Uvicorn server... && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Small delay to let the backend allocate its port
timeout /t 2 /nobreak >nul

:: 2. Boot Frontend Server in a new window
echo  [2/3] Starting Vite React Frontend Developer Console...
start "LexGuard Frontend Client" cmd /c "cd /d "%~dp0frontend" && echo [LexGuard Frontend] Booting Vite development cluster... && npm run dev"

:: Small delay to let Vite spin up
timeout /t 3 /nobreak >nul

:: 3. Launch Web Application in default browser
echo  [3/3] Launching compliance dashboard in your default browser...
start http://localhost:5173/
echo  * Landing Page: http://localhost:5173/
echo  * App Dashboard: http://localhost:5173/app

echo.
echo ===================================================================================
echo  S U C C E S S : LexGuard AI Suite is now fully operational!
echo ===================================================================================
echo.
echo  * Backend Server: http://localhost:8000/
echo  * Frontend Client: http://localhost:5173/ (or http://localhost:5174/)
echo.
echo  To shut down, simply close the active command prompt windows.
echo  Press any key to exit this launcher...
echo ===================================================================================
pause >nul
