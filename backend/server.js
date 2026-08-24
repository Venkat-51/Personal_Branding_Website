require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
app.use(cors());
app.use(express.json());

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Studio.Dev Backend Service',
    brevoConfigured: !!process.env.BREVO_API_KEY
  });
});

// POST /api/contact - Handle contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || !message) {
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
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (brevoApiKey) {
        try {
          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey.trim(),
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: 'Studio.Dev Portfolio', email: 'gvenkateswaran3@gmail.com' },
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
            console.log('[BREVO SUCCESS] Email dispatched via Brevo API! Message ID:', brevoResult.messageId);
          } else {
            console.error('[BREVO API ERROR]', brevoResult);
          }
        } catch (brevoErr) {
          console.error('[BREVO API EXCEPTION]', brevoErr.message);
        }
      } else {
        console.error('[BREVO API ERROR] BREVO_API_KEY is not configured.');
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
    console.log(`🚀 Studio.Dev Backend running on http://0.0.0.0:${PORT}`);
    console.log(`- Brevo API Enabled: ${!!process.env.BREVO_API_KEY}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const ALT_PORT = 5001;
      console.log(`[PORT BUSY] Port ${PORT} occupied, falling back to http://0.0.0.0:${ALT_PORT}`);
      app.listen(ALT_PORT, '0.0.0.0', () => {
        console.log(`🚀 Studio.Dev Backend running on http://0.0.0.0:${ALT_PORT}`);
        console.log(`- Brevo API Enabled: ${!!process.env.BREVO_API_KEY}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;
