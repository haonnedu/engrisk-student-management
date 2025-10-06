@echo off
echo Setting up permissions for deployment scripts...

REM Note: On Windows, these scripts will be executed on the Linux server
REM The permissions will be set when the scripts are copied to the server

echo.
echo Scripts created:
echo - auto-deploy.sh
echo - initial-setup.sh
echo.
echo To use these scripts on Linux server:
echo 1. Copy files to server
echo 2. Run: chmod +x auto-deploy.sh initial-setup.sh
echo 3. Execute: ./initial-setup.sh (for first time setup)
echo 4. Execute: ./auto-deploy.sh (for deployments)
echo.
echo Setup completed!
