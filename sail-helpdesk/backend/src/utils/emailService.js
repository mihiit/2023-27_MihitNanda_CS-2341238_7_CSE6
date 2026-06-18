// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const SAIL_LOGO = `
  <div style="background:#003087;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#FFD700;margin:0;font-size:22px;font-family:Georgia,serif;">
      ⚙️ SAIL IT Helpdesk
    </h1>
    <p style="color:#b3c6e7;margin:4px 0 0;font-size:12px;font-family:Arial,sans-serif;">
      Steel Authority of India Limited
    </p>
  </div>
`;

const emailTemplates = {
  ticketCreated: (ticket, user) => ({
    subject: `[SAIL Helpdesk] Ticket ${ticket.ticket_ref} Created - ${ticket.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        ${SAIL_LOGO}
        <div style="padding:24px;background:#fff;">
          <h2 style="color:#003087;margin-top:0;">Your ticket has been created</h2>
          <p>Dear <strong>${user.full_name}</strong>,</p>
          <p>Your IT support ticket has been successfully submitted.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;width:35%;">Ticket ID</td>
                <td style="padding:8px;border:1px solid #ddd;">${ticket.ticket_ref}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Subject</td>
                <td style="padding:8px;border:1px solid #ddd;">${ticket.subject}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Priority</td>
                <td style="padding:8px;border:1px solid #ddd;">${ticket.priority_name || 'Medium'}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Status</td>
                <td style="padding:8px;border:1px solid #ddd;"><span style="color:#16a34a;font-weight:bold;">OPEN</span></td></tr>
          </table>
          <p>Our IT team will review your request and respond shortly.</p>
          <a href="${process.env.FRONTEND_URL}/tickets/${ticket.ticket_id}" 
             style="background:#003087;color:#FFD700;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:8px;font-weight:bold;">
            View Ticket
          </a>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;text-align:center;font-size:12px;color:#666;">
          SAIL IT Helpdesk | Steel Authority of India Limited | helpdesk@sail.in
        </div>
      </div>
    `,
  }),

  ticketUpdated: (ticket, user, updateNote) => ({
    subject: `[SAIL Helpdesk] Ticket ${ticket.ticket_ref} Updated`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        ${SAIL_LOGO}
        <div style="padding:24px;background:#fff;">
          <h2 style="color:#003087;margin-top:0;">Ticket Update Notification</h2>
          <p>Dear <strong>${user.full_name}</strong>,</p>
          <p>There has been an update to your ticket <strong>${ticket.ticket_ref}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;width:35%;">Ticket ID</td>
                <td style="padding:8px;border:1px solid #ddd;">${ticket.ticket_ref}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Status</td>
                <td style="padding:8px;border:1px solid #ddd;">${ticket.status}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Update</td>
                <td style="padding:8px;border:1px solid #ddd;">${updateNote}</td></tr>
          </table>
          <a href="${process.env.FRONTEND_URL}/tickets/${ticket.ticket_id}"
             style="background:#003087;color:#FFD700;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:8px;font-weight:bold;">
            View Ticket
          </a>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;text-align:center;font-size:12px;color:#666;">
          SAIL IT Helpdesk | Steel Authority of India Limited | helpdesk@sail.in
        </div>
      </div>
    `,
  }),

  ticketClosed: (ticket, user) => ({
    subject: `[SAIL Helpdesk] Ticket ${ticket.ticket_ref} Resolved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        ${SAIL_LOGO}
        <div style="padding:24px;background:#fff;">
          <h2 style="color:#003087;margin-top:0;">✅ Ticket Resolved</h2>
          <p>Dear <strong>${user.full_name}</strong>,</p>
          <p>Your ticket <strong>${ticket.ticket_ref}</strong> has been resolved.</p>
          <p>Please click below to view the resolution or provide feedback.</p>
          <a href="${process.env.FRONTEND_URL}/tickets/${ticket.ticket_id}"
             style="background:#16a34a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:8px;font-weight:bold;">
            View Resolution & Rate
          </a>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;text-align:center;font-size:12px;color:#666;">
          SAIL IT Helpdesk | Steel Authority of India Limited | helpdesk@sail.in
        </div>
      </div>
    `,
  }),

  newReply: (ticket, user, replyBody) => ({
    subject: `[SAIL Helpdesk] New Reply on Ticket ${ticket.ticket_ref}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        ${SAIL_LOGO}
        <div style="padding:24px;background:#fff;">
          <h2 style="color:#003087;margin-top:0;">💬 New Reply on Your Ticket</h2>
          <p>Dear <strong>${user.full_name}</strong>,</p>
          <p>A new reply has been added to ticket <strong>${ticket.ticket_ref}</strong>:</p>
          <div style="background:#f0f4ff;border-left:4px solid #003087;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0;">
            <p style="margin:0;color:#333;">${replyBody.substring(0, 300)}${replyBody.length > 300 ? '...' : ''}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/tickets/${ticket.ticket_id}"
             style="background:#003087;color:#FFD700;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:8px;font-weight:bold;">
            Reply to Ticket
          </a>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;text-align:center;font-size:12px;color:#666;">
          SAIL IT Helpdesk | Steel Authority of India Limited | helpdesk@sail.in
        </div>
      </div>
    `,
  }),
};

async function sendEmail(to, templateName, data) {
  try {
    if (!process.env.SMTP_USER) {
      logger.warn('SMTP not configured, skipping email send');
      return { success: false, reason: 'SMTP not configured' };
    }
    const template = emailTemplates[templateName](...data);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SAIL IT Helpdesk <helpdesk@sail.in>',
      to,
      subject: template.subject,
      html: template.html,
    });
    logger.info(`Email sent: ${templateName} to ${to}`);
    return { success: true };
  } catch (err) {
    logger.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail };
