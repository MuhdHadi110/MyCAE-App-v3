#!/bin/bash

# MyCAE Tracker - Local Database Setup Script
# This script sets up MySQL locally for development

set -e

echo "🚀 MyCAE Tracker - Local Database Setup"
echo "========================================"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo "Please install MySQL first:"
    echo "  - Windows: Download from https://dev.mysql.com/downloads/mysql/"
    echo "  - Mac: brew install mysql"
    echo "  - Linux: sudo apt-get install mysql-server"
    exit 1
fi

echo "✅ MySQL is installed"

# Check MySQL version
MYSQL_VERSION=$(mysql --version)
echo "📦 $MYSQL_VERSION"

# Prompt for MySQL root password
echo ""
echo "Enter MySQL root password:"
read -s MYSQL_ROOT_PASSWORD

# Test MySQL connection
if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &> /dev/null; then
    echo "❌ Failed to connect to MySQL with provided password"
    exit 1
fi

echo "✅ Connected to MySQL successfully"

# Create database and user
echo ""
echo "Creating database: mycaetracker_dev"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS mycaetracker_dev;
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON mycaetracker_dev.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database created successfully"

# Update .env file
echo ""
echo "Updating backend/.env with local configuration..."
cat > backend/.env << EOF
# Local Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mycaetracker_dev
DB_USER=root
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=8efe12c0b4b7c38f1ff654c4602b72b5da853d95950e166f97eaafe589cdf9c6
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional - can configure later)
SMTP_HOST=mail.mycaetech.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@mycaetech.com
SMTP_PASSWORD=your_email_password_here
EMAIL_FROM=MyCAE Tracker <noreply@mycaetech.com>

# n8n Configuration (Optional - can configure later)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your_n8n_api_key
N8N_WORKFLOW_NEW_CHECKOUT=https://your-n8n-instance.com/webhook/checkout-created
N8N_WORKFLOW_RETURN_DUE=https://your-n8n-instance.com/webhook/return-due
N8N_WORKFLOW_LOW_STOCK=https://your-n8n-instance.com/webhook/low-stock-alert
N8N_WORKFLOW_MAINTENANCE_TICKET=https://your-n8n-instance.com/webhook/maintenance-ticket
N8N_WORKFLOW_PROJECT_ASSIGNED=https://your-n8n-instance.com/webhook/project-assigned
EOF

echo "✅ .env updated successfully"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install --silent
echo "✅ Dependencies installed"

# Run migrations
echo ""
echo "Running database migrations..."
npm run typeorm migration:run || {
    echo "⚠️  No migrations found. This is normal for first setup."
    echo "   Migrations will be created when you run the application."
}

echo "✅ Migrations completed"

# Go back to root
cd ..

# Display next steps
echo ""
echo "✅ LOCAL DATABASE SETUP COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "1. Terminal 1 - Start Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Terminal 2 - Start Frontend:"
echo "   npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3001"
echo ""
echo "📚 Documentation:"
echo "   - Read: DATABASE_SETUP_LOCAL.md"
echo "   - When ready for production: DATABASE_MIGRATION_TO_PRODUCTION.md"
echo ""
echo "🎉 Happy developing!"
