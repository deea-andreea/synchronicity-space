import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

jest.unstable_mockModule('../models/index.js', () => ({
  Note: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  User: {},
}));

jest.unstable_mockModule('../store/noteStore.js', () => ({
  getAllNotes: () => [],
  getNoteById: () => null,
  addNote: () => {},
  updateNote: () => {},
  deleteNote: () => {},
}));

const { Note } = await import('../models/index.js');
const { noteRouter } = await import('../routers/noteRouter.js');

const app = express();
app.use(express.json());
app.use('/notes', noteRouter);

const validUUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const mockNote  = {
  id:        '550e8400-e29b-41d4-a716-446655440000',
  userId:    validUUID,
  trackId:   'track-1',
  albumId:   'album-1',
  text:      'A nice note about this track',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /notes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    Note.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockNote] });
  });

  it('returns 200 with paginated results', async () => {
    const res = await request(app).get('/notes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('defaults to page=1 and pageSize=10', async () => {
    await request(app).get('/notes');
    const args = Note.findAndCountAll.mock.calls[0][0];
    expect(args.limit).toBe(10);
    expect(args.offset).toBe(0);
  });

  it('respects explicit page and pageSize query params', async () => {
    await request(app).get('/notes?page=2&pageSize=5');
    const args = Note.findAndCountAll.mock.calls[0][0];
    expect(args.limit).toBe(5);
    expect(args.offset).toBe(5);
  });

  it('filters by trackId when provided', async () => {
    await request(app).get('/notes?trackId=track-1');
    const { where } = Note.findAndCountAll.mock.calls[0][0];
    expect(where.trackId).toBe('track-1');
  });

  it('filters by albumId when provided', async () => {
    await request(app).get('/notes?albumId=album-1');
    const { where } = Note.findAndCountAll.mock.calls[0][0];
    expect(where.albumId).toBe('album-1');
  });

  it('filters by userId when provided', async () => {
    await request(app).get(`/notes?userId=${validUUID}`);
    const { where } = Note.findAndCountAll.mock.calls[0][0];
    expect(where.userId).toBe(validUUID);
  });

  it('calculates totalPages correctly', async () => {
    Note.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });
    const res = await request(app).get('/notes?pageSize=10');
    expect(res.body.totalPages).toBe(3);
  });

  it('returns 500 when the database throws', async () => {
    Note.findAndCountAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/notes');
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /notes', () => {

  const validBody = {
    userId:  validUUID,
    trackId: 'track-1',
    albumId: 'album-1',
    text:    'A valid note text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Note.create.mockResolvedValue({ ...mockNote });
    Note.findByPk.mockResolvedValue({ ...mockNote });
  });

  it('returns 201 when the note is created', async () => {
    const res = await request(app).post('/notes').send(validBody);
    expect(res.status).toBe(201);
  });

  it('calls Note.create with the validated payload', async () => {
    await request(app).post('/notes').send(validBody);
    expect(Note.create).toHaveBeenCalledTimes(1);
  });

  it('returns 422 when userId is not a valid UUID', async () => {
    const res = await request(app).post('/notes').send({ ...validBody, userId: 'not-a-uuid' });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 422 when text is missing', async () => {
    const { text, ...rest } = validBody;
    const res = await request(app).post('/notes').send(rest);
    expect(res.status).toBe(422);
  });

  it('returns 422 when text exceeds 100 characters', async () => {
    const res = await request(app).post('/notes').send({ ...validBody, text: 'X'.repeat(101) });
    expect(res.status).toBe(422);
  });

  it('returns 400 when the database throws', async () => {
    Note.create.mockRejectedValue(new Error('SequelizeConstraintError'));
    const res = await request(app).post('/notes').send(validBody);
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /notes/:id', () => {

  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with the note when found', async () => {
    Note.findByPk.mockResolvedValue(mockNote);
    const res = await request(app).get(`/notes/${mockNote.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: mockNote.id });
  });

  it('returns 404 when the note does not exist', async () => {
    Note.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/notes/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('returns 500 when the database throws', async () => {
    Note.findByPk.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get(`/notes/${mockNote.id}`);
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /notes/:id', () => {

  const ownerQuery = `?requesting_user_id=${validUUID}`;

  beforeEach(() => {
    jest.clearAllMocks();
    Note.findByPk.mockResolvedValue({
      ...mockNote,
      update: jest.fn(async function (data) { Object.assign(this, data); return this; }),
    });
  });

  it('updates text and returns 200', async () => {
    const res = await request(app)
      .put(`/notes/${mockNote.id}${ownerQuery}`)
      .send({ text: 'Updated note text here' });
    expect(res.status).toBe(200);
  });

  it('returns 404 when the note does not exist', async () => {
    Note.findByPk.mockResolvedValue(null);
    const res = await request(app)
      .put(`/notes/missing${ownerQuery}`)
      .send({ text: 'some text' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when requesting_user_id does not match the note owner', async () => {
    const res = await request(app)
      .put(`/notes/${mockNote.id}?requesting_user_id=different-user`)
      .send({ text: 'some text' });
    expect(res.status).toBe(403);
  });

  it('returns 422 when text is empty', async () => {
    const res = await request(app)
      .put(`/notes/${mockNote.id}${ownerQuery}`)
      .send({ text: '' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when text exceeds 100 characters', async () => {
    const res = await request(app)
      .put(`/notes/${mockNote.id}${ownerQuery}`)
      .send({ text: 'Z'.repeat(101) });
    expect(res.status).toBe(422);
  });

  it('returns 500 when the database throws', async () => {
    Note.findByPk.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .put(`/notes/${mockNote.id}${ownerQuery}`)
      .send({ text: 'valid text' });
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /notes/:id', () => {

  const ownerQuery = `?requesting_user_id=${validUUID}`;

  beforeEach(() => {
    jest.clearAllMocks();
    Note.findByPk.mockResolvedValue({ ...mockNote, destroy: jest.fn(async () => {}) });
  });

  it('deletes the note and returns 204', async () => {
    const res = await request(app).delete(`/notes/${mockNote.id}${ownerQuery}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when the note does not exist', async () => {
    Note.findByPk.mockResolvedValue(null);
    const res = await request(app).delete(`/notes/nonexistent${ownerQuery}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when requesting_user_id does not match the note owner', async () => {
    const res = await request(app)
      .delete(`/notes/${mockNote.id}?requesting_user_id=wrong-user`);
    expect(res.status).toBe(403);
  });

  it('returns 500 when the database throws', async () => {
    Note.findByPk.mockRejectedValue(new Error('DB fail'));
    const res = await request(app).delete(`/notes/${mockNote.id}${ownerQuery}`);
    expect(res.status).toBe(500);
  });
});