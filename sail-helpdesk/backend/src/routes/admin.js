// backend/src/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('ADMIN', 'SUPERADMIN', 'AGENT'));

// ─── KPI DASHBOARD ────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    // Total tickets by status
    const statusCounts = await db.execute(
      `SELECT status, COUNT(*) AS cnt FROM TICKETS GROUP BY status ORDER BY status`
    );

    // Tickets created last 7 days (daily)
    const dailyTrend = await db.execute(
      `SELECT TRUNC(created_at) AS day, COUNT(*) AS cnt
       FROM TICKETS
       WHERE created_at >= SYSDATE - 7
       GROUP BY TRUNC(created_at)
       ORDER BY TRUNC(created_at)`
    );

    // By category
    const byCat = await db.execute(
      `SELECT c.cat_name, COUNT(t.ticket_id) AS cnt
       FROM TICKETS t JOIN CATEGORIES c ON t.cat_id = c.cat_id
       GROUP BY c.cat_name ORDER BY cnt DESC`
    );

    // By priority
    const byPriority = await db.execute(
      `SELECT p.priority_name, p.color_hex, COUNT(t.ticket_id) AS cnt
       FROM TICKETS t JOIN PRIORITIES p ON t.priority_id = p.priority_id
       GROUP BY p.priority_name, p.color_hex, p.sort_order ORDER BY p.sort_order`
    );

    // Avg resolution time (hours) by priority
    const avgResolution = await db.execute(
      `SELECT p.priority_name,
              ROUND(AVG(
                EXTRACT(DAY FROM (t.resolved_at - t.created_at)) * 24 +
                EXTRACT(HOUR FROM (t.resolved_at - t.created_at)) +
                EXTRACT(MINUTE FROM (t.resolved_at - t.created_at)) / 60
              ), 1) AS avg_hours
       FROM TICKETS t JOIN PRIORITIES p ON t.priority_id = p.priority_id
       WHERE t.resolved_at IS NOT NULL
       GROUP BY p.priority_name`
    );

    // SLA breach (due_date passed, not resolved/closed)
    const slaBreach = await db.execute(
      `SELECT COUNT(*) AS cnt FROM TICKETS
       WHERE due_date < SYSTIMESTAMP AND status NOT IN ('RESOLVED','CLOSED','CANCELLED')`
    );

    // Top agents by resolved
    const topAgents = await db.execute(
      `SELECT u.full_name, u.emp_id, COUNT(t.ticket_id) AS resolved_count
       FROM TICKETS t JOIN USERS u ON t.resolved_by = u.user_id
       WHERE t.status IN ('RESOLVED','CLOSED')
       GROUP BY u.full_name, u.emp_id
       ORDER BY resolved_count DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    // Recent tickets
    const recentTickets = await db.execute(
      `SELECT t.ticket_ref, t.subject, t.status, t.created_at,
              p.priority_name, p.color_hex,
              u.full_name AS created_by_name
       FROM TICKETS t
       JOIN PRIORITIES p ON t.priority_id = p.priority_id
       JOIN USERS u ON t.created_by = u.user_id
       ORDER BY t.created_at DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    // Total counts summary
    const summary = await db.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) AS open_count,
         SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS inprogress_count,
         SUM(CASE WHEN status IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) AS resolved_count,
         SUM(CASE WHEN created_at >= SYSDATE - 1 THEN 1 ELSE 0 END) AS today_count,
         SUM(CASE WHEN created_at >= SYSDATE - 7 THEN 1 ELSE 0 END) AS week_count
       FROM TICKETS`
    );

    res.json({
      success: true,
      data: {
        summary: summary.rows[0],
        statusCounts: statusCounts.rows,
        dailyTrend: dailyTrend.rows,
        byCat: byCat.rows,
        byPriority: byPriority.rows,
        avgResolution: avgResolution.rows,
        slaBreach: slaBreach.rows[0].CNT,
        topAgents: topAgents.rows,
        recentTickets: recentTickets.rows,
      },
    });
  } catch (err) {
    logger.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── USER MANAGEMENT ──────────────────────────────────────────
router.get('/users', authorize('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, dept_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const where = [];

    if (search) {
      where.push(`(UPPER(u.full_name) LIKE :${params.length + 1} OR UPPER(u.email) LIKE :${params.length + 1} OR u.emp_id LIKE :${params.length + 1})`);
      params.push('%' + search.toUpperCase() + '%');
    }
    if (role)    { where.push(`u.role = :${params.length + 1}`);    params.push(role); }
    if (dept_id) { where.push(`u.dept_id = :${params.length + 1}`); params.push(parseInt(dept_id)); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await db.execute(`SELECT COUNT(*) AS total FROM USERS u ${whereClause}`, params);

    const result = await db.execute(
      `SELECT u.user_id, u.emp_id, u.full_name, u.email, u.phone,
              u.role, u.is_active, u.last_login, u.created_at, d.dept_name,
              (SELECT COUNT(*) FROM TICKETS t WHERE t.created_by = u.user_id) AS ticket_count
       FROM USERS u
       LEFT JOIN DEPARTMENTS d ON u.dept_id = d.dept_id
       ${whereClause}
       ORDER BY u.created_at DESC
       OFFSET :${params.length + 1} ROWS FETCH NEXT :${params.length + 2} ROWS ONLY`,
      [...params, offset, parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: countRes.rows[0].TOTAL },
    });
  } catch (err) {
    logger.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users', authorize('ADMIN', 'SUPERADMIN'), [
  body('employee_id').trim().notEmpty(),
  body('full_name').trim().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['EMPLOYEE','ADMIN','AGENT','SUPERADMIN']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { employee_id, full_name, email, password, role, dept_id, phone } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const result = await db.execute(
      `INSERT INTO USERS (emp_id, full_name, email, password_hash, role, dept_id, phone)
       VALUES (:1, :2, :3, :4, :5, :6, :7)
       RETURNING user_id INTO :8`,
      [employee_id, full_name, email, hash, role, dept_id || null, phone || null,
       { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }]
    );

    res.status(201).json({ success: true, data: { user_id: result.outBinds[0][0] } });
  } catch (err) {
    if (err.errorNum === 1) return res.status(409).json({ success: false, message: 'Employee ID or email already exists' });
    logger.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:id', authorize('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { full_name, email, role, dept_id, phone, is_active } = req.body;
    await db.execute(
      `UPDATE USERS SET
         full_name = NVL(:1, full_name),
         email = NVL(:2, email),
         role = NVL(:3, role),
         dept_id = NVL(:4, dept_id),
         phone = NVL(:5, phone),
         is_active = NVL(:6, is_active)
       WHERE user_id = :7`,
      [full_name || null, email || null, role || null, dept_id || null,
       phone || null, is_active !== undefined ? parseInt(is_active) : null, req.params.id]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    logger.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DEPARTMENTS & CATEGORIES (Read) ──────────────────────────
router.get('/departments', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM DEPARTMENTS WHERE is_active = 1 ORDER BY dept_name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Get departments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM CATEGORIES WHERE is_active = 1 ORDER BY cat_name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Get categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/priorities', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM PRIORITIES WHERE is_active = 1 ORDER BY sort_order');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Get priorities error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── AUDIT LOGS ───────────────────────────────────────────────
router.get('/audit-logs', authorize('SUPERADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await db.execute(
      `SELECT a.audit_id, a.action, a.entity_type, a.entity_id, a.ip_address, a.response_code, a.created_at,
              u.full_name, u.emp_id
       FROM AUDIT_LOGS a
       LEFT JOIN USERS u ON a.user_id = u.user_id
       ORDER BY a.created_at DESC
       OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, parseInt(limit)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('Audit logs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── REPORTS ──────────────────────────────────────────────────
router.get('/reports/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const params = [];
    let dateFilter = '';
    if (from_date && to_date) {
      dateFilter = `AND t.created_at BETWEEN TO_TIMESTAMP(:${params.length + 1}, 'YYYY-MM-DD') AND TO_TIMESTAMP(:${params.length + 2}, 'YYYY-MM-DD') + 1`;
      params.push(from_date, to_date);
    }

    const result = await db.execute(
      `SELECT
         COUNT(*) AS total_tickets,
         SUM(CASE WHEN t.status = 'RESOLVED' OR t.status = 'CLOSED' THEN 1 ELSE 0 END) AS resolved,
         SUM(CASE WHEN t.status = 'OPEN' THEN 1 ELSE 0 END) AS open_tickets,
         SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
         ROUND(AVG(CASE WHEN t.resolved_at IS NOT NULL THEN
           EXTRACT(DAY FROM (t.resolved_at - t.created_at)) * 24 +
           EXTRACT(HOUR FROM (t.resolved_at - t.created_at)) +
           EXTRACT(MINUTE FROM (t.resolved_at - t.created_at)) / 60
         END), 1) AS avg_resolution_hrs,
         ROUND(AVG(NVL(t.satisfaction, 0)), 1) AS avg_satisfaction,
         SUM(CASE WHEN t.due_date < SYSTIMESTAMP AND t.status NOT IN ('RESOLVED','CLOSED','CANCELLED') THEN 1 ELSE 0 END) AS sla_breaches
       FROM TICKETS t WHERE 1=1 ${dateFilter}`,
      params
    );

    const byDept = await db.execute(
      `SELECT d.dept_name, COUNT(t.ticket_id) AS cnt
       FROM TICKETS t JOIN DEPARTMENTS d ON t.dept_id = d.dept_id
       WHERE 1=1 ${dateFilter}
       GROUP BY d.dept_name ORDER BY cnt DESC`,
      params
    );

    res.json({ success: true, data: { summary: result.rows[0], byDepartment: byDept.rows } });
  } catch (err) {
    logger.error('Reports summary error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT n.*, t.ticket_ref FROM NOTIFICATIONS n
       LEFT JOIN TICKETS t ON n.ticket_id = t.ticket_id
       WHERE n.user_id = :1
       ORDER BY n.created_at DESC FETCH FIRST 20 ROWS ONLY`,
      [req.user.USER_ID]
    );
    const unread = await db.execute(
      `SELECT COUNT(*) AS cnt FROM NOTIFICATIONS WHERE user_id = :1 AND is_read = 0`,
      [req.user.USER_ID]
    );
    res.json({ success: true, data: result.rows, unread_count: unread.rows[0].CNT });
  } catch (err) {
    logger.error('Admin notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/notifications/mark-read', authenticate, async (req, res) => {
  try {
    await db.execute(`UPDATE NOTIFICATIONS SET is_read = 1 WHERE user_id = :1`, [req.user.USER_ID]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;