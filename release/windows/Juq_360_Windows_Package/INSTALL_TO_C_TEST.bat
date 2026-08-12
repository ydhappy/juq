@echo off
setlocal EnableExtensions

set "PACKAGE_DIR=%~dp0"
set "TARGET_DIR=C:\test\Juq_360"

echo.
echo [Juq 360] Windows deployment package installer
echo Target: %TARGET_DIR%

if not exist "C:\test" mkdir "C:\test"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

robocopy "%PACKAGE_DIR%source" "%TARGET_DIR%" /E /XD node_modules .git .expo dist /XF .DS_Store
set "COPY_EXIT=%ERRORLEVEL%"

if %COPY_EXIT% GEQ 8 (
  echo.
  echo Source copy failed. Robocopy exit code: %COPY_EXIT%
  pause
  exit /b %COPY_EXIT%
)

copy /Y "%PACKAGE_DIR%BUILD_APK.bat" "%TARGET_DIR%\BUILD_APK.bat" >nul
copy /Y "%PACKAGE_DIR%BUILD_APK.ps1" "%TARGET_DIR%\BUILD_APK.ps1" >nul
copy /Y "%PACKAGE_DIR%EXPO_TOKEN_TEMPLATE.txt" "%TARGET_DIR%\EXPO_TOKEN_TEMPLATE.txt" >nul

echo.
echo Installation complete.
echo Run: %TARGET_DIR%\BUILD_APK.bat
pause
