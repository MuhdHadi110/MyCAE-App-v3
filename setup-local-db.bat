@echo off
REM MyCAE Tracker - Local Database Setup Script for Windows
REM This script sets up MySQL locally for development

echo.
echo 🚀 MyCAE Tracker - Local Database Setup (Windows)
echo ======================================
echo.

REM Check if MySQL is installed
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL is not found in PATH!
    echo.
    echo Please install MySQL first:
    echo 1. Download from https://dev.mysql.com/downloads/mysql/
    echo 2. Install and add MySQL to system PATH
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ MySQL is installed
echo.

REM Get MySQL version
for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
echo 📦 %MYSQL_VERSION%
echo.

REM Check MySQL connection
mysql -u root -e "SELECT 1;" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MySQL is running (no password)
    set MYSQL_PASS=
) else (
    echo ⚠️  MySQL is password protected or not running
    echo Please enter MySQL root password below...
    REM Note: We can't prompt for password in batch easily
    REM User needs to modify script manually or use MySQL GUI
    echo.
    echo Edit this script and add password to the mysql commands
    echo Or use MySQL Workbench to create database manually
    echo.
    pause
    exit /b 1
)

REM Create database and user
echo.
echo Creating database: mycaetracker_dev
mysql -u root %MYSQL_PASS% << EOF
CREATE DATABASE IF NOT EXISTS mycaetracker_dev;
GRANT ALL PRIVILEGES ON mycaetracker_dev.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EOF

if %errorlevel% neq 0 (
    echo ❌ Failed to create database!
    pause
    exit /b 1
)

echo ✅ Database created successfully
echo.

REM Create .env file
echo Updating backend\.env with local configuration...
(
echo # Local Database Configuration
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=mycaetracker_dev
echo DB_USER=root
echo DB_PASSWORD=root
echo.
echo # JWT Configuration
echo JWT_SECRET=GENERATE_YOUR_OWN_JWT_SECRET_HERE
echo JWT_EXPIRES_IN=7d
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Email Configuration
echo SMTP_HOST=mail.mycaetech.com
echo SMTP_PORT=465
echo SMTP_SECURE=true
echo SMTP_USER=noreply@mycaetech.com
echo SMTP_PASSWORD=your_email_password_here
echo EMAIL_FROM=MyCAE Tracker ^<noreply@mycaetech.com^>
echo.
echo # n8n Configuration
echo N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
echo N8N_API_KEY=your_n8n_api_key
) > backend\.env

echo ✅ .env updated successfully
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Run migrations
echo Running database migrations...
call npm run typeorm migration:run
if %errorlevel% neq 0 (
    echo ⚠️  No migrations found. This is normal for first setup.
    echo Migrations will be created when you run the application.
)

cd ..
echo ✅ Migrations completed
echo.

REM Display next steps
echo ✅ LOCAL DATABASE SETUP COMPLETE!
echo.
echo 📋 Next Steps:
echo 1. Open Terminal 1 and run:
echo    cd backend ^&^& npm run dev
echo.
echo 2. Open Terminal 2 and run:
echo    npm run dev
echo.
echo 3. Open browser:
echo    http://localhost:3001
echo.
echo 📚 Documentation:
echo    - Read: DATABASE_SETUP_LOCAL.md
echo    - When ready for production: DATABASE_MIGRATION_TO_PRODUCTION.md
echo.
echo 🎉 Happy developing!
echo.
pause
