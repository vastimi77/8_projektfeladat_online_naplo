const express = require('express');
const { run, get, all } = require('../config/database');
const { validateNote } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/notes
 * Get all notes for authenticated user
 * Query params: limit, offset, search, category
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, search, category } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedOffset = parseInt(offset, 10) || 0;

    let query = 'SELECT id, title, content, category, created_at, updated_at FROM notes WHERE user_id = ?';
    const params = [userId];

    // Add search filter
    if (search && search.trim()) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add category filter
    if (category && category.trim()) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Add ordering and pagination
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, parsedOffset);

    const notes = await all(query, params);

    res.json({
      data: notes,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        count: notes.length
      }
    });
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * GET /api/notes/:id
 * Get a single note by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ID format
    if (!Number.isInteger(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    const note = await get(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ data: note });
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', validateNote, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.id;

    const result = await run(
      'INSERT INTO notes (user_id, title, content, category, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [userId, title.trim(), content.trim(), category ? category.trim() : null]
    );

    res.status(201).json({
      message: 'Note created successfully',
      data: {
        id: result.lastID || result.id,
        title,
        content,
        category: category || null,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', validateNote, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.id;

    // Validate ID format
    if (!Number.isInteger(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    // Check if note exists and belongs to user
    const note = await get(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const result = await run(
      'UPDATE notes SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [title.trim(), content.trim(), category ? category.trim() : null, id, userId]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    res.json({
      message: 'Note updated successfully',
      data: {
        id,
        title,
        content,
        category: category || null,
        updated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ID format
    if (!Number.isInteger(parseInt(id, 10))) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    // Check if note exists and belongs to user
    const note = await get(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const result = await run(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
