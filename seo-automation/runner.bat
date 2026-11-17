@echo off
REM ==============================================================================
REM TechInPedia SEO Automation - Windows Batch Launcher
REM Can be triggered manually or scheduled in Windows Task Scheduler
REM ==============================================================================

cd /d "%~dp0"
echo Starting TechInPedia Autonomous SEO and Marketing Engine...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0orchestrator.ps1" -Mode Full
echo.
echo Process complete. Exit Code: %ERRORLEVEL%
