@echo off
REM SAIL Helpdesk Oracle Database Setup Script
REM This script sets up the complete database

setlocal enabledelayedexpansion

cd /d "C:\Users\mihit nanda\Downloads\SAIL_Helpdesk_UPDATED\sail-helpdesk"

echo.
echo ============================================
echo Step 1: Creating Schema and Tables
echo ============================================

sqlplus -S C##sail_helpdesk/SailHelp2024@XEPDB1 @schema_setup.sql

if !errorlevel! neq 0 (
    echo ERROR: Failed to create schema
    pause
    exit /b 1
)

echo.
echo ============================================
echo Step 2: Loading Sample Data
echo ============================================

sqlplus -S C##sail_helpdesk/SailHelp2024@XEPDB1 @database\data\02_sample_data.sql

if !errorlevel! neq 0 (
    echo ERROR: Failed to load sample data
    pause
    exit /b 1
)

echo.
echo ============================================
echo SUCCESS: Database setup complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Update backend\.env file with credentials
echo 2. Run: npm install (in backend folder)
echo 3. Run: npm run dev (to start server)
echo.
echo Database Credentials:
echo   User: C##sail_helpdesk
echo   Password: SailHelp2024
echo   Service: XEPDB1
echo.
pause
