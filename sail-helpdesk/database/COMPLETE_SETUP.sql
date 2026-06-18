-- ============================================================
-- SAIL IT Helpdesk - Complete Setup Script
-- Run this script as SYSDBA first, then as sail_helpdesk user
-- ============================================================

-- ==============================================================
-- PART 1: Run as SYSDBA (sys/admin user)
-- ==============================================================

-- Create schema user
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";

-- Grant essential privileges
GRANT CONNECT, RESOURCE, CREATE SESSION TO sail_helpdesk;
GRANT UNLIMITED TABLESPACE TO sail_helpdesk;

-- Commit
COMMIT;

-- ==============================================================
-- PART 2: Run as sail_helpdesk user (after connecting)
-- ==============================================================

-- Load schema
@database/schema/01_create_tables.sql

-- Load sample data
@database/data/02_sample_data.sql

-- Commit all changes
COMMIT;

-- ==============================================================
-- Verify Setup
-- ==============================================================

SELECT 'Departments' AS Table_Name, COUNT(*) AS Row_Count FROM DEPARTMENTS
UNION ALL
SELECT 'Users', COUNT(*) FROM USERS
UNION ALL
SELECT 'Categories', COUNT(*) FROM CATEGORIES
UNION ALL
SELECT 'Priorities', COUNT(*) FROM PRIORITIES
UNION ALL
SELECT 'Tickets', COUNT(*) FROM TICKETS;

-- ==============================================================
-- Setup Complete!
-- ==============================================================
