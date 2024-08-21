// test/authRoutes.test.js
import request from 'supertest';
import app from '../src/server.js'; // Ensure your server exports the Express app

describe('Auth Routes', () => {
  it('should login a user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpassword' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  it('should logout a user', async () => {
    const response = await request(app)
      .delete('/auth/logout/12345')
      .set('Authorization', 'Bearer validtoken');
    expect(response.statusCode).toBe(200);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'newuser', password: 'newpassword', email: 'newuser@example.com' });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('user');
  });
});