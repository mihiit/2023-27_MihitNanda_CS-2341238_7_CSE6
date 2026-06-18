-- ============================================================
-- SAIL IT Helpdesk System - Oracle Database Schema
-- Author: SAIL IT Department
-- Version: 1.0.0
-- ============================================================

-- Drop existing tables (order matters for FK constraints)
BEGIN
  FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
    'AUDIT_LOGS','TICKET_ATTACHMENTS','TICKET_REPLIES','TICKET_HISTORY',
    'NOTIFICATIONS','TICKETS','USERS','DEPARTMENTS','CATEGORIES','PRIORITIES'
  )) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE seq_users       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_departments START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_categories  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_priorities  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_tickets     START WITH 1000 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_replies     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_attachments START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_history     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_notif       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_audit       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE DEPARTMENTS (
  dept_id       NUMBER DEFAULT seq_departments.NEXTVAL PRIMARY KEY,
  dept_name     VARCHAR2(100)  NOT NULL,
  dept_code     VARCHAR2(20)   NOT NULL UNIQUE,
  description   VARCHAR2(500),
  head_email    VARCHAR2(150),
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE CATEGORIES (
  cat_id        NUMBER DEFAULT seq_categories.NEXTVAL PRIMARY KEY,
  cat_name      VARCHAR2(100)  NOT NULL,
  cat_code      VARCHAR2(30)   NOT NULL UNIQUE,
  description   VARCHAR2(500),
  icon          VARCHAR2(50),
  sla_hours     NUMBER(4)      DEFAULT 24 NOT NULL,
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- PRIORITIES
-- ============================================================
CREATE TABLE PRIORITIES (
  priority_id   NUMBER DEFAULT seq_priorities.NEXTVAL PRIMARY KEY,
  priority_name VARCHAR2(50)   NOT NULL,
  priority_code VARCHAR2(20)   NOT NULL UNIQUE,
  color_hex     VARCHAR2(10)   DEFAULT '#6B7280' NOT NULL,
  response_hrs  NUMBER(4)      DEFAULT 24 NOT NULL,
  resolve_hrs   NUMBER(4)      DEFAULT 72 NOT NULL,
  sort_order    NUMBER(2)      DEFAULT 99 NOT NULL,
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE USERS (
  user_id         NUMBER DEFAULT seq_users.NEXTVAL PRIMARY KEY,
  employee_id     VARCHAR2(20)   NOT NULL UNIQUE,
  full_name       VARCHAR2(200)  NOT NULL,
  email           VARCHAR2(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR2(255)  NOT NULL,
  phone           VARCHAR2(20),
  designation     VARCHAR2(150),
  dept_id         NUMBER         REFERENCES DEPARTMENTS(dept_id),
  role            VARCHAR2(20)   DEFAULT 'EMPLOYEE' NOT NULL
                  CHECK (role IN ('EMPLOYEE','ADMIN','SUPERADMIN','AGENT')),
  is_active       NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  avatar_url      VARCHAR2(500),
  last_login      TIMESTAMP,
  login_attempts  NUMBER(2)      DEFAULT 0 NOT NULL,
  locked_until    TIMESTAMP,
  email_verified  NUMBER(1)      DEFAULT 0 NOT NULL CHECK (email_verified IN (0,1)),
  created_at      TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at      TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE TICKETS (
  ticket_id       NUMBER DEFAULT seq_tickets.NEXTVAL PRIMARY KEY,
  ticket_ref      VARCHAR2(20)   NOT NULL UNIQUE,  -- e.g. SAIL-1000
  subject         VARCHAR2(300)  NOT NULL,
  description     CLOB           NOT NULL,
  status          VARCHAR2(20)   DEFAULT 'OPEN' NOT NULL
                  CHECK (status IN ('OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED')),
  priority_id     NUMBER         NOT NULL REFERENCES PRIORITIES(priority_id),
  cat_id          NUMBER         NOT NULL REFERENCES CATEGORIES(cat_id),
  dept_id         NUMBER         REFERENCES DEPARTMENTS(dept_id),
  created_by      NUMBER         NOT NULL REFERENCES USERS(user_id),
  assigned_to     NUMBER         REFERENCES USERS(user_id),
  resolved_by     NUMBER         REFERENCES USERS(user_id),
  resolved_at     TIMESTAMP,
  closed_at       TIMESTAMP,
  due_date        TIMESTAMP,
  satisfaction    NUMBER(1)      CHECK (satisfaction BETWEEN 1 AND 5),
  feedback        VARCHAR2(1000),
  tags            VARCHAR2(500),
  created_at      TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at      TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- TICKET REPLIES
-- ============================================================
CREATE TABLE TICKET_REPLIES (
  reply_id      NUMBER DEFAULT seq_replies.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  author_id     NUMBER         NOT NULL REFERENCES USERS(user_id),
  body          CLOB           NOT NULL,
  reply_type    VARCHAR2(20)   DEFAULT 'PUBLIC' NOT NULL
                CHECK (reply_type IN ('PUBLIC','INTERNAL','SYSTEM')),
  is_solution   NUMBER(1)      DEFAULT 0 NOT NULL CHECK (is_solution IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- TICKET ATTACHMENTS
-- ============================================================
CREATE TABLE TICKET_ATTACHMENTS (
  attach_id     NUMBER DEFAULT seq_attachments.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  reply_id      NUMBER         REFERENCES TICKET_REPLIES(reply_id) ON DELETE CASCADE,
  uploaded_by   NUMBER         NOT NULL REFERENCES USERS(user_id),
  file_name     VARCHAR2(300)  NOT NULL,
  file_size     NUMBER         NOT NULL,
  mime_type     VARCHAR2(100)  NOT NULL,
  storage_path  VARCHAR2(1000) NOT NULL,
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- TICKET HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE TICKET_HISTORY (
  history_id    NUMBER DEFAULT seq_history.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  changed_by    NUMBER         NOT NULL REFERENCES USERS(user_id),
  field_name    VARCHAR2(100)  NOT NULL,
  old_value     VARCHAR2(500),
  new_value     VARCHAR2(500),
  change_note   VARCHAR2(1000),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE NOTIFICATIONS (
  notif_id      NUMBER DEFAULT seq_notif.NEXTVAL PRIMARY KEY,
  user_id       NUMBER         NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE,
  ticket_id     NUMBER         REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  title         VARCHAR2(200)  NOT NULL,
  message       VARCHAR2(1000) NOT NULL,
  notif_type    VARCHAR2(50)   NOT NULL,
  is_read       NUMBER(1)      DEFAULT 0 NOT NULL CHECK (is_read IN (0,1)),
  email_sent    NUMBER(1)      DEFAULT 0 NOT NULL CHECK (email_sent IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE AUDIT_LOGS (
  audit_id      NUMBER DEFAULT seq_audit.NEXTVAL PRIMARY KEY,
  user_id       NUMBER         REFERENCES USERS(user_id),
  action        VARCHAR2(100)  NOT NULL,
  entity_type   VARCHAR2(50)   NOT NULL,
  entity_id     NUMBER,
  ip_address    VARCHAR2(50),
  user_agent    VARCHAR2(500),
  request_data  CLOB,
  response_code NUMBER(3),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tickets_created_by   ON TICKETS(created_by);
CREATE INDEX idx_tickets_assigned_to  ON TICKETS(assigned_to);
CREATE INDEX idx_tickets_status       ON TICKETS(status);
CREATE INDEX idx_tickets_priority     ON TICKETS(priority_id);
CREATE INDEX idx_tickets_cat          ON TICKETS(cat_id);
CREATE INDEX idx_tickets_dept         ON TICKETS(dept_id);
CREATE INDEX idx_tickets_created_at   ON TICKETS(created_at);
CREATE INDEX idx_replies_ticket       ON TICKET_REPLIES(ticket_id);
CREATE INDEX idx_history_ticket       ON TICKET_HISTORY(ticket_id);
CREATE INDEX idx_notif_user           ON NOTIFICATIONS(user_id);
CREATE INDEX idx_audit_user           ON AUDIT_LOGS(user_id);
CREATE INDEX idx_audit_entity         ON AUDIT_LOGS(entity_type, entity_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-generate ticket_ref
CREATE OR REPLACE TRIGGER trg_ticket_ref
  BEFORE INSERT ON TICKETS
  FOR EACH ROW
BEGIN
  IF :NEW.ticket_ref IS NULL THEN
    :NEW.ticket_ref := 'SAIL-' || :NEW.ticket_id;
  END IF;
END;
/

-- Update updated_at on TICKETS
CREATE OR REPLACE TRIGGER trg_ticket_updated
  BEFORE UPDATE ON TICKETS
  FOR EACH ROW
BEGIN
  :NEW.updated_at := SYSTIMESTAMP;
END;
/

-- Update updated_at on USERS
CREATE OR REPLACE TRIGGER trg_user_updated
  BEFORE UPDATE ON USERS
  FOR EACH ROW
BEGIN
  :NEW.updated_at := SYSTIMESTAMP;
END;
/

-- Compute due_date on ticket insert based on priority SLA
CREATE OR REPLACE TRIGGER trg_ticket_due_date
  BEFORE INSERT ON TICKETS
  FOR EACH ROW
DECLARE
  v_hours NUMBER;
BEGIN
  IF :NEW.due_date IS NULL THEN
    SELECT p.resolve_hrs INTO v_hours
    FROM PRIORITIES p WHERE p.priority_id = :NEW.priority_id;
    :NEW.due_date := SYSTIMESTAMP + (v_hours / 24);
  END IF;
END;
/

COMMIT;
