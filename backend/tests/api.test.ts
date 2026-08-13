import request from 'supertest';
import app from '../src/app.js';

describe('API Route & Access Control Integration Tests', () => {
  describe('Health Endpoint', () => {
    it('should return 200 OK for health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.database).toBe('CONNECTED');
    });
  });

  describe('Validation Error Format', () => {
    it('should return structured field-level error when validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Short Name', // invalid: < 20 chars
          email: 'invalid-email',
          address: '',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toBeDefined();
      expect(res.body.error.fields.name).toBeDefined();
      expect(res.body.error.fields.email).toBeDefined();
      expect(res.body.error.fields.password).toBeDefined();
    });
  });

  describe('Role-based Access Control (RBAC)', () => {
    it('should reject unauthenticated request to /api/admin/dashboard', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated request to /api/owner/dashboard', async () => {
      const res = await request(app).get('/api/owner/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated request to /api/stores', async () => {
      const res = await request(app).get('/api/stores');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject unauthenticated request to DELETE /api/admin/users/:id', async () => {
      const res = await request(app).delete('/api/admin/users/some-user-id');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
