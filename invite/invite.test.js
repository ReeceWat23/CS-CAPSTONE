/**
 * Jest tests for invite/invite.js (sendBranchInvite)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendBranchInvite } from './invite.js';

global.fetch = jest.fn();

const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};

const okJson = (data, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json' },
  json: () => Promise.resolve(data),
});

const okText = (text, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'text/plain' },
  text: () => Promise.resolve(text),
});

describe('sendBranchInvite', () => {
  const basePayload = {
    transactionalId: 'tx123',
    email: 'a@b.com',
    dataVariables: {
      'branch-name': 'Branch',
      'sign-up-lin': 'https://x.y/z',
    },
  };

  beforeEach(() => fetch.mockReset());

  it('returns 400 when required fields are missing', async () => {
    const res = mockRes();
    await sendBranchInvite({ body: { email: 'a@b.com' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 400 when dataVariables missing required keys', async () => {
    const res = mockRes();
    await sendBranchInvite({ body: { transactionalId: 't', email: 'a@b.com', dataVariables: {} } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('sends invite successfully (json)', async () => {
    fetch.mockResolvedValueOnce(okJson({ success: true }, 200));
    const res = mockRes();
    await sendBranchInvite({ body: basePayload }, res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('sends invite successfully (text response)', async () => {
    fetch.mockResolvedValueOnce(okText('ok', 200));
    const res = mockRes();
    await sendBranchInvite({ body: basePayload }, res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('returns provider error when response not ok', async () => {
    fetch.mockResolvedValueOnce(okJson({ error: 'bad' }, 401));
    const res = mockRes();
    await sendBranchInvite({ body: basePayload }, res);
    expect(res.statusCode).toBe(401);
    expect(res.responseData.success).toBe(false);
  });

  it('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const res = mockRes();
    await sendBranchInvite({ body: basePayload }, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

