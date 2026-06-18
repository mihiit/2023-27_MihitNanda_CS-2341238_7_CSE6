# SAIL IT Helpdesk System

**Enterprise-Grade IT Ticket Management System**  
Steel Authority of India Limited (SAIL)

---

## 📋 System Architecture

```
sail-helpdesk/
├── frontend/          # React + Tailwind CSS (Port 3000)
├── backend/           # Node.js + Express REST API (Port 5000)
├── database/          # Oracle SQL scripts
└── docs/              # Architecture diagrams & API docs
```

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, React Router v6 |
| Backend | Node.js 18+, Express 4, JWT, Multer |
| Database | Oracle Database 19c/21c/XE |
| ORM/Driver | oracledb (Node.js Oracle driver) |
| Email | Nodemailer (SMTP) |
| Auth | JWT + bcryptjs, rate limiting, account lockout |
| Logging | Winston |

---

## 🗄️ Database Schema (Oracle)

### Tables
| Table | Purpose |
|-------|---------|
| DEPARTMENTS | Organization departments |
| CATEGORIES | Ticket categories with SLA hours |
| PRIORITIES | Priority levels (Critical/High/Medium/Low) |
| USERS | Employee and admin accounts |
| TICKETS | Core ticket records |
| TICKET_REPLIES | Conversation thread per ticket |
| TICKET_ATTACHMENTS | File attachments |
| TICKET_HISTORY | Full audit trail of all changes |
| NOTIFICATIONS | In-app notifications |
| AUDIT_LOGS | System-wide audit log |

### Key Design Decisions
- `TICKET_REF` (e.g. `SAIL-1000`) auto-generated via trigger
- `DUE_DATE` auto-computed from priority SLA on insert
- `TICKET_HISTORY` captures every field change with old/new values
- All sequences start at 1; ticket sequence starts at 1000

---

## ✉️ Email Notification Workflow

```
Ticket Created → Creator receives confirmation email
       ↓
Admins get in-app notification of new ticket
       ↓
Agent replies → Creator receives reply notification
       ↓
Status changes (e.g. IN_PROGRESS) → Creator notified
       ↓
Ticket RESOLVED → Creator receives resolution email + feedback prompt
       ↓
Creator submits satisfaction rating (1–5 stars)
```

**Email Templates:**
- `ticketCreated` – Confirmation with ticket ref
- `ticketUpdated` – Status change notification
- `ticketClosed`  – Resolution notification
- `newReply`      – New reply notification

---

## 🔐 Role-Based Access Control

| Feature | EMPLOYEE | AGENT | ADMIN | SUPERADMIN |
|---------|----------|-------|-------|------------|
| View own tickets | ✅ | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ | ✅ |
| Create tickets | ✅ | ✅ | ✅ | ✅ |
| Update ticket status | ❌ | ✅ | ✅ | ✅ |
| Assign tickets | ❌ | ❌ | ✅ | ✅ |
| Internal notes | ❌ | ✅ | ✅ | ✅ |
| User management | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ |

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Oracle Database 19c/21c/XE
- Oracle Instant Client (for oracledb npm package)

### 1. Oracle Database Setup

```sql
-- Connect as SYSDBA and create schema user
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";
GRANT CONNECT, RESOURCE, CREATE SESSION TO sail_helpdesk;
GRANT UNLIMITED TABLESPACE TO sail_helpdesk;

-- Run scripts as sail_helpdesk user
@database/schema/01_create_tables.sql
@database/data/02_sample_data.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Oracle credentials and SMTP settings

npm install
npm run dev       # Development
npm start         # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start         # Development (http://localhost:3000)
npm run build     # Production build
```

### 4. Environment Variables (backend/.env)

