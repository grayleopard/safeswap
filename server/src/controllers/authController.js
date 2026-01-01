import pool from '../db/config.js';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';

// Initialize Twilio client (will be null if not configured)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Generate a 6-digit verification code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await pool.query(
      'INSERT INTO verification_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    // Send SMS via Twilio (if configured)
    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your SafeSwap verification code is: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    } else {
      // Development mode: log the code
      console.log(`Verification code for ${phone}: ${code}`);
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required' });
    }

    // Check if code is valid
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phone, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Delete used verification code
    await pool.query(
      'DELETE FROM verification_codes WHERE phone = $1',
      [phone]
    );

    // Find or create user
    let userResult = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user (minimal info for now)
      const newUser = await pool.query(
        'INSERT INTO users (phone_number, verified) VALUES ($1, $2) RETURNING *',
        [phone, true]
      );
      user = newUser.rows[0];
    } else {
      // Update existing user
      const updatedUser = await pool.query(
        'UPDATE users SET verified = TRUE, updated_at = NOW() WHERE phone_number = $1 RETURNING *',
        [phone]
      );
      user = updatedUser.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone_number },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone_number,
        username: user.username,
        name: user.name,
        verified: user.verified,
        isVerifiedParent: user.is_verified_parent,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { phone, code, username, name, locationZip } = req.body;

    // Validate required fields
    if (!phone || !code || !username || !name || !locationZip) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username format (3-50 chars, alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({
        message: 'Username must be 3-50 characters and contain only letters, numbers, and underscores'
      });
    }

    // Validate ZIP code (5 digits)
    if (!/^[0-9]{5}$/.test(locationZip)) {
      return res.status(400).json({ message: 'ZIP code must be 5 digits' });
    }

    // Verify the code is still valid
    const codeResult = await pool.query(
      'SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Check if username is already taken
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Update user with profile info
    const result = await pool.query(
      `UPDATE users
       SET username = $1, name = $2, location_zip = $3, updated_at = NOW()
       WHERE phone_number = $4
       RETURNING *`,
      [username, name, locationZip, phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone_number },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone_number,
        username: user.username,
        name: user.name,
        locationZip: user.location_zip,
        verified: user.verified,
        isVerifiedParent: user.is_verified_parent,
      },
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Failed to complete profile' });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, phone_number, username, name, location_zip, verified, is_verified_parent, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone_number,
      username: user.username,
      name: user.name,
      locationZip: user.location_zip,
      verified: user.verified,
      isVerifiedParent: user.is_verified_parent,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
};
