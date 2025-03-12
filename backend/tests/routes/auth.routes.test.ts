import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).toHaveProperty('name', 'Test User');
  });

  it('should not register a user with an existing email', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('should login an existing user', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).toHaveProperty('name', 'Test User');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'invalidpassword'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});
