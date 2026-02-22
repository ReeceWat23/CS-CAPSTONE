/**
 * Jest tests for referrals.js
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { get_all_referrals, create_referral, update_referral, delete_referral } from './referrals.js';

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
    ok, status,
    headers: { get: (header) => header === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data)
  });

describe('get_all_referrals', () => {
  beforeEach(() => fetch.mockClear());

  it('calls refs endpoint with user_id', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ response: { referrals: [] } }));
    const res = mockRes();
    await get_all_referrals({ user_id: 'agent123' }, res);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/refs'), expect.any(Object));
  });

  it('handles fetch from req.body', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ referrals: [] }));
    const res = mockRes();
    await get_all_referrals({ body: { user_id: 'x' }, user_id: 'x' }, res);
    expect(fetch).toHaveBeenCalled();
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await get_all_referrals({ user_id: 'x' }, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
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
      'https://realestatesimplified.xyz/version-test/api/1.1/wf/create_referral/initialize',
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
      'https://realestatesimplified.xyz/version-test/api/1.1/wf/create_referral/initialize',
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

describe('update_referral', () => {
  beforeEach(() => fetch.mockClear());

  // Helper to create mock request with params
  const mockReqWithParams = (params, body) => ({
    params: params || {},
    body: body || {},
    id: params?.id || body?.id,
    ...body
  });

  const existingReferral = {
    id: 'ref123',
    name: "Bob's Plumbing",
    desc: "Bob is a plumber who has been in the business for 10 years",
    agent_score: 5,
    agent_id: 'agent123',
    link: 'https://bobsplumbing.com',
    picture: null,
    pricing_details: '$$',
    type: 'plumber',
    requests: 10
  };

  it('returns 404 if referral not found', async () => {
    fetch.mockResolvedValueOnce(mockFetch({}, false, 404));
    
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'nonexistent' }, {
      confirm_name: "Bob's Plumbing",
      name: "Updated Name"
    }), res);

    expect(res.statusCode).toBe(404);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Referral not found');
  });

  it('returns 400 if confirm_name is missing', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      name: "Updated Name"
    }), res);

    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Name does not match confirmation text');
  });

  it('returns 400 if confirm_name does not match existing referral name', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Wrong Name",
      name: "Updated Name"
    }), res);

    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toContain('Name does not match confirmation text');
  });

  it('returns 200 with no changes message when all values are the same', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "Bob's Plumbing",
      desc: "Bob is a plumber who has been in the business for 10 years",
      agent_score: 5
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toContain('No changes detected');
    expect(fetch).toHaveBeenCalledTimes(1); // Only get_ref, no update call
  });

  it('updates referral successfully when fields are changed', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200)); // get_ref
    fetch.mockResolvedValueOnce(mockFetch({ 
      id: 'ref123',
      ...existingReferral,
      name: "Updated Plumbing",
      desc: "Updated description"
    }, true, 200)); // update_ref

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "Updated Plumbing",
      desc: "Updated description"
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Referral updated successfully');
    expect(fetch).toHaveBeenCalledTimes(2); // get_ref and update_ref
  });

  it('only updates fields that are different from existing values', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200)); // get_ref
    fetch.mockResolvedValueOnce(mockFetch({ 
      ...existingReferral,
      name: "Updated Name"
    }, true, 200)); // update_ref

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "Updated Name",
      desc: "Bob is a plumber who has been in the business for 10 years", // Same as existing
      agent_score: 5 // Same as existing
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    
    // Verify only changed fields are sent in update
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/update_ref/ref123'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: "Updated Name",
          id: 'ref123'
        }),
      })
    );
  });

  it('updates agent_score when different', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({ ...existingReferral, agent_score: 4 }, true, 200));
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      agent_score: 4
    }), res);
    expect(res.statusCode).toBe(200);
  });

  it('updates agent_id when different', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({ ...existingReferral, agent_id: 'agent456' }, true, 200));
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      agent_id: 'agent456'
    }), res);
    expect(res.statusCode).toBe(200);
  });

  it('updates link when different', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({ ...existingReferral, link: 'https://new.com' }, true, 200));
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      link: 'https://new.com'
    }), res);
    expect(res.statusCode).toBe(200);
  });

  it('updates picture when different', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({ ...existingReferral, picture: 'pic.jpg' }, true, 200));
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      picture: 'pic.jpg'
    }), res);
    expect(res.statusCode).toBe(200);
  });

  it('updates optional fields when provided and different', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200)); // get_ref
    fetch.mockResolvedValueOnce(mockFetch({ 
      ...existingReferral,
      link: 'https://newlink.com',
      pricing_details: '$$$'
    }, true, 200)); // update_ref

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      link: 'https://newlink.com',
      pricing_details: '$$$'
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    
    // Verify update includes only changed optional fields
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/update_ref/ref123'),
      expect.objectContaining({
        body: JSON.stringify({
          link: 'https://newlink.com',
          pricing_details: '$$$',
          id: 'ref123'
        }),
      })
    );
  });

  it('calls get_ref with correct id parameter', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({}, true, 200));

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "Updated Name"
    }), res);

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/get_ref?id=ref123'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('calls update_ref with correct endpoint and changed data', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({ id: 'ref123' }, true, 200));

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "New Name",
      desc: "New Description"
    }), res);

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/update_ref/ref123'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "New Name",
          desc: "New Description",
          id: 'ref123'
        }),
      })
    );
  });

  it('handles Bubble API update errors', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200)); // get_ref succeeds
    fetch.mockResolvedValueOnce(mockFetch({ 
      error: 'Update failed' 
    }, false, 500)); // update_ref fails

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "Updated Name"
    }), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Update failed');
  });

  it('handles network errors during get_ref', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing"
    }), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Network error');
  });

  it('handles non-JSON responses from update_ref', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce({
      ok: true, status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html>Error</html>')
    });
    const res = mockRes();
    await update_referral(mockReqWithParams({ id: 'ref123' }, {
      confirm_name: "Bob's Plumbing",
      name: "New Name"
    }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.message).toBe('Bubble API returned invalid response format');
  });

  it('handles id from req.params', async () => {
    fetch.mockResolvedValueOnce(mockFetch(existingReferral, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({}, true, 200));
    const req = {
      params: { id: 'ref123' },
      body: { confirm_name: "Bob's Plumbing", name: "Updated Name" }
    };
    const res = mockRes();
    await update_referral(req, res);
    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/get_ref?id=ref123'), expect.anything());
  });
});

describe('delete_referral', () => {
  beforeEach(() => fetch.mockClear());

  const mockDeleteReq = (id, confirm_name) => ({ id, body: { confirm_name } });

  it('returns 400 when confirm_name does not match', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ name: "Bob's Plumbing" }));
    const res = mockRes();
    await delete_referral(mockDeleteReq('ref123', 'Wrong Name'), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toContain('Name does not match');
  });

  it('deletes successfully when confirm_name matches', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ name: "Bob's Plumbing" }));
    fetch.mockResolvedValueOnce(mockFetch({ success: true }));
    const res = mockRes();
    await delete_referral(mockDeleteReq('ref123', "Bob's Plumbing"), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.message).toBe('Referral deleted successfully');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns 400 when delete API fails', async () => {
    fetch.mockResolvedValueOnce(mockFetch({ name: "Bob's Plumbing" }));
    fetch.mockResolvedValueOnce(mockFetch({ success: false }));
    const res = mockRes();
    await delete_referral(mockDeleteReq('ref123', "Bob's Plumbing"), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe('Referral deletion failed');
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await delete_referral(mockDeleteReq('ref123', "Bob's Plumbing"), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

