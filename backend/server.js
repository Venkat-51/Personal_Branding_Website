require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory and submissions file exist safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
    'https://personalbranding-seven.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS BLOCKED] Origin not allowed: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Serve static assets from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Clean App Password (strip any whitespace)
const cleanEmailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const cleanEmailUser = (process.env.EMAIL_USER || 'gvenkateswaran3@gmail.com').trim();

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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'y2solutions Backend Service',
    gmailConfigured: !!cleanEmailPass,
    brevoConfigured: !!process.env.BREVO_API_KEY
  });
});

// POST /api/contact - Handle contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || service === 'Choose a project type' || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, project type, and message are required fields.'
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

    const newSubmission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      email,
      phone: phone || 'Not provided',
      service: service || 'General Inquiry',
      message,
      recipient: 'gvenkateswaran3@gmail.com',
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

    console.log(`[CONTACT INQUIRY RECEIVED] From: ${name} <${email}> | Phone: ${phone || 'N/A'} | Service: ${service}`);

    // Respond INSTANTLY to the user (under 200ms)
    res.status(201).json({
      success: true,
      message: `Thank you for your message, ${name}! I will reach out to you within 24 hours.`,
      data: newSubmission
    });

    // Dispatch email asynchronously in background (Non-blocking)
    setImmediate(async () => {
      let emailSent = false;

      // 1. Primary: Gmail SMTP
      if (cleanEmailPass) {
        try {
          const mailInfo = await transporter.sendMail({
            from: `"y2solutions Portfolio" <${cleanEmailUser}>`,
            to: 'gvenkateswaran3@gmail.com',
            replyTo: email,
            subject: `New Project Inquiry from ${name} (${service || 'General'})`,
            text: `Name: ${name}\nSender Email: ${email}\nPhone Number: ${phone || 'Not provided'}\nProject Type: ${service || 'General'}\n\nProject Details:\n${message}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd;">
                <h2 style="color: #006c4b; margin-top: 0; font-size: 20px;">New Project Inquiry Received</h2>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2eae3;">
                  <p style="margin: 6px 0;"><strong>👤 Customer Name:</strong> ${name}</p>
                  <p style="margin: 6px 0;"><strong>✉️ Email Address:</strong> <a href="mailto:${email}" style="color: #006c4b;">${email}</a></p>
                  <p style="margin: 6px 0;"><strong>📞 Phone Number:</strong> <a href="tel:${phone}" style="color: #006c4b; font-weight: bold; text-decoration: none;">${phone || 'Not provided'}</a></p>
                  <p style="margin: 6px 0;"><strong>💼 Project Type:</strong> ${service || 'General Inquiry'}</p>
                </div>
                <p style="margin-bottom: 8px;"><strong>📝 Project Details:</strong></p>
                <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
                <p style="font-size: 12px; color: #6c7a71; margin: 0;">Dispatched automatically to gvenkateswaran3@gmail.com via Gmail SMTP</p>
              </div>
            `
          });
          console.log('[GMAIL SMTP SUCCESS] Owner email sent! Message ID:', mailInfo.messageId);
          emailSent = true;
        } catch (gmailErr) {
          console.error('[GMAIL SMTP ERROR]', gmailErr.message);
        }

        // Send confirmation email to customer
        try {
          const confirmInfo = await transporter.sendMail({
            from: `"y2solutions Portfolio" <${cleanEmailUser}>`,
            to: email,
            subject: `We received your inquiry, ${name}! 🎉`,
            text: `Hi ${name},\n\nThank you for reaching out! I've received your inquiry about "${service || 'your project'}" and will get back to you within 24 hours.\n\nHere's a summary of what you submitted:\n- Project Type: ${service || 'General Inquiry'}\n- Phone: ${phone || 'Not provided'}\n\nYour Message:\n${message}\n\nLooking forward to working with you!\n\nBest regards,\nVenkateswaran G\ny2solutions`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd; max-width: 600px;">
                <h2 style="color: #006c4b; margin-top: 0; font-size: 22px;">Thanks for reaching out, ${name}! 🎉</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">I've received your inquiry and will get back to you <strong>within 24 hours</strong>.</p>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2eae3;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #6c7a71; text-transform: uppercase; letter-spacing: 0.5px;">Your Submission Summary</p>
                  <p style="margin: 6px 0;"><strong>💼 Project Type:</strong> ${service || 'General Inquiry'}</p>
                  <p style="margin: 6px 0;"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
                </div>
                <p style="margin-bottom: 8px; font-size: 14px;"><strong>📝 Your Message:</strong></p>
                <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 24px;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">Looking forward to working with you!</p>
                <p style="font-size: 15px; color: #3c4a42; margin-bottom: 4px;">Best regards,</p>
                <p style="font-size: 16px; font-weight: bold; color: #006c4b; margin: 0;">Venkateswaran G</p>
                <p style="font-size: 13px; color: #6c7a71; margin: 2px 0 0 0;">y2solutions</p>
                <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
                <p style="font-size: 11px; color: #6c7a71; margin: 0;">This is an automated confirmation. Please do not reply to this email.</p>
              </div>
            `
          });
          console.log('[GMAIL SMTP SUCCESS] Customer confirmation email sent! Message ID:', confirmInfo.messageId);
        } catch (confirmErr) {
          console.error('[GMAIL SMTP ERROR] Customer confirmation failed:', confirmErr.message);
        }
      }

      // 2. Secondary: Brevo API fallback
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!emailSent && brevoApiKey) {
        try {
          // Owner notification via Brevo
          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey.trim(),
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: 'y2solutions Portfolio', email: 'gvenkateswaran3@gmail.com' },
              to: [{ email: 'gvenkateswaran3@gmail.com', name: 'Venkateswaran' }],
              replyTo: { email: email, name: name },
              subject: `New Project Inquiry from ${name} (${service || 'General'})`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #161d19; background-color: #f4fbf4; border-radius: 8px;">
                  <h2 style="color: #006c4b; margin-top: 0;">New Project Inquiry</h2>
                  <p><strong>Sender Name:</strong> ${name}</p>
                  <p><strong>Sender Email:</strong> ${email}</p>
                  <p><strong>Sender Phone Number:</strong> ${phone || 'Not provided'}</p>
                  <p><strong>Project Type:</strong> ${service || 'General Inquiry'}</p>
                  <p><strong>Project Details:</strong></p>
                  <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #006c4b; border-radius: 4px; font-size: 14px; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                </div>
              `
            })
          });

          const brevoResult = await brevoResponse.json();
          if (brevoResponse.ok) {
            console.log('[BREVO SUCCESS] Owner email dispatched via Brevo API! Message ID:', brevoResult.messageId);
          } else {
            console.error('[BREVO API ERROR]', brevoResult);
          }
        } catch (brevoErr) {
          console.error('[BREVO API EXCEPTION]', brevoErr.message);
        }

        // Customer confirmation via Brevo
        try {
          const brevoConfirmResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey.trim(),
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: 'y2solutions Portfolio', email: 'gvenkateswaran3@gmail.com' },
              to: [{ email: email, name: name }],
              subject: `We received your inquiry, ${name}! 🎉`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 24px; color: #161d19; background-color: #f4fbf4; border-radius: 12px; border: 1px solid #dde4dd; max-width: 600px;">
                  <h2 style="color: #006c4b; margin-top: 0; font-size: 22px;">Thanks for reaching out, ${name}! 🎉</h2>
                  <p style="font-size: 15px; line-height: 1.6; color: #3c4a42;">I've received your inquiry and will get back to you <strong>within 24 hours</strong>.</p>
                  <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2eae3;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #6c7a71; text-transform: uppercase; letter-spacing: 0.5px;">Your Submission Summary</p>
                    <p style="margin: 6px 0;"><strong>💼 Project Type:</strong> ${service || 'General Inquiry'}</p>
                    <p style="margin: 6px 0;"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
                  </div>
                  <p style="margin-bottom: 8px; font-size: 14px;"><strong>📝 Your Message:</strong></p>
                  <div style="background-color: #ffffff; padding: 16px; border-left: 4px solid #006c4b; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #3c4a42; margin-bottom: 24px;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <p style="font-size: 15px; font-weight: bold; color: #006c4b; margin: 0;">Venkateswaran G — y2solutions</p>
                  <hr style="border: none; border-top: 1px solid #bbcac0; margin-top: 24px; margin-bottom: 12px;">
                  <p style="font-size: 11px; color: #6c7a71; margin: 0;">This is an automated confirmation. Please do not reply to this email.</p>
                </div>
              `
            })
          });

          const brevoConfirmResult = await brevoConfirmResponse.json();
          if (brevoConfirmResponse.ok) {
            console.log('[BREVO SUCCESS] Customer confirmation dispatched via Brevo API! Message ID:', brevoConfirmResult.messageId);
          } else {
            console.error('[BREVO CONFIRM ERROR]', brevoConfirmResult);
          }
        } catch (brevoConfirmErr) {
          console.error('[BREVO CONFIRM EXCEPTION]', brevoConfirmErr.message);
        }
      }
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
app.get('/api/contact', (req, res) => {
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
    console.log(`🚀 y2solutions Backend running on http://0.0.0.0:${PORT}`);
    console.log(`- Gmail SMTP Enabled: ${!!cleanEmailPass}`);
    console.log(`- Brevo API Enabled: ${!!process.env.BREVO_API_KEY}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = 5001;
      console.log(`[PORT BUSY] Port ${PORT} occupied, falling back to http://0.0.0.0:${ALT_PORT}`);
      app.listen(ALT_PORT, '0.0.0.0', () => {
        console.log(`🚀 y2solutions Backend running on http://0.0.0.0:${ALT_PORT}`);
        console.log(`- Gmail SMTP Enabled: ${!!cleanEmailPass}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;
