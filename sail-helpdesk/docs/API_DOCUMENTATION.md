# SAIL Helpdesk – REST API Documentation

**Base URL:** `http://localhost:5000/api`  
**Auth:** Bearer JWT token in `Authorization` header

---

## Authentication

### POST /auth/login
**Body:**
```json
{ "employee_id": "EMP001", "password": "SAIL@2024" }
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": 1,
    "employee_id": "EMP001",
    "full_name": "Rajesh Kumar Singh",
    "email": "rajesh.singh@sail.in",
    "role": "SUPERADMIN",
    "dept_name": "Information Technology"
  }
}
```

### GET /auth/me
Returns current authenticated user profile.

### POST /auth/change-password
**Body:**
```json
{ "current_password": "oldpass", "new_password": "newpass123" }
```

---

## Tickets

### GET /tickets
**Query Params:**
- `page` (int) – Page number, default 1
- `limit` (int) – Per page, default 10
- `status` – OPEN | IN_PROGRESS | PENDING | RESOLVED | CLOSED | CANCELLED
- `priority_id` (int)
- `cat_id` (int)
- `dept_id` (int)
- `search` (string) – Searches subject and ticket_ref
- `sort` – created_at | updated_at | priority_id | status
- `order` – ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": [{ "TICKET_ID": 1000, "TICKET_REF": "SAIL-1000", ... }],
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```

### POST /tickets
**Content-Type:** `multipart/form-data`  
**Fields:**
- `subject` (required, 5–300 chars)
- `description` (required, min 10 chars)
- `priority_id` (required, int)
- `cat_id` (required, int)
- `dept_id` (optional, int)
- `tags` (optional, comma-separated)
- `attachments` (optional, up to 5 files, 10MB each)

### GET /tickets/:id
Returns full ticket with replies, attachments, and change history.

### PUT /tickets/:id *(Admin/Agent only)*
**Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority_id": 2,
  "assigned_to": 3,
  "note": "Escalating to senior engineer"
}
```

### POST /tickets/:id/replies
**Content-Type:** `multipart/form-data`  
**Fields:**
- `body` (required)
- `reply_type` – PUBLIC | INTERNAL (default: PUBLIC)
- `is_solution` – 0 | 1
- `attachments` (optional, up to 3 files)

### POST /tickets/:id/feedback
**Body:**
```json
{ "satisfaction": 5, "feedback": "Issue resolved quickly, great support!" }
```

---

## Admin

### GET /admin/dashboard
Returns KPIs: status counts, daily trend, by category, by priority, avg resolution, top agents, recent tickets.

### GET /admin/users
**Query:** `page`, `limit`, `search`, `role`, `dept_id`

### POST /admin/users
**Body:**
```json
{
  "employee_id": "EMP010",
  "full_name": "New Employee",
  "email": "new@sail.in",
  "password": "SAIL@2024",
  "role": "EMPLOYEE",
  "dept_id": 2,
  "designation": "Engineer",
  "phone": "9876543210"
}
```

### PUT /admin/users/:id
Partial update. Any of: `full_name`, `email`, `role`, `dept_id`, `designation`, `phone`, `is_active`

### GET /admin/reports/summary
**Query:** `from_date` (YYYY-MM-DD), `to_date` (YYYY-MM-DD)

### GET /admin/audit-logs *(SuperAdmin only)*
**Query:** `page`, `limit`

---

## Lookup (No Auth Required)

### GET /lookup/departments
### GET /lookup/categories
### GET /lookup/priorities

---

## Notifications

### GET /notifications
Returns last 20 notifications for the current user + unread count.

### PUT /notifications/mark-read
Marks all notifications as read for the current user.

---

## Error Responses

All errors follow:
```json
{ "success": false, "message": "Human-readable error", "errors": [...] }
```

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Unauthenticated (invalid/expired token) |
| 403 | Unauthorized (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate employee ID/email) |
| 429 | Rate limit exceeded |
| 500 | Server error |
