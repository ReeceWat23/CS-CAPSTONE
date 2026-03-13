/**
 * Jest tests for frontend/user_logic/users.js
 * Run with: npm run test:jest -- frontend/user_logic/users.test.js
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { signUp, login, login_with_agent } from './users.js';

global.fetch = jest.fn();

const mockReq = (body) => ({ ...body, body });
const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};
const mockFetch = (data, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(data) });

describe('signUp', () => {
  beforeEach(() => fetch.mockClear());

  it('returns 400 if passwords do not match', async () => {
    const res = mockRes();
    await signUp(mockReq({ email: 'test@test.com', password: 'pass1', confirm_password: 'pass2' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.errors).toContain('Passwords do not match');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if email is too short', async () => {
    const res = mockRes();
    await signUp(mockReq({ email: 'ab', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.errors).toContain('Email is too short');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if user already exists', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ email: 'existing@test.com' }));
    const res = mockRes();
    await signUp(mockReq({ email: 'existing@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.errors).toContain('User already exists');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('creates user successfully when validations pass', async () => {
    fetch.mockResolvedValueOnce(mockFetch({}));
    fetch.mockResolvedValueOnce(mockFetch({}, true, 201));
    const res = mockRes();
    await signUp(mockReq({ email: 'new@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('User created successfully');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await signUp(mockReq({ email: 'test@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Internal server error');
  });
});

describe('login', () => {
  beforeEach(() => fetch.mockClear());

  it('logs in successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ token: 'abc123', user: { email: 'user@test.com' } }));
    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'pass' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.data).toBeDefined();
  });

  it('returns status code for invalid credentials', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ error: 'Invalid credentials' }, false, 401));
    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'wrong' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'pass' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.error).toBe('Network error');
  });
});

describe('login_with_agent', () => {
  beforeEach(() => fetch.mockClear());

  it('calls API with email, password, agentId', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ success: true }));
    const res = mockRes();
    await login_with_agent(mockReq({ email: 'agent@test.com', password: 'pass', agentId: 'agent123' }), res);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('log_in_with_agent'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'agent@test.com', password: 'pass', agentId: 'agent123' }),
      })
    );
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('returns error when login fails', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ error: 'Login failed' }, false, 401));
    const res = mockRes();
    await login_with_agent(mockReq({ email: 'agent@test.com', password: 'pass', agentId: 'agent123' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.responseData.error).toBe('Login failed');
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await login_with_agent(mockReq({ email: 'a@b.com', password: 'p', agentId: 'id' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.error).toBeDefined();
  });
});
