@echo off
setlocal EnableExtensions DisableDelayedExpansion

rem =============================================================================
rem  scan-files.bat — recursive file inventory → CSV
rem
rem  Place/copy this script (and scan-files.ps1 beside it) into any folder or
rem  drive root and double-click, or run:
rem    scan-files.bat
rem    scan-files.bat "D:\"
rem    scan-files.bat "D:\Some Folder"
rem
rem  Read-only: does NOT delete, move, or modify user files.
rem  Requires Windows PowerShell (built in). No admin rights required.
rem =============================================================================

cd /d "%~dp0" 2>nul
if errorlevel 1 (
  echo ERROR: Cannot change to script directory "%~dp0"
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "PS1=%SCRIPT_DIR%scan-files.ps1"

if not exist "%PS1%" (
  echo ERROR: Missing companion script:
  echo   "%PS1%"
  echo Keep scan-files.bat and scan-files.ps1 in the same folder.
  pause
  exit /b 1
)

if not "%~1"=="" (
  set "ROOT=%~f1"
) else (
  set "ROOT=%CD%"
)

if not exist "%ROOT%\" (
  echo ERROR: Root folder does not exist or is not accessible:
  echo   "%ROOT%"
  pause
  exit /b 1
)

set "STAMP="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'" 2^>nul`) do set "STAMP=%%I"
if not defined STAMP set "STAMP=%RANDOM%%RANDOM%"

set "OUTFILE=%ROOT%\file-inventory-%STAMP%.csv"

echo.
echo ============================================================
echo  File inventory scan
echo ============================================================
echo  Root:   %ROOT%
echo  Output: %OUTFILE%
echo  Mode:   read-only recursive scan (PowerShell stream)
echo ============================================================
echo.
echo Scanning... progress updates every ~5 seconds.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -Root "%ROOT%" -OutFile "%OUTFILE%"
set "PS_EXIT=%ERRORLEVEL%"

echo.
if not "%PS_EXIT%"=="0" (
  echo Scan finished with errors (exit %PS_EXIT%).
  echo If the CSV is partial, some folders may be inaccessible without elevation.
  if exist "%OUTFILE%" echo Partial CSV may still be useful: "%OUTFILE%"
  pause
  exit /b %PS_EXIT%
)

if not exist "%OUTFILE%" (
  echo ERROR: Expected CSV was not created:
  echo   "%OUTFILE%"
  pause
  exit /b 1
)

echo CSV ready:
echo   %OUTFILE%
echo.
pause
endlocal
exit /b 0
