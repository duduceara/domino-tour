@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 iniciar_teste.py
) else (
  python iniciar_teste.py
)
pause
