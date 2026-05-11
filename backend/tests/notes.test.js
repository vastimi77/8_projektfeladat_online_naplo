/**
 * Notes API Integration Tests
 */
const request = require('supertest');
const app = require('../src/server');

let authToken;
let userId;
let noteId;

const testUser = {
  username: 'testuser' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

const testNote = {
  title: 'Test Note',
  content: 'This is a test note content',
  category: 'Testing'
};

describe('Notes API Integration Tests', () => {
  beforeAll(async () => {
    // Register test user
    await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      })
      .expect(200);

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;

    expect(authToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  describe('POST /api/notes - Create Note', () => {
    test('should create a new note with valid data', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testNote);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Note created successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe(testNote.title);

      noteId = response.body.data.id;
    });

    test('should fail if title is empty', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          content: 'Content without title'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should fail if content is empty', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title only',
          content: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .post('/api/notes')
        .send(testNote);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should fail with invalid auth token', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', 'Bearer invalid_token')
        .send(testNote);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notes - List Notes', () => {
    test('should get all notes for authenticated user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get('/api/notes?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(10);
    });

    test('should support search query', async () => {
      const response = await request(app)
        .get('/api/notes?search=Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/notes');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/notes/:id - Get Single Note', () => {
    test('should get a single note by id', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(noteId);
      expect(response.body.data.title).toBe(testNote.title);
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    test('should fail with invalid note id format', async () => {
      const response = await request(app)
        .get('/api/notes/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .get(`/api/notes/${noteId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/notes/:id - Update Note', () => {
    test('should update a note with valid data', async () => {
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
      expect(response.body.data.title).toBe(updatedNote.title);
    });

    test('should fail if title is empty during update', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          content: 'Content without title'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should fail if content is empty during update', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title only',
          content: ''
        });

      expect(response.status).toBe(400);
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .put('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated',
          content: 'Content'
        });

      expect(response.status).toBe(404);
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .send({
          title: 'Updated',
          content: 'Content'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/notes/:id - Delete Note', () => {
    let noteToDelete;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Note to Delete',
          content: 'This will be deleted'
        });

      noteToDelete = response.body.data.id;
    });

    test('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note deleted successfully');
    });

    test('should return 404 when deleting non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    test('should fail with invalid note id format', async () => {
      const response = await request(app)
        .delete('/api/notes/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('should fail without authentication token', async () => {
      const response = await request(app)
        .delete(`/api/notes/${noteId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Cross-User Access Isolation', () => {
    let otherUserToken;
    let otherUserNote;

    beforeAll(async () => {
      const otherUser = {
        username: 'otheruser' + Date.now(),
        email: `other${Date.now()}@example.com`,
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: otherUser.username,
          password: otherUser.password
        });

      otherUserToken = loginRes.body.token;

      const noteRes = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other User Note',
          content: 'This belongs to another user'
        });

      otherUserNote = noteRes.body.data.id;
    });

    test('should not allow user to access other user\'s notes', async () => {
      const response = await request(app)
        .get(`/api/notes/${otherUserNote}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('should not allow user to update other user\'s notes', async () => {
      const response = await request(app)
        .put(`/api/notes/${otherUserNote}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Hacked',
          content: 'Should not work'
        });

      expect(response.status).toBe(404);
    });

    test('should not allow user to delete other user\'s notes', async () => {
      const response = await request(app)
        .delete(`/api/notes/${otherUserNote}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
