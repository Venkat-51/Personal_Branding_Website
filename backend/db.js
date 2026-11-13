const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const { Pool } = require('pg');

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test connection and auto-initialize table
  pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      submission_id VARCHAR(64) UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      business_name VARCHAR(255),
      business_type VARCHAR(255),
      timeline VARCHAR(100),
      budget VARCHAR(100),
      requirements TEXT,
      additional_notes TEXT,
      message TEXT,
      attachments TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS message TEXT;
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS attachments TEXT;
  `)
  .then(() => {
    console.log('🐘 [NEON POSTGRESQL] Connected and inquiries table ready!');
  })
  .catch(err => {
    console.error('⚠️ [NEON POSTGRESQL ERROR] Connection or init failed:', err.message);
  });
} else {
  console.log('ℹ️ [DATABASE] DATABASE_URL not found. Inquiries will be saved to local JSON file.');
}

async function saveInquiryToPostgres(data) {
  if (!pool) return null;
  const query = `
    INSERT INTO inquiries (
      submission_id,
      name,
      email,
      phone,
      business_name,
      business_type,
      timeline,
      budget,
      requirements,
      additional_notes,
      message,
      attachments,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  const values = [
    data.id,
    data.name,
    data.email,
    data.phone || null,
    data.businessName || null,
    data.businessType || null,
    data.timeline || null,
    data.budget || null,
    data.requirements || null,
    data.additionalNotes || null,
    data.message || null,
    data.attachments ? JSON.stringify(data.attachments) : null,
    data.createdAt || new Date()
  ];
  const res = await pool.query(query, values);
  return res.rows[0];
}

module.exports = {
  pool,
  saveInquiryToPostgres
};

