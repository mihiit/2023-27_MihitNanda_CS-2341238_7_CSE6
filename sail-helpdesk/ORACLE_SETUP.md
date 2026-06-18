# Oracle Database Setup Guide - SAIL Helpdesk

## Prerequisites
- Oracle Database 19c, 21c, or XE installed
- `sqlplus` command-line tool available in your PATH
- Database instance running and accessible

---

## Step 1: Verify Oracle Installation

### Windows
```powershell
# Check if sqlplus is available
sqlplus -version

# Or try to get SQL*Plus version
sqlplus /nolog
> exit
```

If `sqlplus` is not found, add Oracle Instant Client to your PATH:
- Download from: https://www.oracle.com/database/technologies/instant-client/
- Add folder to Windows PATH environment variable

---

## Step 2: Connect as SYSDBA

```bash
# On Windows (PowerShell)
sqlplus / as sysdba

# Or with username/password
sqlplus sys/your_password@XEPDB1 as sysdba
```

For **Oracle XE (Express Edition)**, common connection strings:
- `XEPDB1` - Default pluggable database
- `XE` - Older versions

---

## Step 3: Execute Setup SQL Script

Inside sqlplus, run:

```sql
-- Create schema user
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";

-- Grant essential privileges
GRANT CONNECT, RESOURCE, CREATE SESSION TO sail_helpdesk;
GRANT UNLIMITED TABLESPACE TO sail_helpdesk;

-- Exit sqlplus
exit
```

---

## Step 4: Create Schema and Load Sample Data

Connect as the schema user:

```bash
sqlplus sail_helpdesk/SailHelp@2024@XEPDB1
```

Inside sqlplus, run the scripts:

```sql
-- Create all tables, sequences, triggers, etc.
@database/schema/01_create_tables.sql

-- Load sample data
@database/data/02_sample_data.sql

-- Verify
SELECT * FROM DEPARTMENTS;
SELECT * FROM USERS;

-- Commit changes
COMMIT;

-- Exit
exit
```

---

## Step 5: Configure Backend .env

Update `backend/.env`:

```env
# Oracle DB
ORACLE_USER=sail_helpdesk
ORACLE_PASSWORD=SailHelp@2024
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1

# For Oracle XE, you might use:
# ORACLE_CONNECT_STRING=localhost:1521/XE

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=8h

# SMTP Email (optional for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=SAIL IT Helpdesk <helpdesk@sail.in>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## Troubleshooting

### "ORA-12514: TNS:listener does not know of service requested"
- Check if database service is running
- Verify `ORACLE_CONNECT_STRING` is correct
- Try `lsnrctl status` to check listener

### "Cannot find sqlplus"
- Install Oracle Instant Client
- Add to Windows PATH and restart terminal

### "ORA-01017: invalid username/password"
- Verify sail_helpdesk user was created
- Check password is exactly: `SailHelp@2024`
- Ensure you're using correct connection string

### Connection refused (Oracle not running)
```bash
# Start Oracle Database service on Windows
# Services → Oracle-related services → Start
# Or command line:
net start OracleServiceXE
```

---

## Quick Reference: Default Credentials

| User ID | Password | Role |
|---------|----------|------|
| EMP001 | SAIL@2024 | Super Admin |
| EMP002 | SAIL@2024 | Admin |
| EMP003 | SAIL@2024 | IT Agent |
| EMP004 | SAIL@2024 | Employee |
| EMP005 | SAIL@2024 | Employee |

---

## Verify Setup

After completing all steps, verify the setup:

```bash
sqlplus sail_helpdesk/SailHelp@2024@XEPDB1

SQL> SELECT COUNT(*) FROM USERS;
SQL> SELECT COUNT(*) FROM DEPARTMENTS;
SQL> SELECT COUNT(*) FROM TICKETS;
SQL> exit
```

All tables should exist with sample data loaded.
