// backend/src/routes/tickets.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const logger = require('../utils/logger');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Multer config
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_MIME_TYPES || '').split(',');
    if (!allowed.length || allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

// ─── GET ALL TICKETS ─────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1, limit = 10, status, priority_id, cat_id, dept_id,
      search, assigned_to, sort = 'created_at', order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = [];

    // Employees see only their own tickets
    if (req.user.ROLE === 'EMPLOYEE') {
      where.push(`t.created_by = :${params.length + 1}`);
      params.push(req.user.USER_ID);
    }
    if (status)      { where.push(`t.status = :${params.length + 1}`);      params.push(status.toUpperCase()); }
    if (priority_id) { where.push(`t.priority_id = :${params.length + 1}`); params.push(parseInt(priority_id)); }
    if (cat_id)      { where.push(`t.cat_id = :${params.length + 1}`);      params.push(parseInt(cat_id)); }
    if (dept_id)     { where.push(`t.dept_id = :${params.length + 1}`);     params.push(parseInt(dept_id)); }
    if (assigned_to) { where.push(`t.assigned_to = :${params.length + 1}`); params.push(parseInt(assigned_to)); }
    if (search) {
      where.push(`(UPPER(t.subject) LIKE :${params.length + 1} OR UPPER(t.ticket_ref) LIKE :${params.length + 1})`);
      params.push('%' + search.toUpperCase() + '%');
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const validSorts = { created_at: 't.created_at', updated_at: 't.updated_at', priority_id: 't.priority_id', status: 't.status' };
    const sortCol = validSorts[sort] || 't.created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.execute(
      `SELECT COUNT(*) AS total FROM TICKETS t ${whereClause}`,
      params
    );
    const total = countResult.rows[0].TOTAL;

    const result = await db.execute(
      `SELECT t.ticket_id, t.ticket_ref, t.subject, t.status, t.created_at, t.updated_at,
              t.due_date, t.resolved_at,
              p.priority_name, p.color_hex,
              c.cat_name,
              d.dept_name,
              u.full_name AS created_by_name, u.employee_id AS created_by_emp,
              a.full_name AS assigned_to_name,
              (SELECT COUNT(*) FROM TICKET_REPLIES r WHERE r.ticket_id = t.ticket_id) AS reply_count
       FROM TICKETS t
       JOIN PRIORITIES p ON t.priority_id = p.priority_id
       JOIN CATEGORIES c ON t.cat_id = c.cat_id
       LEFT JOIN DEPARTMENTS d ON t.dept_id = d.dept_id
       JOIN USERS u ON t.created_by = u.user_id
       LEFT JOIN USERS a ON t.assigned_to = a.user_id
       ${whereClause}
       ORDER BY ${sortCol} ${sortDir}
       OFFSET :${params.length + 1} ROWS FETCH NEXT :${params.length + 2} ROWS ONLY`,
      [...params, offset, parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    logger.error('Get tickets error: ' + (err?.message || err));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET SINGLE TICKET ───────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT t.*, p.priority_name, p.color_hex,
              c.cat_name,
              d.dept_name,
              u.full_name AS created_by_name, u.email AS created_by_email, u.employee_id AS created_by_emp, u.phone AS created_by_phone,
              a.full_name AS assigned_to_name, a.email AS assigned_to_email
       FROM TICKETS t
       JOIN PRIORITIES p ON t.priority_id = p.priority_id
       JOIN CATEGORIES c ON t.cat_id = c.cat_id
       LEFT JOIN DEPARTMENTS d ON t.dept_id = d.dept_id
       JOIN USERS u ON t.created_by = u.user_id
       LEFT JOIN USERS a ON t.assigned_to = a.user_id
       WHERE t.ticket_id = :1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const ticket = result.rows[0];
    if (req.user.ROLE === 'EMPLOYEE' && ticket.CREATED_BY !== req.user.USER_ID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Replies
    const repliesResult = await db.execute(
      `SELECT r.reply_id, r.body, r.reply_type, r.is_solution, r.created_at,
              u.full_name AS author_name, u.role AS author_role, u.employee_id AS author_emp
       FROM TICKET_REPLIES r
       JOIN USERS u ON r.author_id = u.user_id
       WHERE r.ticket_id = :1
       ORDER BY r.created_at ASC`,
      [ticket.TICKET_ID]
    );

    // Attachments
    const attachResult = await db.execute(
      `SELECT attach_id, file_name, file_size, mime_type, created_at
       FROM TICKET_ATTACHMENTS WHERE ticket_id = :1 ORDER BY created_at ASC`,
      [ticket.TICKET_ID]
    );

    // History
    const historyResult = await db.execute(
      `SELECT h.history_id, h.field_name, h.old_value, h.new_value, h.change_note, h.created_at,
              u.full_name AS changed_by_name
       FROM TICKET_HISTORY h
       JOIN USERS u ON h.changed_by = u.user_id
       WHERE h.ticket_id = :1
       ORDER BY h.created_at ASC`,
      [ticket.TICKET_ID]
    );

    res.json({
      success: true,
      data: {
        ...ticket,
        replies: repliesResult.rows,
        attachments: attachResult.rows,
        history: historyResult.rows,
      },
    });
  } catch (err) {
    logger.error('Get ticket error: ' + (err?.message || err));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CREATE TICKET ────────────────────────────────────────────
router.post('/', authenticate, upload.array('attachments', 5), [
  body('subject').trim().isLength({ min: 5, max: 300 }).withMessage('Subject must be 5-300 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority_id').isInt().withMessage('Priority is required'),
  body('cat_id').isInt().withMessage('Category is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { subject, description, priority_id, cat_id, dept_id, tags } = req.body;
    const deptId = dept_id || req.user.DEPT_ID;

    // Insert ticket (ticket_ref set by trigger)
    const insertResult = await db.execute(
      `INSERT INTO TICKETS (ticket_ref, subject, description, priority_id, cat_id, dept_id, created_by, tags)
       VALUES ('PENDING', :1, :2, :3, :4, :5, :6, :7)
       RETURNING ticket_id INTO :8`,
      [subject, description, parseInt(priority_id), parseInt(cat_id), deptId, req.user.USER_ID, tags || null,
       { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }]
    );

    const ticketId = insertResult.outBinds[0][0];

    // Update ticket_ref
    await db.execute(
      `UPDATE TICKETS SET ticket_ref = 'SAIL-' || ticket_id WHERE ticket_id = :1`,
      [ticketId]
    );

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.execute(
          `INSERT INTO TICKET_ATTACHMENTS (ticket_id, uploaded_by, file_name, file_size, mime_type, storage_path)
           VALUES (:1, :2, :3, :4, :5, :6)`,
          [ticketId, req.user.USER_ID, file.originalname, file.size, file.mimetype, file.path]
        );
      }
    }

    // Fetch for email
    const ticketRow = await db.execute(
      `SELECT t.ticket_ref, t.subject, p.priority_name
       FROM TICKETS t JOIN PRIORITIES p ON t.priority_id = p.priority_id
       WHERE t.ticket_id = :1`, [ticketId]
    );
    const ticket = ticketRow.rows[0];

    // Email notification
    try {
      await sendEmail(req.user.EMAIL, 'ticketCreated', [
        { ticket_id: ticketId, ticket_ref: ticket.TICKET_REF, subject: ticket.SUBJECT, priority_name: ticket.PRIORITY_NAME },
        { full_name: req.user.FULL_NAME },
      ]);
    } catch (emailErr) {
      logger.error('Email send failed (non-fatal):', emailErr.message);
    }

    // In-app notification for admins
    const admins = await db.execute(
      `SELECT user_id, email FROM USERS WHERE role IN ('ADMIN','SUPERADMIN','AGENT') AND is_active = 1`,
      []
    );
    for (const admin of admins.rows) {
      await db.execute(
        `INSERT INTO NOTIFICATIONS (user_id, ticket_id, title, message, notif_type)
         VALUES (:1, :2, :3, :4, 'NEW_TICKET')`,
        [admin.USER_ID, ticketId, 'New Ticket Assigned', `New ticket ${ticket.TICKET_REF}: ${ticket.SUBJECT}`]
      );
    }

    logger.info(`Ticket created: SAIL-${ticketId} by ${req.user.EMPLOYEE_ID}`);
    res.status(201).json({ success: true, message: 'Ticket created successfully', data: { ticket_id: ticketId, ticket_ref: `SAIL-${ticketId}` } });
  } catch (err) {
    logger.error('Create ticket error: ' + (err?.message || err));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE TICKET (Admin/Agent) ──────────────────────────────
router.put('/:id', authenticate, authorize('ADMIN', 'SUPERADMIN', 'AGENT'), [
  body('status').optional().isIn(['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED','CANCELLED']),
  body('priority_id').optional().isInt(),
  body('assigned_to').optional().isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { status, priority_id, assigned_to, dept_id, cat_id, note } = req.body;
    const ticketId = req.params.id;

    // Fetch current
    const curr = await db.execute('SELECT * FROM TICKETS WHERE ticket_id = :1', [ticketId]);
    if (!curr.rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const current = curr.rows[0];

    const updates = [];
    const historyEntries = [];

    if (status && status !== current.STATUS) {
      updates.push(`status = '${status}'`);
      historyEntries.push(['status', current.STATUS, status, note || null]);
      if (status === 'RESOLVED') updates.push(`resolved_at = SYSTIMESTAMP, resolved_by = ${req.user.USER_ID}`);
      if (status === 'CLOSED')   updates.push(`closed_at = SYSTIMESTAMP`);
    }
    if (priority_id && parseInt(priority_id) !== current.PRIORITY_ID) {
      updates.push(`priority_id = ${parseInt(priority_id)}`);
      historyEntries.push(['priority_id', String(current.PRIORITY_ID), String(priority_id), note || null]);
    }
    if (assigned_to !== undefined && parseInt(assigned_to) !== current.ASSIGNED_TO) {
      updates.push(`assigned_to = ${parseInt(assigned_to) || 'NULL'}`);
      historyEntries.push(['assigned_to', String(current.ASSIGNED_TO), String(assigned_to), note || null]);
    }
    if (dept_id)   updates.push(`dept_id = ${parseInt(dept_id)}`);
    if (cat_id)    updates.push(`cat_id = ${parseInt(cat_id)}`);

    if (updates.length) {
      await db.execute(
        `UPDATE TICKETS SET ${updates.join(', ')} WHERE ticket_id = :1`,
        [ticketId]
      );
    }

    for (const [field, oldVal, newVal, changeNote] of historyEntries) {
      await db.execute(
        `INSERT INTO TICKET_HISTORY (ticket_id, changed_by, field_name, old_value, new_value, change_note)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [ticketId, req.user.USER_ID, field, oldVal, newVal, changeNote]
      );
    }

    // Notify ticket creator
    if (status) {
      const ownerResult = await db.execute(
        'SELECT u.email, u.full_name FROM USERS u JOIN TICKETS t ON t.created_by = u.user_id WHERE t.ticket_id = :1',
        [ticketId]
      );
      if (ownerResult.rows.length) {
        const owner = ownerResult.rows[0];
        const tmpl = status === 'RESOLVED' ? 'ticketClosed' : 'ticketUpdated';
        try {
          await sendEmail(owner.EMAIL, tmpl, [
            { ticket_id: ticketId, ticket_ref: current.TICKET_REF, subject: current.SUBJECT, status },
            { full_name: owner.FULL_NAME },
            note || `Status changed to ${status}`,
          ]);
        } catch (emailErr) {
          logger.error('Email send failed (non-fatal):', emailErr.message);
        }
      }
    }

    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (err) {
    logger.error('Update ticket error: ' + (err?.message || err));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADD REPLY ────────────────────────────────────────────────
router.post('/:id/replies', authenticate, upload.array('attachments', 3), [
  body('body').trim().isLength({ min: 2 }).withMessage('Reply body is required'),
  body('reply_type').optional().isIn(['PUBLIC','INTERNAL']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const ticketId = req.params.id;
    const { body: replyBody, reply_type = 'PUBLIC', is_solution = 0 } = req.body;

    // Check access
    const ticketResult = await db.execute(
      'SELECT t.*, u.email, u.full_name FROM TICKETS t JOIN USERS u ON t.created_by = u.user_id WHERE t.ticket_id = :1',
      [ticketId]
    );
    if (!ticketResult.rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const ticket = ticketResult.rows[0];

    if (req.user.ROLE === 'EMPLOYEE' && ticket.CREATED_BY !== req.user.USER_ID) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const insertResult = await db.execute(
      `INSERT INTO TICKET_REPLIES (ticket_id, author_id, body, reply_type, is_solution)
       VALUES (:1, :2, :3, :4, :5)
       RETURNING reply_id INTO :6`,
      [ticketId, req.user.USER_ID, replyBody, reply_type, parseInt(is_solution),
       { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }]
    );
    const replyId = insertResult.outBinds[0][0];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.execute(
          `INSERT INTO TICKET_ATTACHMENTS (ticket_id, reply_id, uploaded_by, file_name, file_size, mime_type, storage_path)
           VALUES (:1, :2, :3, :4, :5, :6, :7)`,
          [ticketId, replyId, req.user.USER_ID, file.originalname, file.size, file.mimetype, file.path]
        );
      }
    }

    // Update ticket status to IN_PROGRESS if it was OPEN and agent replied
    if (['ADMIN','AGENT','SUPERADMIN'].includes(req.user.ROLE) && ticket.STATUS === 'OPEN') {
      await db.execute(`UPDATE TICKETS SET status = 'IN_PROGRESS' WHERE ticket_id = :1`, [ticketId]);
    }

    // Email notification
    if (reply_type === 'PUBLIC') {
      const notifyEmail = ['ADMIN','AGENT','SUPERADMIN'].includes(req.user.ROLE)
        ? ticket.EMAIL : null; // notify creator
      if (notifyEmail) {
        try {
          await sendEmail(notifyEmail, 'newReply', [
            { ticket_id: ticketId, ticket_ref: ticket.TICKET_REF },
            { full_name: ticket.FULL_NAME },
            replyBody,
          ]);
        } catch (emailErr) {
          logger.error('Email send failed (non-fatal):', emailErr.message);
        }
      }
    }

    res.status(201).json({ success: true, message: 'Reply added', data: { reply_id: replyId } });
  } catch (err) {
    logger.error('Add reply error: ' + (err?.message || err));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── TICKET FEEDBACK ──────────────────────────────────────────
router.post('/:id/feedback', authenticate, [
  body('satisfaction').isInt({ min: 1, max: 5 }),
  body('feedback').optional().isLength({ max: 1000 }),
], async (req, res) => {
  try {
    const { satisfaction, feedback } = req.body;
    const ticketId = req.params.id;
    const ticket = await db.execute('SELECT * FROM TICKETS WHERE ticket_id = :1', [ticketId]);
    if (!ticket.rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.rows[0].CREATED_BY !== req.user.USER_ID) return res.status(403).json({ success: false, message: 'Access denied' });
    await db.execute(
      'UPDATE TICKETS SET satisfaction = :1, feedback = :2 WHERE ticket_id = :3',
      [parseInt(satisfaction), feedback || null, ticketId]
    );
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;