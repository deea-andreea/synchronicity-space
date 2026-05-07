import { jest } from '@jest/globals';
import request  from 'supertest';
import express  from 'express';

jest.unstable_mockModule('../models/User.js', () => ({
  User: { findAll: jest.fn() },
}));
jest.unstable_mockModule('../store/userStore.js', () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
}));

const { userRouter } = await import('../routers/userRouter.js');
const { User } = await import('../models/User.js');
const { getUserById } =await import('../store/userStore.js');

const app = express();
app.use(express.json());
app.use('/users', userRouter);

const mockUser = {
  id:       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  username: 'testuser',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /users', () => {

  it('returns 200 with an array of users', async () => {
    User.findAll.mockResolvedValue([mockUser]);
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].username).toBe('testuser');
  });

  it('returns empty array when no users exist', async () => {
    User.findAll.mockResolvedValue([]);
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /users/:id', () => {

  it('returns 200 with the user when found in store', async () => {
    getUserById.mockReturnValue(mockUser);
    const res = await request(app).get('/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('returns 404 when user is not found', async () => {
    getUserById.mockReturnValue(null);
    const res = await request(app).get('/users/ghost-user');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/ghost-user/);
  });
});