/**
 * Jest tests for referrals.js
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { create_referral } from './referrals.js';

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
  Promise.resolve({ 
    ok, 
    status, 
    headers: {
      get: (header) => header === 'content-type' ? 'application/json' : null
    },
    json: () => Promise.resolve(data) 
  });

describe('create_referral', () => {
  beforeEach(() => fetch.mockClear());

  it('returns 400 if name is missing', async () => {
    const res = mockRes();
    await create_referral(mockReq({ 
      desc: 'Test description', 
      agent_score: 5, 
      agent_id: 'agent123' 
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Name, description and agent score are required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if desc is missing', async () => {
    const res = mockRes();
    await create_referral(mockReq({ 
      name: 'Test Referral', 
      agent_score: 5, 
      agent_id: 'agent123' 
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Name, description and agent score are required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if agent_score is missing', async () => {
    const res = mockRes();
    await create_referral(mockReq({ 
      name: 'Test Referral', 
      desc: 'Test description', 
      agent_id: 'agent123' 
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Name, description and agent score are required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if agent_id is missing', async () => {
    const res = mockRes();
    await create_referral(mockReq({ 
      name: 'Test Referral', 
      desc: 'Test description', 
      agent_score: 5 
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Agent ID is required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates referral successfully with required fields', async () => {
    const referralData = {
      name: "Bob's Plumbing",
      desc: "Bob is a plumber who has been in the business for 10 years",
      agent_score: 5,
      agent_id: 'agent123'
    };

    fetch.mockResolvedValueOnce(mockFetch({ 
      id: 'ref123', 
      ...referralData 
    }, true, 201));

    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Referral created successfully');
    expect(res.responseData.data.id).toBe('ref123');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('creates referral with all optional fields', async () => {
    const referralData = {
      name: "Bob's Plumbing",
      desc: "Bob is a plumber who has been in the business for 10 years",
      agent_score: 5,
      agent_id: 'agent123',
      link: 'https://bobsplumbing.com',
      picture: 'https://example.com/picture.jpg',
      pricing_details: '$$',
      type: 'plumber'
    };

    fetch.mockResolvedValueOnce(mockFetch({ 
      id: 'ref123', 
      ...referralData,
      requests: 0
    }, true, 201));

    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...referralData,
          requests: 0
        }),
      })
    );
  });

  it('calls Bubble API with correct endpoint and data', async () => {
    const referralData = {
      name: "Test Referral",
      desc: "Test description",
      agent_score: 4,
      agent_id: 'agent456'
    };

    fetch.mockResolvedValueOnce(mockFetch({ id: 'ref456' }, true, 201));
    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(fetch).toHaveBeenCalledWith(
      'https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Referral',
          desc: 'Test description',
          agent_score: 4,
          agent_id: 'agent456',
          link: null,
          picture: null,
          pricing_details: null,
          type: null,
          requests: 0
        }),
      })
    );
  });

  it('handles Bubble API errors', async () => {
    const referralData = {
      name: "Test Referral",
      desc: "Test description",
      agent_score: 5,
      agent_id: 'agent123'
    };

    fetch.mockResolvedValueOnce(mockFetch({ 
      error: 'Database error' 
    }, false, 500));

    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Database error');
  });

  it('handles network errors', async () => {
    const referralData = {
      name: "Test Referral",
      desc: "Test description",
      agent_score: 5,
      agent_id: 'agent123'
    };

    fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Network error');
  });

  it('handles non-JSON responses from Bubble API', async () => {
    const referralData = {
      name: "Test Referral",
      desc: "Test description",
      agent_score: 5,
      agent_id: 'agent123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (header) => header === 'content-type' ? 'text/html' : null
      },
      text: () => Promise.resolve('<html>Error</html>')
    });

    const res = mockRes();
    await create_referral(mockReq(referralData), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Bubble API returned invalid response format');
  });
});

