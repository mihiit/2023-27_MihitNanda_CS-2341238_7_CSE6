-- ============================================================
-- SAIL IT Helpdesk - Sample Data
-- ============================================================

-- DEPARTMENTS
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Information Technology',    'IT',    'IT Infrastructure and Support',         'it.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Human Resources',           'HR',    'People Operations and HR Services',     'hr.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Finance & Accounts',        'FIN',   'Finance, Payroll and Accounting',       'fin.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Steel Production',          'PROD',  'Blast Furnace and Production Units',    'prod.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Quality Control',           'QC',    'Product Quality and Testing',           'qc.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Procurement & Stores',      'PROC',  'Procurement and Material Management',   'proc.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Corporate Communications',  'COMM',  'PR and Corporate Communications',       'comm.head@sail.in');
INSERT INTO DEPARTMENTS (dept_name, dept_code, description, head_email) VALUES
  ('Safety & Environment',      'SAFE',  'Safety, Health and Environment',        'safe.head@sail.in');

-- PRIORITIES
INSERT INTO PRIORITIES (priority_name, priority_code, color_hex, response_hrs, resolve_hrs, sort_order) VALUES
  ('Critical',  'CRITICAL',  '#DC2626', 1,  4,  1);
INSERT INTO PRIORITIES (priority_name, priority_code, color_hex, response_hrs, resolve_hrs, sort_order) VALUES
  ('High',      'HIGH',      '#EA580C', 4,  24, 2);
INSERT INTO PRIORITIES (priority_name, priority_code, color_hex, response_hrs, resolve_hrs, sort_order) VALUES
  ('Medium',    'MEDIUM',    '#D97706', 8,  48, 3);
INSERT INTO PRIORITIES (priority_name, priority_code, color_hex, response_hrs, resolve_hrs, sort_order) VALUES
  ('Low',       'LOW',       '#16A34A', 24, 72, 4);

-- CATEGORIES
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Hardware Issues',         'HARDWARE',    'Computers, printers, peripherals',    'Monitor',    24);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Software & Applications', 'SOFTWARE',    'OS, ERP, Office applications',        'Code',       16);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Network & Connectivity',  'NETWORK',     'LAN, WiFi, VPN, Internet',            'Wifi',        8);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Email & Communication',   'EMAIL',       'Email accounts, Outlook, Teams',      'Mail',       12);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Access & Permissions',    'ACCESS',      'User accounts, passwords, AD groups', 'Shield',      8);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('SAP / ERP Issues',        'SAP',         'SAP modules, transactions, errors',   'Database',   16);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Data & Backup',           'DATA',        'Data recovery, backups, storage',     'HardDrive',  24);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('Security Incidents',      'SECURITY',    'Virus, phishing, breach alerts',      'AlertTriangle', 4);
INSERT INTO CATEGORIES (cat_name, cat_code, description, icon, sla_hours) VALUES
  ('General IT Request',      'GENERAL',     'Other IT service requests',           'HelpCircle', 48);

-- USERS (passwords are bcrypt hashes of "SAIL@2024")
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP001', 'Rajesh Kumar Singh',    'rajesh.singh@sail.in',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543210', 'System Administrator',     1, 'SUPERADMIN', 1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP002', 'Priya Mehta',           'priya.mehta@sail.in',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543211', 'IT Support Manager',       1, 'ADMIN',      1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP003', 'Amit Sharma',           'amit.sharma@sail.in',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543212', 'IT Support Engineer',      1, 'AGENT',      1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP004', 'Sunita Patel',          'sunita.patel@sail.in',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543213', 'Senior Accountant',        3, 'EMPLOYEE',   1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP005', 'Vikram Yadav',          'vikram.yadav@sail.in',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543214', 'Production Supervisor',    4, 'EMPLOYEE',   1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP006', 'Ananya Krishnan',       'ananya.krishnan@sail.in', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543215', 'HR Business Partner',      2, 'EMPLOYEE',   1, 1);
INSERT INTO USERS (employee_id, full_name, email, password_hash, phone, designation, dept_id, role, is_active, email_verified) VALUES
  ('EMP007', 'Deepak Verma',          'deepak.verma@sail.in',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '9876543216', 'QC Engineer',              5, 'EMPLOYEE',   1, 1);

-- SAMPLE TICKETS (6 tickets)
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1000', 'SAP login not working after password reset',
   'I reset my SAP password yesterday via self-service portal but now getting "Invalid credentials" error. Tried 3 times. Account may be locked.',
   'IN_PROGRESS', 2, 6, 3, 4, 3, SYSTIMESTAMP + 1);
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1001', 'Laptop keyboard keys not responding',
   'Keys F5, F6, and the number row 1-5 are completely unresponsive on my Dell Latitude. I have restarted multiple times. This is affecting my daily work.',
   'OPEN', 3, 1, 4, 5, NULL, SYSTIMESTAMP + 2);
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1002', 'Unable to connect to VPN from home',
   'Cisco AnyConnect shows error 403 when trying to connect from home network. This started after the IT security patch last Friday. I need VPN access for remote work.',
   'OPEN', 2, 3, 2, 6, 3, SYSTIMESTAMP + 1);
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1003', 'Request for MS Office 365 installation',
   'My new workstation (Asset: WS-QC-047) does not have Office 365 installed. I need Excel, Word, and PowerPoint for my daily reporting activities.',
   'RESOLVED', 4, 2, 5, 7, 3, SYSTIMESTAMP - 1);
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1004', 'CRITICAL: Ransomware alert on workstation WS-FIN-012',
   'Windows Defender detected ransomware on WS-FIN-012. I immediately disconnected from network as per protocol. Machine is isolated. Please respond URGENTLY.',
   'IN_PROGRESS', 1, 8, 3, 4, 2, SYSTIMESTAMP + 0.04);
INSERT INTO TICKETS (ticket_ref, subject, description, status, priority_id, cat_id, dept_id, created_by, assigned_to, due_date) VALUES
  ('SAIL-1005', 'Outlook not syncing emails since morning',
   'My Outlook 2019 stopped syncing emails from 9 AM today. Sent items also not going. Exchange server connection shows error 0x80004005.',
   'PENDING', 3, 4, 2, 6, 3, SYSTIMESTAMP + 1);

COMMIT;
