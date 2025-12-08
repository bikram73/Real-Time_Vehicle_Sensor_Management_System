@echo off
echo ================================================
echo Vehicle Sensor Management System - TypeScript Build
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking for TypeScript installation...
where tsc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [2/4] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [2/4] TypeScript already installed
)

echo [3/4] Compiling TypeScript...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: TypeScript compilation failed
    pause
    exit /b 1
)

echo [4/4] Compilation successful!
echo.
echo ================================================
echo Output: static/dist/app.js
echo ================================================
echo.
echo Ready to run: python run.py
echo.
pause
