# SAIL Helpdesk – Deployment Guide

## Quick Start (Development)

### Step 1 – Oracle DB
```sql
-- Run as SYS/SYSDBA
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";
GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO sail_helpdesk;

-- As sail_helpdesk user:
@database/schema/01_create_tables.sql
@database/data/02_sample_data.sql
```

### Step 2 – Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set ORACLE_CONNECT_STRING, JWT_SECRET, SMTP_*
npm install
npm run dev
# API running at http://localhost:5000
```

### Step 3 – Frontend
```bash
cd frontend
npm install
npm start
# App running at http://localhost:3000
```

---

## Production Deployment (Linux/RHEL)

### 1. Oracle Instant Client
```bash
# Download Basic + SDK from oracle.com/instant-client
sudo rpm -ivh oracle-instantclient-basic-21.x.x.x86_64.rpm
echo /usr/lib/oracle/21/client64/lib > /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig
```

### 2. Node.js
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs
```

### 3. Backend
```bash
cd /opt/sail-helpdesk/backend
npm ci --omit=dev
NODE_ENV=production npm start
```

### 4. PM2 Process Manager
```bash
npm install -g pm2
pm2 start src/server.js --name sail-helpdesk-api \
  --env production \
  --max-memory-restart 512M \
  --log /var/log/sail-helpdesk/api.log
pm2 startup
pm2 save
```

### 5. Frontend Build
```bash
cd /opt/sail-helpdesk/frontend
REACT_APP_API_URL=https://api.helpdesk.sail.in/api npm run build
# Deploy build/ to web server document root
```

### 6. Nginx Config
```nginx
# /etc/nginx/conf.d/sail-helpdesk.conf
server {
    listen 80;
    server_name helpdesk.sail.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name helpdesk.sail.in;
    ssl_certificate     /etc/ssl/certs/sail-helpdesk.crt;
    ssl_certificate_key /etc/ssl/private/sail-helpdesk.key;

    # Frontend
    root /opt/sail-helpdesk/frontend/build;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 15M;
    }

    # Static uploads
    location /uploads/ {
        alias /opt/sail-helpdesk/backend/uploads/;
        add_header X-Content-Type-Options nosniff;
    }
}
```

---

## Gmail SMTP Setup

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Set in .env:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx   # 16-char app password
   ```

---

## Backup Strategy

```bash
# Oracle export (Data Pump)
expdp sail_helpdesk/password@XEPDB1 \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=sail_helpdesk_$(date +%Y%m%d).dmp \
  LOGFILE=expdp_$(date +%Y%m%d).log

# File attachments
rsync -az /opt/sail-helpdesk/backend/uploads/ /backup/helpdesk/uploads/

# Schedule with cron
0 2 * * * /opt/sail-helpdesk/scripts/backup.sh
```

---

## Health Check

```bash
curl http://localhost:5000/api/health
# {"success":true,"message":"SAIL Helpdesk API is running",...}
```
