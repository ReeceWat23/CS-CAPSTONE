/**
 * Jest tests for invite/invite.js (sendBranchInvite)
 */

// run| node invite/invite_manual.js ./emails.csv    # uses CSV emails
// 

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendBranchInvite, sendInvite, receviveNotification } from './invite.js';

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

  it('accepts sign-up-link as alias for sign-up-lin in dataVariables', async () => {
    fetch.mockResolvedValueOnce(okJson({ ok: true }, 200));
    const res = mockRes();
    await sendBranchInvite({
      body: {
        transactionalId: 'tx',
        email: 'a@b.com',
        dataVariables: {
          'branch-name': 'B',
          'sign-up-link': 'https://example.com/join',
        },
      },
    }, res);
    expect(res.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"sign-up-lin":"https://example.com/join"'),
      }),
    );
  });

  it('handles missing content-type on success (uses text path)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: () => Promise.resolve('accepted'),
    });
    const res = mockRes();
    await sendBranchInvite({ body: basePayload }, res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.data).toBe('accepted');
  });
});

describe('sendInvite', () => {
  beforeEach(() => fetch.mockReset());

  it('returns Invite Valid when user exists', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ email: 'user@test.com' }),
    });
    const res = mockRes();
    await sendInvite({ email: 'user@test.com' }, res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.message).toBe('Invite Valid');
  });

  it('returns User Not Found when no email in response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    const res = mockRes();
    await sendInvite({ email: 'nope@test.com' }, res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.message).toBe('User Not Found');
  });

  it('returns 500 on network error', async () => {
    fetch.mockRejectedValueOnce(new Error('fail'));
    const res = mockRes();
    await sendInvite({ email: 'a@b.com' }, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

describe('receviveNotification', () => {
  beforeEach(() => fetch.mockReset());

  it('returns 201 on success', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const res = mockRes();
    await receviveNotification({ email: 'a@b.com' }, res);
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Notifications Grabbed');
  });

  it('returns 500 with shouldProceed false on error', async () => {
    fetch.mockRejectedValueOnce(new Error('network'));
    const res = mockRes();
    await receviveNotification({ email: 'a@b.com' }, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.shouldProceed).toBe(false);
    expect(res.responseData.success).toBe(false);
  });
});

