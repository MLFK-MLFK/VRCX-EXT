@echo off
REM ============================================================================
REM  VRCX one-click build
REM
REM  Usage:
REM     VRCX-build.bat            interactive menu
REM     VRCX-build.bat 1          frontend only        (fast)
REM     VRCX-build.bat 2          frontend + backend
REM     VRCX-build.bat 3          full build + zip + installer
REM
REM  This file is intentionally ASCII-only: cmd parses a .bat using the codepage
REM  active at startup, so non-ASCII text breaks it even with "chcp 65001".
REM ============================================================================

setlocal EnableExtensions
cd /d "%~dp0"
title VRCX Build

set "MODE=%~1"
set "INTERACTIVE=1"
if not "%MODE%"=="" set "INTERACTIVE=0"

echo ============================================================
echo   VRCX build
echo   %CD%
echo ============================================================

if not exist "Dotnet\VRCX-Cef.csproj" (
    echo.
    echo [ERROR] Dotnet\VRCX-Cef.csproj not found.
    echo         Put this .bat in the repository root and run it from there.
    goto :fail
)

if /i "%MODE%"=="fast" set "MODE=1"
if /i "%MODE%"=="full" set "MODE=2"
if /i "%MODE%"=="pack" set "MODE=3"
if /i "%MODE%"=="release" set "MODE=3"

if "%MODE%"=="" goto :menu
if "%MODE%"=="0" goto :eof
if "%MODE%"=="1" goto :check
if "%MODE%"=="2" goto :check
if "%MODE%"=="3" goto :check
echo.
echo [ERROR] Unknown option: %MODE%
goto :fail

:menu
echo.
echo   [1] Quick     frontend only                 ~10s
echo   [2] Full      frontend + C# backend         ~2-3min
echo   [3] Release   full build + zip + installer  ~5-8min
echo   [0] Exit
echo.
set "MODE="
set /p "MODE=Select 0-3: "
if "%MODE%"=="" goto :menu
if "%MODE%"=="0" goto :eof
if "%MODE%"=="1" goto :check
if "%MODE%"=="2" goto :check
if "%MODE%"=="3" goto :check
echo.
echo [ERROR] Invalid option: %MODE%
goto :fail

REM ---------------------------------------------------------------- tools ----
:check
echo.
echo --- Checking tools ---

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] node not found in PATH. Install Node.js 24 or newer.
    goto :fail
)
for /f "delims=" %%v in ('node --version 2^>nul') do set "NODEVER=%%v"
echo   node      %NODEVER%

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH.
    goto :fail
)
echo   npm       ok

if "%MODE%"=="1" goto :deps

where dotnet >nul 2>&1
if errorlevel 1 (
    echo [ERROR] dotnet not found in PATH. Install the .NET 10 SDK.
    goto :fail
)
for /f "delims=" %%v in ('dotnet --version 2^>nul') do set "DOTNETVER=%%v"
echo   dotnet    %DOTNETVER%

if not "%MODE%"=="3" goto :deps

where 7z >nul 2>&1
if errorlevel 1 goto :check_7z_fallback
set "SEVENZIP=7z"
goto :check_nsis

:check_7z_fallback
if exist "C:\Program Files\7-Zip\7z.exe" (
    set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
    echo   7z        C:\Program Files\7-Zip\7z.exe
    goto :check_nsis
)
echo [ERROR] 7-Zip not found. Needed for option 3.
goto :fail

:check_nsis
if exist "C:\Program Files (x86)\NSIS\makensis.exe" (
    set "MAKENSIS=C:\Program Files (x86)\NSIS\makensis.exe"
    echo   makensis  C:\Program Files ^(x86^)\NSIS\makensis.exe
    goto :deps
)
where makensis >nul 2>&1
if errorlevel 1 (
    echo [ERROR] NSIS not found. Needed for option 3.
    echo         Expected: C:\Program Files ^(x86^)\NSIS\makensis.exe
    goto :fail
)
set "MAKENSIS=makensis"
echo   makensis  ok

