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
  cat_code      VARCHAR2(20)   NOT NULL UNIQUE,
  description   VARCHAR2(500),
  response_hrs  NUMBER(3)      DEFAULT 8,
  resolve_hrs   NUMBER(3)      DEFAULT 24,
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- PRIORITIES
-- ============================================================
CREATE TABLE PRIORITIES (
  priority_id   NUMBER DEFAULT seq_priorities.NEXTVAL PRIMARY KEY,
  priority_name VARCHAR2(50)   NOT NULL UNIQUE,
  priority_code VARCHAR2(20)   NOT NULL UNIQUE,
  color_hex     VARCHAR2(7)    DEFAULT '#000000',
  response_hrs  NUMBER(2)      DEFAULT 4,
  resolve_hrs   NUMBER(3)      DEFAULT 24,
  sort_order    NUMBER(2)      NOT NULL,
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE USERS (
  user_id       NUMBER DEFAULT seq_users.NEXTVAL PRIMARY KEY,
  emp_id        VARCHAR2(20)   NOT NULL UNIQUE,
  full_name     VARCHAR2(150)  NOT NULL,
  email         VARCHAR2(150)  NOT NULL UNIQUE,
  phone         VARCHAR2(15),
  password_hash VARCHAR2(255)  NOT NULL,
  role          VARCHAR2(20)   NOT NULL CHECK (role IN ('EMPLOYEE','AGENT','ADMIN','SUPERADMIN')),
  dept_id       NUMBER,
  is_active     NUMBER(1)      DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  failed_login_attempts NUMBER(2) DEFAULT 0,
  account_locked_until TIMESTAMP,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES DEPARTMENTS(dept_id)
);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE TICKETS (
  ticket_id     NUMBER DEFAULT seq_tickets.NEXTVAL PRIMARY KEY,
  ticket_ref    VARCHAR2(20)   NOT NULL UNIQUE,
  created_by    NUMBER         NOT NULL,
  assigned_to   NUMBER,
  subject       VARCHAR2(255)  NOT NULL,
  description   CLOB,
  status        VARCHAR2(20)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED')),
  priority_id   NUMBER         NOT NULL,
  cat_id        NUMBER         NOT NULL,
  dept_id       NUMBER,
  due_date      TIMESTAMP,
  internal_notes CLOB,
  satisfaction_rating NUMBER(1),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (created_by) REFERENCES USERS(user_id),
  FOREIGN KEY (assigned_to) REFERENCES USERS(user_id),
  FOREIGN KEY (priority_id) REFERENCES PRIORITIES(priority_id),
  FOREIGN KEY (cat_id) REFERENCES CATEGORIES(cat_id),
  FOREIGN KEY (dept_id) REFERENCES DEPARTMENTS(dept_id)
);

-- ============================================================
-- TICKET_REPLIES
-- ============================================================
CREATE TABLE TICKET_REPLIES (
  reply_id      NUMBER DEFAULT seq_replies.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL,
  replied_by    NUMBER         NOT NULL,
  reply_text    CLOB           NOT NULL,
  is_internal   NUMBER(1)      DEFAULT 0 NOT NULL CHECK (is_internal IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (replied_by) REFERENCES USERS(user_id)
);

-- ============================================================
-- TICKET_ATTACHMENTS
-- ============================================================
CREATE TABLE TICKET_ATTACHMENTS (
  attachment_id NUMBER DEFAULT seq_attachments.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL,
  reply_id      NUMBER,
  file_name     VARCHAR2(255)  NOT NULL,
  file_path     VARCHAR2(500)  NOT NULL,
  file_size     NUMBER,
  mime_type     VARCHAR2(100),
  uploaded_by   NUMBER         NOT NULL,
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (reply_id) REFERENCES TICKET_REPLIES(reply_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES USERS(user_id)
);

-- ============================================================
-- TICKET_HISTORY
-- ============================================================
CREATE TABLE TICKET_HISTORY (
  history_id    NUMBER DEFAULT seq_history.NEXTVAL PRIMARY KEY,
  ticket_id     NUMBER         NOT NULL,
  changed_by    NUMBER         NOT NULL,
  field_name    VARCHAR2(50)   NOT NULL,
  old_value     VARCHAR2(500),
  new_value     VARCHAR2(500),
  change_type   VARCHAR2(20)   CHECK (change_type IN ('INSERT','UPDATE','DELETE','STATUS_CHANGE')),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES TICKETS(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES USERS(user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE NOTIFICATIONS (
  notif_id      NUMBER DEFAULT seq_notif.NEXTVAL PRIMARY KEY,
  user_id       NUMBER         NOT NULL,
  ticket_id     NUMBER,
  notif_type    VARCHAR2(50)   NOT NULL,
  title         VARCHAR2(255)  NOT NULL,
  message       VARCHAR2(1000),
  is_read       NUMBER(1)      DEFAULT 0 NOT NULL CHECK (is_read IN (0,1)),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES TICKETS(ticket_id) ON DELETE CASCADE
);

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
CREATE TABLE AUDIT_LOGS (
  audit_id      NUMBER DEFAULT seq_audit.NEXTVAL PRIMARY KEY,
  user_id       NUMBER         NOT NULL,
  action        VARCHAR2(100)  NOT NULL,
  resource_type VARCHAR2(50),
  resource_id   NUMBER,
  old_values    CLOB,
  new_values    CLOB,
  ip_address    VARCHAR2(45),
  user_agent    VARCHAR2(500),
  created_at    TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================
CREATE INDEX idx_tickets_created_by ON TICKETS(created_by);
CREATE INDEX idx_tickets_assigned_to ON TICKETS(assigned_to);
CREATE INDEX idx_tickets_status ON TICKETS(status);
CREATE INDEX idx_tickets_priority ON TICKETS(priority_id);
CREATE INDEX idx_tickets_category ON TICKETS(cat_id);
CREATE INDEX idx_ticket_replies_ticket ON TICKET_REPLIES(ticket_id);
CREATE INDEX idx_ticket_history_ticket ON TICKET_HISTORY(ticket_id);
CREATE INDEX idx_notifications_user ON NOTIFICATIONS(user_id);
CREATE INDEX idx_notifications_is_read ON NOTIFICATIONS(is_read);
CREATE INDEX idx_audit_logs_user ON AUDIT_LOGS(user_id);
CREATE INDEX idx_audit_logs_created ON AUDIT_LOGS(created_at);

-- ============================================================
-- TRIGGER for TICKET_REF (auto-increment with prefix)
-- ============================================================
CREATE OR REPLACE TRIGGER trg_ticket_ref
BEFORE INSERT ON TICKETS
FOR EACH ROW
BEGIN
  IF :NEW.ticket_ref IS NULL THEN
    :NEW.ticket_ref := 'SAIL-' || TO_CHAR(:NEW.ticket_id);
  END IF;
END;
/

-- ============================================================
-- TRIGGER for DUE_DATE calculation
-- ============================================================
CREATE OR REPLACE TRIGGER trg_ticket_due_date
BEFORE INSERT ON TICKETS
FOR EACH ROW
DECLARE
  v_resolve_hrs NUMBER;
BEGIN
  SELECT resolve_hrs INTO v_resolve_hrs
  FROM PRIORITIES
  WHERE priority_id = :NEW.priority_id;
  
  :NEW.due_date := :NEW.created_at + (v_resolve_hrs / 24);
END;
/

-- ============================================================
-- Schema creation complete
-- ============================================================
COMMIT;
SHOW ERRORS;
