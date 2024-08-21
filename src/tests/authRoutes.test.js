// src/tests/authRoutes.test.js
import request from 'supertest';
import app from '../server.js'; // Ensure your server exports the Express app

describe('Auth Routes', () => {
  it('should login a user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'chundhau@gmail.com', password: 'Speedgolf1' });
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

  it('should initiate GitHub authentication', async () => {
    const response = await request(app)
      .get('/auth/github');
    expect(response.statusCode).toBe(302); // Assuming it redirects to GitHub
    expect(response.headers.location).toMatch(/github\.com/);
  });

  it('should handle GitHub callback', async () => {
    const response = await request(app)
      .get('/auth/github/callback')
      .query({ code: 'validcode', state: 'validstate' })
      .set('Cookie', ['oauthToken=validstate']);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('user');
  });
});