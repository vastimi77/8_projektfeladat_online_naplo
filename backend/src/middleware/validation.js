const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;

const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  // Validate username
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return res.status(400).json({ error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` });
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({ error: `Username must not exceed ${MAX_USERNAME_LENGTH} characters` });
  }

  // Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters` });
  }

  next();
};

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MIN_CONTENT_LENGTH = 1;
const MAX_CONTENT_LENGTH = 10000;

const validateNote = (req, res, next) => {
  const { title, content, category } = req.body;

  // Validate title
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({ error: `Title must not exceed ${MAX_TITLE_LENGTH} characters` });
  }

  // Validate content
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length < MIN_CONTENT_LENGTH) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  if (trimmedContent.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ error: `Content must not exceed ${MAX_CONTENT_LENGTH} characters` });
  }

  // Validate category (optional, but if provided, check validity)
  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: 'Category must be a text string' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateNote
};
