const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get } = require('../config/database');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { generateToken } = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/**
 * POST /register
 * Register a new user
 * Body: { username, email, password }
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username.toLowerCase(), email.toLowerCase()]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const result = await run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email.toLowerCase(), hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastID || result.id
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 * Body: { username, password }
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await get(
      'SELECT id, username, email, password FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
