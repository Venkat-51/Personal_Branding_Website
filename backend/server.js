const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { saveInquiryToPostgres } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory and submissions file exist safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2));
  }
} catch (err) {
  console.warn('[STORAGE WARNING] Could not write to local storage file:', err.message);
}

// Middleware
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat([
    'https://freelancewithvenkat.vercel.app',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or 'null' (e.g. direct file:/// preview, curl, mobile)
    if (!origin || origin === 'null') return callback(null, true);

    // Allow any localhost / 127.0.0.1 / local network IP on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow configured origins or standard deployment domains
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    // Default to allow to prevent blocking client inquiries
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Multer configuration for file uploads (max 5 MB per file, up to 3 files)
const ALLOWED_FILE_TYPES = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpg|jpeg|gif|svg|zip|rar|fig|ai|psd|eps)$/i;
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const uniquePrefix = Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      cb(null, uniquePrefix + '_' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File format not supported for "${file.originalname}". Allowed formats: PDF, DOCX, DOC, XLSX, XLS, PPTX, Images, ZIP, Figma, AI, PSD.`));
    }
  }
});

// Middleware to gracefully handle multer errors and return JSON
const handleUpload = (req, res, next) => {
  upload.array('attachments', 3)(req, res, (err) => {
    if (err) {
      console.warn('[UPLOAD REJECTED]', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 5 MB limit. Please attach smaller files.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Maximum 3 files allowed per inquiry.'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed.'
      });
    }
    next();
  });
};

// Serve static assets from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Clean App Password (strip any whitespace)
const cleanEmailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const cleanEmailUser = (process.env.EMAIL_USER || 'freelancewithvenkat@gmail.com').trim();

// Transporter setup (Nodemailer Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  auth: {
    user: cleanEmailUser,
    pass: cleanEmailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// GET /api/health - Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FreelanceWithVenkat Backend Service',
    gmailConfigured: !!cleanEmailPass,
    brevoConfigured: !!process.env.BREVO_API_KEY,
    neonDatabaseConfigured: !!process.env.DATABASE_URL
  });
});

// POST /api/contact - Handle contact form submissions
app.post(['/api/contact', '/contact'], handleUpload, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      businessName,
      service,
      businessType,
      timeline,
      budget,
      requirements,
      additionalNotes,
      message
    } = req.body;

    const finalRequirements = requirements || message || '';

    if (!name || !email || !phone || !finalRequirements) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone number, and requirements are required fields.'
      });
    }

    // Phone validation (must contain 10-digit number)
    const rawPhoneDigits = String(phone).replace(/\D/g, '');
    if (rawPhoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit phone number.'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address.'
      });
    }

    // Map uploaded files
    const uploadedFiles = req.files || [];
    const attachments = uploadedFiles.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
      path: f.path
    }));

    const fullMessage = finalRequirements + (additionalNotes ? `\n\nAdditional Notes:\n${additionalNotes}` : '');

    const newSubmission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      email,
      phone: phone || 'Not provided',
      businessName: businessName || 'Not specified',
      service: service || businessType || 'General Inquiry',
      businessType: businessType || 'Not specified',
      timeline: timeline || 'Not specified',
      budget: budget || 'Not specified',
      requirements: finalRequirements,
      additionalNotes: additionalNotes || '',
      attachments: attachments,
      message: fullMessage,
      recipient: 'freelancewithvenkat@gmail.com',
      createdAt: new Date().toISOString()
    };

    // Save to JSON Database safely
    try {
      const currentData = fs.existsSync(SUBMISSIONS_FILE)
        ? JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'))
        : [];
      currentData.unshift(newSubmission);
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(currentData, null, 2));
    } catch (fsErr) {
      console.warn('[STORAGE WARNING] Failed to save submission locally:', fsErr.message);
    }

    // Save to Neon PostgreSQL if DATABASE_URL is configured
    try {
      const pgRow = await saveInquiryToPostgres(newSubmission);
      if (pgRow) {
        console.log(`🐘 [DATABASE SUCCESS] Inquiry #${pgRow.id} saved to Neon PostgreSQL!`);
      } else {
        console.warn('ℹ️ [DATABASE NOTICE] Neon pool not active, skipped DB insert.');
      }
    } catch (pgErr) {
      console.error('❌ [NEON POSTGRES ERROR] Failed to save submission:', pgErr.message);
    }

    console.log(`[CONTACT INQUIRY RECEIVED] From: ${name} <${email}> | Phone: ${phone || 'N/A'} | Business: ${businessName || 'N/A'} (${businessType || 'N/A'}) | Files: ${attachments.length}`);

    // Track email dispatch status
    let ownerEmailSent = false;
    let customerEmailSent = false;

    const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderName = (process.env.SENDER_NAME || 'Freelance With Venkat').trim();
    const ownerEmail = 'freelancewithvenkat@gmail.com';

    // 1. PRIMARY: Brevo Transactional Email API (Parallel Owner + Customer dispatch)
    if (brevoApiKey) {
      // Prepare base64 attachments for Brevo if files exist
      const brevoAttachments = uploadedFiles.map(f => {
        try {
          return {
            name: f.originalname,
            content: fs.readFileSync(f.path).toString('base64')
          };
        } catch (readErr) {
          console.warn('[BREVO ATTACHMENT READ WARNING]', readErr.message);
          return null;
        }
      }).filter(Boolean);

      const sendBrevo = async (payload, target) => {
        try {
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey,
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const result = await res.json().catch(() => ({}));
          if (res.ok) {
            console.log(`🚀 [BREVO SUCCESS] ${target} email dispatched! Message ID:`, result.messageId);
            return true;
          } else {
            if (result.code === 'unauthorized' || (result.message && result.message.includes('unrecognised IP'))) {
              console.error(`⚠️ [BREVO IP RESTRICTION ERROR]: Brevo rejected the API call because the server IP is not authorized. Visit https://app.brevo.com/security/authorised_ips to disable the IP restriction.`);
            } else {
              console.error(`⚠️ [BREVO ${target.toUpperCase()} ERROR]`, result.message || result);
            }
            return false;
          }
        } catch (err) {
          console.error(`❌ [BREVO ${target.toUpperCase()} EXCEPTION]`, err.message);
          return false;
        }
      };

      // A. Owner Payload
      const ownerBrevoPayload = {
        sender: { name: senderName, email: ownerEmail },
        to: [{ email: ownerEmail, name: 'Venkateswaran G' }],
        replyTo: { email: email, name: name },
        subject: `New Project Inquiry from ${name} (${businessName ? businessName + ' - ' : ''}${businessType || 'General'})`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd; max-width: 650px;">
            <h2 style="color: #006c4b; margin-top: 0; font-size: 20px;">New Project Inquiry Received</h2>
            <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2eae3;">
              <p style="margin: 6px 0;"><strong>👤 Customer Name:</strong> ${name}</p>
              <p style="margin: 6px 0;"><strong>✉️ Email Address:</strong> <a href="mailto:${email}" style="color: #006c4b;">${email}</a></p>
              <p style="margin: 6px 0;"><strong>📞 Phone Number:</strong> <a href="tel:${phone}" style="color: #006c4b; font-weight: bold; text-decoration: none;">${phone || 'Not provided'}</a></p>
              <p style="margin: 6px 0;"><strong>🏢 Business Name:</strong> ${businessName || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>🏢 Business Type:</strong> ${businessType || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>⏱️ Expected Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>💰 Estimated Budget:</strong> ${budget || 'Not specified'}</p>
              ${attachments.length > 0 ? `
              <p style="margin: 8px 0 4px 0;"><strong>📎 Attached Files (${attachments.length}):</strong></p>
              <ul style="margin: 4px 0 8px 20px; padding: 0; color: #006c4b;">
                ${attachments.map(a => `<li><strong>${a.originalName}</strong> (${(a.size / 1024).toFixed(1)} KB)</li>`).join('')}
              </ul>` : ''}
            </div>
            <p style="margin-bottom: 8px;"><strong>📝 Requirements:</strong></p>
            <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 16px;">
              ${finalRequirements.replace(/\n/g, '<br>')}
            </div>
            ${additionalNotes ? `
            <p style="margin-bottom: 8px;"><strong>📌 Additional Notes / Instructions:</strong></p>
            <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #6c7a71; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 16px;">
              ${additionalNotes.replace(/\n/g, '<br>')}
            </div>` : ''}
            <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
            <p style="font-size: 11px; color: #6c7a71; margin: 0;">Dispatched via Brevo Transactional Email Service to ${ownerEmail}</p>
          </div>
        `
      };

      if (brevoAttachments.length > 0) {
        ownerBrevoPayload.attachment = brevoAttachments;
      }

      // B. Customer Confirmation Payload
      const customerBrevoPayload = {
        sender: { name: senderName, email: ownerEmail },
        to: [{ email: email, name: name }],
        replyTo: { email: ownerEmail, name: senderName },
        subject: `We received your inquiry, ${name}! 🎉`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd; max-width: 600px;">
            <h2 style="color: #006c4b; margin-top: 0; font-size: 22px;">Thanks for reaching out, ${name}! 🎉</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">I've received your inquiry and will review your requirements and get back to you <strong>within 24 hours</strong>.</p>
            <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2eae3;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #6c7a71; text-transform: uppercase; letter-spacing: 0.5px;">Your Submission Summary</p>
              <p style="margin: 6px 0;"><strong>🏢 Business Name:</strong> ${businessName || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>🏢 Business Type:</strong> ${businessType || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>⏱️ Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>💰 Budget:</strong> ${budget || 'Not specified'}</p>
              <p style="margin: 6px 0;"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
              ${attachments.length > 0 ? `
              <p style="margin: 6px 0;"><strong>📎 Attached Files:</strong> ${attachments.map(a => a.originalName).join(', ')}</p>` : ''}
            </div>
            <p style="margin-bottom: 8px; font-size: 14px;"><strong>📝 Requirements:</strong></p>
            <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 24px;">
              ${finalRequirements.replace(/\n/g, '<br>')}
            </div>
            <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">Looking forward to collaborating with you!</p>
            <p style="font-size: 15px; color: #3c4a42; margin-bottom: 4px;">Best regards,</p>
            <p style="font-size: 16px; font-weight: bold; color: #006c4b; margin: 0;">Venkateswaran G</p>
            <p style="font-size: 13px; color: #6c7a71; margin: 2px 0 0 0;">${senderName}</p>
            <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
            <p style="font-size: 11px; color: #6c7a71; margin: 0;">Automated confirmation from ${senderName}. Please do not reply directly to this automated email.</p>
          </div>
        `
      };

      // Parallel execution for fast response
      const [ownerRes, customerRes] = await Promise.allSettled([
        sendBrevo(ownerBrevoPayload, 'Owner'),
        sendBrevo(customerBrevoPayload, 'Customer')
      ]);

      ownerEmailSent = ownerRes.status === 'fulfilled' && ownerRes.value === true;
      customerEmailSent = customerRes.status === 'fulfilled' && customerRes.value === true;
    }

    // 2. SECONDARY / FALLBACK: Gmail SMTP (if Brevo failed or is unconfigured)
    if (cleanEmailPass && (!ownerEmailSent || !customerEmailSent)) {
      console.log('ℹ️ [EMAIL DISPATCH] Engaging Gmail SMTP fallback...');
      const emailAttachments = uploadedFiles.map(f => ({
        filename: f.originalname,
        path: f.path
      }));

      // Fallback Owner notification via Gmail
      if (!ownerEmailSent) {
        try {
          const mailInfo = await transporter.sendMail({
            from: `"${senderName}" <${cleanEmailUser}>`,
            to: ownerEmail,
            replyTo: email,
            subject: `New Project Inquiry from ${name} (${businessName ? businessName + ' - ' : ''}${businessType || 'General'})`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nBusiness Name: ${businessName || 'N/A'}\nBusiness Type: ${businessType || 'N/A'}\nExpected Timeline: ${timeline || 'N/A'}\nEstimated Budget: ${budget || 'N/A'}\n\nRequirements:\n${finalRequirements}\n\nAdditional Notes:\n${additionalNotes || 'None'}\n\nAttached Files (${attachments.length}):\n${attachments.map(a => `- ${a.originalName} (${(a.size / 1024).toFixed(1)} KB)`).join('\n') || 'None'}`,
            attachments: emailAttachments,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd;">
                <h2 style="color: #006c4b; margin-top: 0; font-size: 20px;">New Project Inquiry Received</h2>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2eae3;">
                  <p style="margin: 6px 0;"><strong>👤 Customer Name:</strong> ${name}</p>
                  <p style="margin: 6px 0;"><strong>✉️ Email Address:</strong> <a href="mailto:${email}" style="color: #006c4b;">${email}</a></p>
                  <p style="margin: 6px 0;"><strong>📞 Phone Number:</strong> <a href="tel:${phone}" style="color: #006c4b; font-weight: bold; text-decoration: none;">${phone || 'Not provided'}</a></p>
                  <p style="margin: 6px 0;"><strong>🏢 Business Name:</strong> ${businessName || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>🏢 Business Type:</strong> ${businessType || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>⏱️ Expected Timeline:</strong> ${timeline || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>💰 Estimated Budget:</strong> ${budget || 'Not specified'}</p>
                  ${attachments.length > 0 ? `
                  <p style="margin: 6px 0;"><strong>📎 Attached Files (${attachments.length}):</strong></p>
                  <ul style="margin: 4px 0 6px 20px; padding: 0; color: #006c4b;">
                    ${attachments.map(a => `<li><strong>${a.originalName}</strong> (${(a.size / 1024).toFixed(1)} KB)</li>`).join('')}
                  </ul>` : ''}
                </div>
                <p style="margin-bottom: 8px;"><strong>📝 Requirements:</strong></p>
                <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 16px;">
                  ${finalRequirements.replace(/\n/g, '<br>')}
                </div>
                ${additionalNotes ? `
                <p style="margin-bottom: 8px;"><strong>📌 Additional Notes / Instructions:</strong></p>
                <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #6c7a71; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42;">
                  ${additionalNotes.replace(/\n/g, '<br>')}
                </div>` : ''}
                <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
                <p style="font-size: 12px; color: #6c7a71; margin: 0;">Dispatched automatically to ${ownerEmail} via Gmail SMTP</p>
              </div>
            `
          });
          console.log('[GMAIL SMTP SUCCESS] Owner email sent! Message ID:', mailInfo.messageId);
          ownerEmailSent = true;
        } catch (gmailErr) {
          console.error('[GMAIL SMTP ERROR] Owner email failed:', gmailErr.message);
        }
      }

      // Fallback Customer confirmation via Gmail
      if (!customerEmailSent) {
        try {
          const confirmInfo = await transporter.sendMail({
            from: `"${senderName}" <${cleanEmailUser}>`,
            to: email,
            subject: `We received your inquiry, ${name}! 🎉`,
            text: `Hi ${name},\n\nThank you for reaching out! I've received your inquiry and will get back to you within 24 hours.\n\nHere's a summary of what you submitted:\n- Business Name: ${businessName || 'N/A'}\n- Business Type: ${businessType || 'N/A'}\n- Timeline: ${timeline || 'N/A'}\n- Budget: ${budget || 'N/A'}\n- Phone: ${phone || 'Not provided'}\n- Attached Files: ${attachments.map(a => a.originalName).join(', ') || 'None'}\n\nRequirements:\n${finalRequirements}\n\nLooking forward to working with you!\n\nBest regards,\nVenkateswaran G\n${senderName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd; max-width: 600px;">
                <h2 style="color: #006c4b; margin-top: 0; font-size: 22px;">Thanks for reaching out, ${name}! 🎉</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">I've received your inquiry and will get back to you <strong>within 24 hours</strong>.</p>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2eae3;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #6c7a71; text-transform: uppercase; letter-spacing: 0.5px;">Your Submission Summary</p>
                  <p style="margin: 6px 0;"><strong>🏢 Business Name:</strong> ${businessName || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>🏢 Business Type:</strong> ${businessType || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>⏱️ Timeline:</strong> ${timeline || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>💰 Budget:</strong> ${budget || 'Not specified'}</p>
                  <p style="margin: 6px 0;"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
                  ${attachments.length > 0 ? `
                  <p style="margin: 6px 0;"><strong>📎 Attached Files:</strong> ${attachments.map(a => a.originalName).join(', ')}</p>` : ''}
                </div>
                <p style="margin-bottom: 8px; font-size: 14px;"><strong>📝 Requirements:</strong></p>
                <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 24px;">
                  ${finalRequirements.replace(/\n/g, '<br>')}
                </div>
                <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">Looking forward to working with you!</p>
                <p style="font-size: 15px; color: #3c4a42; margin-bottom: 4px;">Best regards,</p>
                <p style="font-size: 16px; font-weight: bold; color: #006c4b; margin: 0;">Venkateswaran G</p>
                <p style="font-size: 13px; color: #6c7a71; margin: 2px 0 0 0;">${senderName}</p>
                <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
                <p style="font-size: 11px; color: #6c7a71; margin: 0;">This is an automated confirmation. Please do not reply to this email.</p>
              </div>
            `
          });
          console.log('[GMAIL SMTP SUCCESS] Customer confirmation email sent! Message ID:', confirmInfo.messageId);
          customerEmailSent = true;
        } catch (confirmErr) {
          console.error('[GMAIL SMTP ERROR] Customer confirmation failed:', confirmErr.message);
        }
      }
    }

    // Return responsive status
    res.status(201).json({
      success: true,
      message: `Thank you for your message, ${name}! Your inquiry has been sent to Venkat and a confirmation email has been dispatched to you.`,
      emailStatus: {
        owner: ownerEmailSent,
        customer: customerEmailSent
      },
      data: newSubmission
    });

  } catch (err) {
    console.error('[SERVER ERROR] Error processing contact form:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing contact submission.'
    });
  }
});

// GET /api/contact - Admin endpoint to list all contact submissions
app.get(['/api/contact', '/contact'], (req, res) => {
  try {
    const data = fs.existsSync(SUBMISSIONS_FILE)
      ? JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'))
      : [];
    res.json({
      success: true,
      count: data.length,
      submissions: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve submissions.' });
  }
});

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FreelanceWithVenkat Backend running on http://0.0.0.0:${PORT}`);
    console.log(`- Gmail SMTP Enabled: ${!!cleanEmailPass}`);
    console.log(`- Brevo API Enabled: ${!!process.env.BREVO_API_KEY}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = 5001;
      console.log(`[PORT BUSY] Port ${PORT} occupied, falling back to http://0.0.0.0:${ALT_PORT}`);
      app.listen(ALT_PORT, '0.0.0.0', () => {
        console.log(`🚀 FreelanceWithVenkat Backend running on http://0.0.0.0:${ALT_PORT}`);
        console.log(`- Gmail SMTP Enabled: ${!!cleanEmailPass}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;
