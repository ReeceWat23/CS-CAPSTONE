/**
 * Jest tests for analytics CRUD (analytics/analytics.js)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { create_analytics, fetch_analytics, delete_analytics } from './analytics.js';

global.fetch = jest.fn();

const mockReq = (body) => ({ ...body, body });
const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.responseData = data;
    return res;
  };
  return res;
};

const okJson = (data, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(data),
  });

const nonJson = (text, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'text/html' },
    text: () => Promise.resolve(text),
  });

const jsonHeaderMissing = (text, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(text),
  });

describe('create_analytics', () => {
  beforeEach(() => fetch.mockReset());

  it('returns 400 when user_id or ref_id is missing', async () => {
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('creates analytics successfully', async () => {
    fetch.mockResolvedValueOnce(okJson({ response: { id: 'a1' } }, 201));
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1', action: 'view' }), res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
  });

  it('returns provider error from parsed.error on create failure', async () => {
    fetch.mockResolvedValueOnce(okJson({ error: 'bad create request' }, 422));
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(422);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('bad create request');
  });

  it('uses parsed.data.error and 500 fallback when status is missing', async () => {
    fetch.mockResolvedValueOnce(
      Promise.resolve({
        ok: false,
        status: 0,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ data: { error: 'downstream failed' } }),
      })
    );
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('downstream failed');
  });

  it('handles non-JSON response from Bubble', async () => {
    fetch.mockResolvedValueOnce(nonJson('<html>Error</html>', 500));
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });

  it('handles missing content-type header in create_analytics', async () => {
    fetch.mockResolvedValueOnce(jsonHeaderMissing('<html>No content-type</html>', 500));
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.responseData.success).toBe(false);
  });

  it('handles JSON parse error from Bubble', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.reject(new Error('bad json')),
    });
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });

  it('handles network errors in create_analytics', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await create_analytics(mockReq({ user_id: 'u1', ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

describe('fetch_analytics', () => {
  beforeEach(() => fetch.mockReset());

  it('returns 400 when both user_id and ref_id are missing', async () => {
    const res = mockRes();
    await fetch_analytics(mockReq({}), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('fetches analytics successfully', async () => {
    const payload = { response: { analytics: [{ type: 'Moving' }] } };
    fetch.mockResolvedValueOnce(okJson(payload));

    const res = mockRes();
    await fetch_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.data).toEqual(payload);
  });

  it('handles Bubble error responses', async () => {
    fetch.mockResolvedValueOnce(okJson({ error: 'Bad request' }, 400));
    const res = mockRes();
    await fetch_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('uses parsed.data.error for Bubble error responses', async () => {
    fetch.mockResolvedValueOnce(okJson({ data: { error: 'fetch failed in bubble' } }, 409));
    const res = mockRes();
    await fetch_analytics(mockReq({ ref_id: 'r1' }), res);
    expect(res.statusCode).toBe(409);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('fetch failed in bubble');
  });

  it('uses fallback message when Bubble error has no explicit error text', async () => {
    fetch.mockResolvedValueOnce(okJson({}, 400));
    const res = mockRes();
    await fetch_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Failed to fetch analytics');
  });

  it('handles JSON parse error from Bubble in fetch_analytics', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.reject(new Error('bad json')),
    });
    const res = mockRes();
    await fetch_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });

  it('handles network errors in fetch_analytics', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await fetch_analytics(mockReq({ user_id: 'u1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

describe('delete_analytics', () => {
  beforeEach(() => fetch.mockReset());

  it('returns 400 when id is missing', async () => {
    const res = mockRes();
    await delete_analytics(mockReq({}), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('deletes analytics successfully when Bubble returns success flag', async () => {
    fetch.mockResolvedValueOnce(okJson({ success: true }, 200));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('deletes analytics successfully when Bubble returns status=success', async () => {
    fetch.mockResolvedValueOnce(okJson({ status: 'success' }, 200));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('deletes analytics successfully when Bubble returns status-delete flag', async () => {
    fetch.mockResolvedValueOnce(okJson({ 'status-delete': true }, 200));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('returns 400 when delete fails', async () => {
    fetch.mockResolvedValueOnce(okJson({ error: 'delete failed' }, 400));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 400 when Bubble returns non-success JSON even if HTTP ok', async () => {
    fetch.mockResolvedValueOnce(okJson({ success: false, message: 'nope' }, 200));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.responseData.success).toBe(false);
  });

  it('uses parsed.data.error in delete failure response', async () => {
    fetch.mockResolvedValueOnce(okJson({ data: { error: 'cannot delete' } }, 400));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe('cannot delete');
  });

  it('uses default delete failure message when payload has no error fields', async () => {
    fetch.mockResolvedValueOnce(okJson({}, 400));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe('Failed to delete analytics');
  });

  it('handles network errors in delete_analytics', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await delete_analytics(mockReq({ id: 'a1' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