```env
# Oracle DB
ORACLE_USER=sail_helpdesk
ORACLE_PASSWORD=SailHelp@2024
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=8h

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=SAIL IT Helpdesk <helpdesk@sail.in>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

---

## 👥 Demo Credentials

| Role | Employee ID | Password |
|------|------------|---------|
| Super Admin | EMP001 | SAIL@2024 |
| Admin | EMP002 | SAIL@2024 |
| IT Agent | EMP003 | SAIL@2024 |
| Employee | EMP004 | SAIL@2024 |
| Employee | EMP005 | SAIL@2024 |

---

## 📡 API Documentation

### Authentication
```
POST   /api/auth/login           Login
GET    /api/auth/me              Get current user
POST   /api/auth/change-password Change password
```

### Tickets
```
GET    /api/tickets              List tickets (with filters)
POST   /api/tickets              Create ticket (multipart/form-data)
GET    /api/tickets/:id          Get ticket detail (replies, history, attachments)
PUT    /api/tickets/:id          Update ticket (admin/agent only)
POST   /api/tickets/:id/replies  Add reply
POST   /api/tickets/:id/feedback Submit satisfaction rating
```

### Admin
```
GET    /api/admin/dashboard      KPI dashboard data
GET    /api/admin/users          List users (paginated)
POST   /api/admin/users          Create user
PUT    /api/admin/users/:id      Update user
GET    /api/admin/reports/summary Report with date range
GET    /api/admin/audit-logs     Audit logs (superadmin)
```

### Lookup (public, no auth)
```
GET    /api/lookup/departments   List departments
GET    /api/lookup/categories    List categories
GET    /api/lookup/priorities    List priorities
```

### Query Parameters (GET /api/tickets)
```
page        Page number (default: 1)
limit       Results per page (default: 10)
status      Filter by status (OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED, CANCELLED)
priority_id Filter by priority ID
cat_id      Filter by category ID
dept_id     Filter by department ID
search      Search in subject and ticket_ref
sort        Sort field (created_at, updated_at, priority_id, status)
order       ASC or DESC
```

---

## 📁 Project Structure

```
sail-helpdesk/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Oracle connection pool
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT auth, RBAC, audit middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # Login, profile, password
│   │   │   ├── tickets.js         # Ticket CRUD + replies
│   │   │   └── admin.js           # Dashboard, users, reports
│   │   ├── utils/
│   │   │   ├── logger.js          # Winston logger
│   │   │   └── emailService.js    # Nodemailer + templates
│   │   └── server.js              # Express app entry
│   ├── uploads/                   # File upload storage
│   ├── logs/                      # Application logs
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Layout.jsx     # Sidebar, Header, AppLayout
│   │   │       └── UI.jsx         # Badges, Modal, Pagination, etc.
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state provider
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── TicketListPage.jsx
│   │   │   ├── TicketDetailPage.jsx
│   │   │   ├── CreateTicketPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsersPage.jsx
│   │   │   ├── AdminReportsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── utils/
│   │   │   └── api.js             # Axios client with interceptors
│   │   ├── App.jsx                # Routes + auth guards
│   │   ├── index.js
│   │   └── index.css              # Tailwind + custom components
│   ├── tailwind.config.js
│   └── package.json
│
└── database/
    ├── schema/
    │   └── 01_create_tables.sql   # Full Oracle DDL
    └── data/
        └── 02_sample_data.sql     # Demo data
```

---

## 🔧 Oracle Instant Client Setup

The `oracledb` npm package requires Oracle Instant Client:

**Linux:**
```bash
# Download from oracle.com/database/technologies/instant-client
sudo apt install libaio1
export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_x:$LD_LIBRARY_PATH
```

**Windows:**
```
1. Download Instant Client Basic from oracle.com
2. Add directory to PATH
3. Run npm install in backend/
```

**macOS:**
```bash
brew install instantclient-basic
```

---

## 🐳 Docker Deployment (Optional)

```yaml
# docker-compose.yml example
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - ORACLE_CONNECT_STRING=oracle-db:1521/XEPDB1
    depends_on: [oracle-db]

  frontend:
    build: ./frontend
    ports: ["3000:80"]

  oracle-db:
    image: gvenzl/oracle-xe:21-slim
    environment:
      - ORACLE_PASSWORD=SailHelp@2024
    volumes:
      - oracle-data:/opt/oracle/oradata
```

---

## 🔒 Security Features

- **JWT Authentication** with 8-hour expiry
- **Account lockout** after 5 failed login attempts (30-minute lock)
- **Rate limiting**: 100 req/15min globally, 20 req/15min on login
- **Helmet.js** security headers
- **bcryptjs** password hashing (salt rounds: 10)
- **Input validation** with express-validator
- **File upload restrictions**: MIME type whitelist, 10MB limit
- **RBAC** at both route and business-logic level
- **Audit logs** for all actions (stored in Oracle)

---

## 🏭 Production Deployment

1. Set `NODE_ENV=production` in backend .env
2. Build frontend: `npm run build`
3. Serve frontend build with Nginx/Apache
4. Use PM2 for Node.js process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "sail-helpdesk"
   pm2 startup
   pm2 save
   ```
5. Configure SSL/TLS certificates
6. Set up Oracle connection pool appropriately for load

---

## 📞 Support

**SAIL IT Department**  
Email: helpdesk@sail.in  
Extension: 1234  
Hours: Monday–Friday, 8:00 AM – 8:00 PM IST

---

© 2024 Steel Authority of India Limited. All rights reserved.
