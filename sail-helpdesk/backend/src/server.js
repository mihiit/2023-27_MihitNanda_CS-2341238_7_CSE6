// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Trust proxy (fixes express-rate-limit X-Forwarded-For warning) ──
app.set('trust proxy', 1);

// ─── Security middleware ──────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth endpoints get stricter limit
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);

// ─── Static uploads ──────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SAIL Helpdesk API is running', timestamp: new Date().toISOString() });
});

// ─── Public lookup routes (no auth needed) ───────────────────
app.get('/api/lookup/departments', async (req, res) => {
  try {
    const db_ = require('./config/database');
    const r = await db_.execute('SELECT dept_id, dept_name, dept_code FROM DEPARTMENTS WHERE is_active = 1 ORDER BY dept_name');
    res.json({ success: true, data: r.rows });
  } catch (err) {
    logger.error('Departments lookup error:', err);
    res.status(500).json({ success: false });
  }
});
app.get('/api/lookup/categories', async (req, res) => {
  try {
    const db_ = require('./config/database');
    const r = await db_.execute('SELECT cat_id, cat_name, cat_code FROM CATEGORIES WHERE is_active = 1 ORDER BY cat_name');
    res.json({ success: true, data: r.rows });
  } catch (err) {
    logger.error('Categories lookup error:', err);
    res.status(500).json({ success: false });
  }
});
app.get('/api/lookup/priorities', async (req, res) => {
  try {
    const db_ = require('./config/database');
    const r = await db_.execute('SELECT priority_id, priority_name, priority_code, color_hex FROM PRIORITIES WHERE is_active = 1 ORDER BY sort_order');
    res.json({ success: true, data: r.rows });
  } catch (err) {
    logger.error('Priorities lookup error:', err);
    res.status(500).json({ success: false });
  }
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin',   require('./routes/admin'));

// Notifications route (accessible to all authenticated users)
const { authenticate } = require('./middleware/auth');
const db_ = require('./config/database');

app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const result = await db_.execute(
      `SELECT n.*, t.ticket_ref FROM NOTIFICATIONS n
       LEFT JOIN TICKETS t ON n.ticket_id = t.ticket_id
       WHERE n.user_id = :1
       ORDER BY n.created_at DESC FETCH FIRST 20 ROWS ONLY`,
      [req.user.USER_ID]
    );
    const unread = await db_.execute(
      `SELECT COUNT(*) AS cnt FROM NOTIFICATIONS WHERE user_id = :1 AND is_read = 0`,
      [req.user.USER_ID]
    );
    res.json({ success: true, data: result.rows, unread_count: unread.rows[0].CNT });
  } catch (err) {
    logger.error('Notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/notifications/mark-read', authenticate, async (req, res) => {
  try {
    await db_.execute(`UPDATE NOTIFICATIONS SET is_read = 1 WHERE user_id = :1`, [req.user.USER_ID]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── 404 ─────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred' });
});

// ─── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await db.initialize();
    app.listen(PORT, () => {
      logger.info(`SAIL Helpdesk API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

start();