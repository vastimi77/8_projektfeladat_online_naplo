const express = require('express');
const { run, get, all } = require('../config/database');
const { validateNote } = require('../middleware/validation');

const router = express.Router();

// Get all notes for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const notes = await all(
      'SELECT id, title, content, category, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await get(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create note
router.post('/', validateNote, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.id;

    const result = await run(
      'INSERT INTO notes (user_id, title, content, category) VALUES (?, ?, ?, ?)',
      [userId, title, content, category || null]
    );

    res.status(201).json({
      message: 'Note created successfully',
      id: result.id
    });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', validateNote, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.id;

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
      [title, content, category || null, id, userId]
    );

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    res.json({ message: 'Note updated successfully' });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