REM ----------------------------------------------------------------- deps ----
:deps
echo.
echo --- Dependencies ---
if exist "node_modules" (
    echo   node_modules present, skipping npm ci
) else (
    echo   node_modules missing, running npm ci ...
    call npm ci --loglevel=error
    if errorlevel 1 (
        echo [ERROR] npm ci failed.
        goto :fail
    )
)

REM -------------------------------------------------------------- backend ----
if "%MODE%"=="1" goto :frontend

echo.
echo --- Building .NET backend ---
dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -t:"Restore;Clean;Build" -maxcpucount --self-contained
if errorlevel 1 (
    echo [ERROR] dotnet build failed.
    goto :fail
)

REM ------------------------------------------------------------- frontend ----
:frontend
echo.
echo --- Building frontend ---
call npm run prod
if errorlevel 1 (
    echo [ERROR] npm run prod failed.
    goto :fail
)

REM -------------------------------------------------------------- junction ---
echo.
echo --- Linking build\Cef\html -^> build\html ---
call "build-scripts\make-junction.cmd"
if errorlevel 1 (
    echo [WARN] make-junction reported an error; check build\Cef\html manually.
)

if not exist "build\Cef\VRCX.exe" (
    echo.
    echo [WARN] build\Cef\VRCX.exe is missing. Run option 2 to build the backend.
)

if not "%MODE%"=="3" goto :done

REM --------------------------------------------------------------- package ---
echo.
echo --- Packaging ---
for /f "delims=" %%d in ('powershell -NoProfile -Command "Get-Date -format yyyyMMdd"') do set "TODAY=%%d"
set "ZIPNAME=VRCX_%TODAY%.zip"
set "SETUPNAME=VRCX_%TODAY%_Setup.exe"
echo   date      %TODAY%

echo   creating %ZIPNAME% ...
pushd "build\Cef"
"%SEVENZIP%" a -tzip "%ZIPNAME%" * -mx=7 -xr0!*.log -xr0!*.pdb >nul
if errorlevel 1 (
    popd
    echo [ERROR] 7-Zip failed.
    goto :fail
)
popd
move /y "build\Cef\%ZIPNAME%" "%ZIPNAME%" >nul
if errorlevel 1 (
    echo [ERROR] Could not move %ZIPNAME% to the root folder.
    goto :fail
)

echo   creating %SETUPNAME% ...
REM Version must be read from the repository root, before entering Installer.
set "VER="
set /p VER=<Version
pushd "Installer"
> version_define.nsh echo !define PRODUCT_VERSION_FROM_FILE "%VER%.0"
"%MAKENSIS%" installer.nsi >nul
if errorlevel 1 (
    popd
    echo [ERROR] makensis failed.
    goto :fail
)
popd
move /y "Installer\VRCX_Setup.exe" "%SETUPNAME%" >nul
if errorlevel 1 (
    echo [ERROR] Could not move VRCX_Setup.exe to the root folder.
    goto :fail
)

echo   creating SHA256SUMS.txt ...
powershell -NoProfile -Command "$h = (Get-FileHash '%SETUPNAME%' -Algorithm SHA256).Hash.ToLower(); Write-Output ($h + '  %SETUPNAME%')" > SHA256SUMS.txt

REM ------------------------------------------------------------------ done ---
:done
echo.
echo ============================================================
echo   BUILD OK
echo ============================================================
if "%MODE%"=="1" (
    echo   Frontend only. Run:  build\Cef\VRCX.exe
    echo   Note: close any running VRCX first, or the new one exits silently.
) else (
    echo   Run:  build\Cef\VRCX.exe
    echo   Note: close any running VRCX first, or the new one exits silently.
)
if "%MODE%"=="3" (
    echo.
    echo   %ZIPNAME%
    echo   %SETUPNAME%
    echo   SHA256SUMS.txt
)
echo.
goto :finish

:fail
echo.
echo ============================================================
echo   BUILD FAILED
echo ============================================================
echo.
REM Pause before endlocal: variables set inside setlocal are lost after it.
if "%INTERACTIVE%"=="1" pause
endlocal
exit /b 1

:finish
if "%INTERACTIVE%"=="1" pause
endlocal
exit /b 0
