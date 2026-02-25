# MyCAE Tracker

A comprehensive project management and inventory tracking system for engineering teams.

**⚠️ Security Notice**: This is a public repository containing only source code. All sensitive configuration (passwords, API keys, .env files) have been removed. See deployment guide for setup instructions.

## Features

- **Project Management**: Track projects, tasks, and team assignments
- **Inventory Management**: Manage equipment, checkouts, and maintenance
- **Team Workload**: Visualize engineer availability and assignments
- **Timesheet Tracking**: Log hours and track project progress
- **Invoice Management**: Create and manage client invoices
- **Purchase Orders**: Track vendor POs and received invoices
- **Multi-currency Support**: Handle multiple currencies with automatic exchange rates
- **Email Notifications**: Automated email alerts for various events

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeORM
- **Database**: MySQL
- **Authentication**: JWT

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 5.7+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MuhdHadi110/MyCAE-App-v3.git
   cd MyCAE-App-v3
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

3. Configure environment:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your database credentials and secrets

4. Run database migrations:
   ```bash
   cd backend
   npm run migration:run
   ```

5. Start development:
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

## Deployment

### cPanel Deployment (Recommended)

See `CPANEL_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

**Quick Overview:**
1. Set up Git Version Control in cPanel
2. Clone this repository
3. Upload your `.env` file with production credentials
4. Deploy using `.cpanel.yml` configuration

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=generate_a_secure_random_string_min_32_chars
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Email Configuration (Optional)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_email_password

# Google reCAPTCHA (Optional)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

## Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Use strong, unique passwords (20+ characters)
- ✅ Generate cryptographically secure JWT secrets
- ✅ Enable HTTPS in production
- ✅ Regularly update npm dependencies
- ✅ Use environment-specific configurations

## Project Structure

```
MyCAE-App-v3/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── entities/        # Database models (TypeORM)
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Authentication, validation
│   │   ├── migrations/      # Database migrations
│   │   └── utils/           # Helper functions
│   └── package.json
├── src/                     # React frontend
│   ├── components/          # UI components
│   ├── screens/             # Page components
│   ├── services/            # API calls
│   └── types/               # TypeScript types
├── .cpanel.yml             # cPanel deployment config
└── package.json
```

## License

Private - All rights reserved.

## Support

For deployment assistance, refer to `CPANEL_DEPLOYMENT_GUIDE.md`.

---

**Note**: This repository contains only source code. All sensitive data, backups, and configuration files with real credentials have been excluded from version control for security.
