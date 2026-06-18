// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await db.execute(
      `SELECT u.user_id, u.emp_id, u.full_name, u.email, u.role, u.dept_id, 
              u.is_active
       FROM USERS u WHERE u.user_id = :1 AND u.is_active = 1`,
      [decoded.userId]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = result.rows[0];
    req.user.EMPLOYEE_ID = req.user.EMP_ID;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    logger.error('Auth middleware error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.ROLE)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to perform this action' 
      });
    }
    next();
  };
};

const auditLog = (action, entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    db.execute(
      `INSERT INTO AUDIT_LOGS (user_id, action, entity_type, entity_id, ip_address, user_agent, response_code)
       VALUES (:1, :2, :3, :4, :5, :6, :7)`,
      [
        req.user?.USER_ID || null,
        action,
        entityType,
        req.params?.id || body?.data?.ticket_id || null,
        req.ip,
        req.get('User-Agent')?.substring(0, 500),
        res.statusCode,
      ]
    ).catch(e => logger.error('Audit log error:', e.message));
    return originalJson(body);
  };
  next();
};

module.exports = { authenticate, authorize, auditLog };