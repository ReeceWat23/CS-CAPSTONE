/**
 * Jest tests for users.js
 * Run with: npm test
 */


//import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { signUp, login, login_with_agent } from './frontend/user_logic/users.js';

import { get_endpoints, API_CONFIG } from "./frontend/API_bubble/api_connect.js"


// Mock fetch
global.fetch = jest.fn();

// Helper functions
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
    fetch.mockResolvedValueOnce(mockFetch({})); // User doesn't exist
    const res = mockRes();
    await signUp(mockReq({ email: 'test@test.com', password: 'pass1', confirm_password: 'pass2' }), res);
    //expect(res.responseData.error).toBe('Passwords do not match');
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if email is too short', async () => {
    fetch.mockResolvedValueOnce(mockFetch({})); // User doesn't exist
    const res = mockRes();
    await signUp(mockReq({ email: 'ab', password: 'pass', confirm_password: 'pass' }), res);
    //expect(res.responseData.error).toBe('Email is too short');
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if user already exists', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ email: 'existing@test.com' }));
    const res = mockRes();
    await signUp(mockReq({ email: 'existing@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.error).toBe('User already exists');
  });

  //MARKER======================================================
  it('creates user successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch({})); // User doesn't exist
    fetch.mockResolvedValueOnce(mockFetch({ id: '123', email: 'new@test.com' }, true, 201));
    //console.log(response.email);
    const res = mockRes();
    await signUp(mockReq({ email: 'new@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
  });

  it('handles API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await signUp(mockReq({ email: 'test@test.com', password: 'pass', confirm_password: 'pass' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.error).toBe('Network error');
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
  });

  //////////////////////////////////////////////////
  it('returns 401 for invalid credentials', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ error: 'Invalid credentials' }, false, 401));
    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'wrong' }), res);
    expect(res.statusCode).toBe(401);
    //expect(res.responseData.error).toBe('Invalid credentials');
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'pass' }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe('login_with_agent', () => {
  beforeEach(() => fetch.mockClear());

  it('calls API with agentId', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ success: true }));
    await login_with_agent(mockReq({ email: 'agent@test.com', password: 'pass', agentId: 'agent123' }), mockRes());
    expect(fetch).toHaveBeenCalledWith(
      'https://realestatesimplified.xyz/version-test/api/1.1/wf/log_in_with_agent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'agent@test.com', password: 'pass', agentId: 'agent123' }),
      })
    );
  });
});

/// test cases
describe('API_CONFIG', () => {
    it('should return the correct endpoints', () => {
        expect(get_endpoints()).toEqual(API_CONFIG.endpoints);
    });

    const health_check_token = "571e360e38f0c11cded79162b849da13";

    it('test connectivity to the api', async () => {
        const response = await fetch (API_CONFIG.baseUrl+'/health', { method: 'GET',headers :{
            'Authorization': `Bearer ${health_check_token}`,
            'Content-Type': 'application/json', // Adjust if needed
        }} );
        // console.log(response.json().res);
        expect(response.status).toBe(200);
    });


});


