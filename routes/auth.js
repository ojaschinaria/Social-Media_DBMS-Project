const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, bio, profile_pic_url } = req.body;

    // 1. Check if user already exists
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // 2. Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Insert into database
    const newUser = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, bio, profile_pic_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, username, email, full_name, created_at`,
      [username, email, password_hash, full_name, bio, profile_pic_url]
    );

    // 4. Generate JWT
    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error('Error in /register:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Check if password matches
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Check if account is active
    if (!user.rows[0].is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { user_id: user.rows[0].user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.rows[0].user_id,
        username: user.rows[0].username,
        email: user.rows[0].email,
        full_name: user.rows[0].full_name,
      }
    });
  } catch (err) {
    console.error('Error in /login:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
