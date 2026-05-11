const request = require('supertest');
const app = require('../src/server');

let authToken;
let userId;
let noteId;

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const testNote = {
  title: 'Test Note',
  content: 'This is a test note content',
  category: 'Testing'
};

describe('Notes API', () => {
  // Register user before tests
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });

    authToken = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/notes - Create Note', () => {
    test('should create a new note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testNote);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Note created successfully');
      expect(response.body.id).toBeDefined();

      noteId = response.body.id;
    });

    test('should fail if title is missing', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Content without title'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .post('/api/notes')
        .send(testNote);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notes - List Notes', () => {
    test('should get all notes for the user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/notes');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notes/:id - Get Single Note', () => {
    test('should get a single note by id', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(noteId);
      expect(response.body.title).toBe(testNote.title);
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/notes/:id - Update Note', () => {
    test('should update a note', async () => {
      const updatedNote = {
        title: 'Updated Test Note',
        content: 'This is updated content',
        category: 'Updated'
      };

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedNote);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note updated successfully');
    });

    test('should fail if content is missing', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title only'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/notes/:id - Delete Note', () => {
    test('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note deleted successfully');
    });

    test('should return 404 when deleting non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
