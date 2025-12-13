# MyCAE Equipment Tracker

A comprehensive equipment inventory and project management system built with React, Node.js, Express, MySQL, and n8n automation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)

## 🚀 Features

### Equipment Management
- ✅ Comprehensive inventory tracking
- ✅ Barcode scanning support
- ✅ Bulk import/export via CSV
- ✅ Low stock alerts
- ✅ Equipment checkout system
- ✅ Return tracking and notifications

### Project Management
- ✅ Project tracking (client projects)
- ✅ Research project management
- ✅ Timesheet logging
- ✅ Team member assignments
- ✅ CRM for business contacts

### Maintenance
- ✅ Maintenance ticket system
- ✅ Priority levels
- ✅ Assignment tracking
- ✅ Resolution notes

### Automation & Notifications
- ✅ n8n workflow integration
- ✅ Email notifications (checkout, return reminders, low stock)
- ✅ Automated alerts for maintenance tickets
- ✅ Custom automation workflows

### User Management
- ✅ Role-based access control (Engineer, Senior Engineer, Manager, Admin)
- ✅ JWT authentication
- ✅ User profiles with avatars
- ✅ Department and position tracking

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **html5-qrcode** - Barcode scanning

### Backend
- **Node.js 18+** - Runtime
- **Express** - Web framework
- **TypeORM** - ORM for MySQL
- **MySQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting

### Automation
- **n8n** - Workflow automation (open-source alternative to Zapier)

### Deployment
- **iCore Technology GX100GB** - Web hosting
- **cPanel** - Server management
- **Let's Encrypt** - SSL certificates

## 📋 Prerequisites

- Node.js 18 or higher
- MySQL 5.7 or higher
- npm or yarn package manager
- iCore hosting account (or any cPanel hosting with Node.js support)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mycaetracker.git
cd MycaeTracker
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create `backend/.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mycae_management
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (configure your SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=MyCAE Tracker <your_email@gmail.com>

# n8n (optional for development)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- API Health Check: `http://localhost:3001/health`

## 📦 Project Structure

```
MycaeTracker/
├── backend/                  # Backend API
│   ├── src/
│   │   ├── config/          # Database and configuration
│   │   ├── entities/        # TypeORM entities
│   │   ├── middleware/      # Auth and other middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (email, n8n)
│   │   └── server.ts        # Express server
│   ├── package.json
│   └── tsconfig.json
│
├── src/                     # Frontend React app
│   ├── components/          # Reusable UI components
│   ├── screens/             # Page components
│   ├── store/               # Zustand state management
│   ├── services/            # API service layer
│   ├── types/               # TypeScript types
│   ├── lib/                 # Utilities
│   └── App.tsx              # Main app component
│
├── public/                  # Static assets
├── dist/                    # Production build output
├── package.json
└── vite.config.ts
```

## 🔐 Default User Roles

After deployment, create users with these roles:

- **Engineer** - Basic access, can view inventory and log time
- **Senior Engineer** - Can manage inventory and view finances
- **Manager** - Can assign projects and approve timesheets
- **Admin** - Full system access

## 📖 API Documentation

### Authentication Endpoints

```
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login user
```

### Inventory Endpoints

```
GET    /api/inventory           - Get all inventory items
GET    /api/inventory/:id       - Get single item
POST   /api/inventory           - Create new item
PUT    /api/inventory/:id       - Update item
DELETE /api/inventory/:id       - Delete item
POST   /api/inventory/bulk/create - Bulk create items
```

### Checkout Endpoints

```
GET    /api/checkouts           - Get all checkouts
POST   /api/checkouts/bulk      - Create bulk checkout
PUT    /api/checkouts/:id/return - Return checked out items
```

### Maintenance Endpoints

```
GET    /api/maintenance         - Get all tickets
POST   /api/maintenance         - Create ticket
PUT    /api/maintenance/:id     - Update ticket
```

All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

## 🔧 n8n Automation Setup

### Install n8n

**Option 1: npm (Development)**
```bash
npm install -g n8n
n8n start
```

**Option 2: Docker (Production)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option 3: n8n Cloud**
Sign up at [n8n.cloud](https://n8n.cloud) - Free tier available

### Create Workflows

1. **Low Stock Alert**
   - Trigger: Webhook (POST)
   - Action: Send email to procurement team

2. **Checkout Confirmation**
   - Trigger: Webhook (POST)
   - Action: Send email confirmation to user

3. **Return Reminder**
   - Trigger: Schedule (daily)
   - Action: Check for overdue returns, send reminders

4. **Maintenance Notification**
   - Trigger: Webhook (POST)
   - Action: Send email to assigned technician

Add webhook URLs to `backend/.env`:
```env
N8N_WORKFLOW_LOW_STOCK=https://n8n.yourdomain.com/webhook/low-stock-alert
N8N_WORKFLOW_NEW_CHECKOUT=https://n8n.yourdomain.com/webhook/checkout-created
```

## 🚀 Production Deployment

See [ICORE_DEPLOYMENT_GUIDE.md](./ICORE_DEPLOYMENT_GUIDE.md) for complete step-by-step deployment instructions for iCore Technology GX100GB hosting.

### Quick Deployment Steps

1. **Database**: Create MySQL database in cPanel
2. **Backend**: Upload and configure Node.js app
3. **Frontend**: Build and upload to `public_html`
4. **n8n**: Set up automation workflows
5. **Email**: Configure SMTP in cPanel

## 📊 Database Schema

The application uses the following main tables:

- `users` - User accounts and authentication
- `inventory` - Equipment inventory items
- `checkouts` - Equipment checkout records
- `maintenance_tickets` - Maintenance tracking
- `projects` - Client projects
- `research_projects` - Research projects
- `timesheets` - Time logging
- `clients` - Business contacts (CRM)

TypeORM handles automatic schema creation in development mode.

## 🔒 Security Features

- ✅ JWT authentication with configurable expiry
- ✅ Bcrypt password hashing
- ✅ Helmet.js security headers
- ✅ Express rate limiting
- ✅ CORS configuration
- ✅ SQL injection protection (via TypeORM)
- ✅ Input validation
- ✅ Environment variable protection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for MyCAE equipment management needs
- Designed for iCore Technology GX100GB hosting
- Integrates with n8n for powerful automation
- Uses open-source technologies throughout

## 📞 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact: [your-email@mycae.com.my]

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with accounting software
- [ ] Multi-language support
- [ ] Barcode label printing
- [ ] Asset depreciation tracking
- [ ] Equipment reservation system
- [ ] Integration with IoT sensors

---

**Built with ❤️ for MyCAE**
