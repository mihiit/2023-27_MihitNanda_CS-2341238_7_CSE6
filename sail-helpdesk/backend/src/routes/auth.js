// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('employee_id').trim().notEmpty().withMessage('Employee ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_id, password } = req.body;

    const result = await db.execute(
      `SELECT u.user_id, u.emp_id, u.full_name, u.email, u.password_hash,
              u.role, u.dept_id, u.is_active,
              u.failed_login_attempts, u.account_locked_until, d.dept_name
       FROM USERS u
       LEFT JOIN DEPARTMENTS d ON u.dept_id = d.dept_id
       WHERE u.emp_id = :1`,
      [employee_id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.IS_ACTIVE) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact IT Admin.' });
    }

    // Check account lock
    if (user.ACCOUNT_LOCKED_UNTIL && new Date(user.ACCOUNT_LOCKED_UNTIL) > new Date()) {
      return res.status(401).json({ 
        success: false, 
        message: `Account locked until ${new Date(user.ACCOUNT_LOCKED_UNTIL).toLocaleString()}` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);

    if (!isMatch) {
      const attempts = (user.FAILED_LOGIN_ATTEMPTS || 0) + 1;
      const lockUpdate = attempts >= 5
        ? `, account_locked_until = SYSTIMESTAMP + INTERVAL '30' MINUTE`
        : '';
      await db.execute(
        `UPDATE USERS SET failed_login_attempts = :1 ${lockUpdate} WHERE user_id = :2`,
        [attempts, user.USER_ID]
      );
      return res.status(401).json({ 
        success: false, 
        message: attempts >= 5 
          ? 'Account locked for 30 minutes due to multiple failed attempts'
          : `Invalid credentials. ${5 - attempts} attempts remaining.`
      });
    }

    // Reset attempts on success
    await db.execute(
      `UPDATE USERS SET failed_login_attempts = 0, account_locked_until = NULL, last_login = SYSTIMESTAMP WHERE user_id = :1`,
      [user.USER_ID]
    );

    const token = jwt.sign(
      { userId: user.USER_ID, role: user.ROLE, empId: user.EMP_ID },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`User login: ${user.EMP_ID} (${user.ROLE})`);

    res.json({
      success: true,
      token,
      user: {
        user_id: user.USER_ID,
        employee_id: user.EMP_ID,
        full_name: user.FULL_NAME,
        email: user.EMAIL,
        role: user.ROLE,
        dept_id: user.DEPT_ID,
        dept_name: user.DEPT_NAME,
        designation: user.DESIGNATION,
        phone: user.PHONE,
      },
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT u.user_id, u.emp_id, u.full_name, u.email, u.role,
              u.dept_id, u.last_login, d.dept_name
       FROM USERS u
       LEFT JOIN DEPARTMENTS d ON u.dept_id = d.dept_id
       WHERE u.user_id = :1`,
      [req.user.USER_ID]
    );
    const row = result.rows[0];
    // normalize emp_id -> employee_id for frontend compatibility
    if (row) row.EMPLOYEE_ID = row.EMP_ID;
    res.json({ success: true, user: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { current_password, new_password } = req.body;
    const result = await db.execute('SELECT password_hash FROM USERS WHERE user_id = :1', [req.user.USER_ID]);
    const isMatch = await bcrypt.compare(current_password, result.rows[0].PASSWORD_HASH);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE USERS SET password_hash = :1 WHERE user_id = :2', [hash, req.user.USER_ID]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;