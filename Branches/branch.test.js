import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {create_branch, update_branch, delete_branch, modify_branch_agents, modify_branch_referrals} from './branch.js';



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

describe('branch_api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create_branch success', async () => {
    const req = {
      body: {
        owner_id: '12',
        Branch_name: 'test branch',
        link: 'test-link',
        primary_color: '#FFFFFF',
        secondary_color: '#000000',
      },
    };
    const res = mockRes();

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'abc123' }),
    });

    await create_branch(req, res);

    expect(fetch).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
  });

  it('create_branch validation failure', async () => {
    const req = { body: {} };
    const res = mockRes();

    await create_branch(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('update_branch success', async () => {
    const req = {
      body: {
        id: '1',
        primary_color: '#FFFFFF',
        secondary_color: '#000000',
      },
    };
    const res = mockRes();

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ updated: true }),
    });

    await update_branch(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('update_branch missing id', async () => {
    const req = { body: {} };
    const res = mockRes();

    await update_branch(req, res);

    expect(res.statusCode).toBe(400);
  });


  it('delete_branch success', async () => {
    const req = { body: { id: '1' } };
    const res = mockRes();

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ deleted: true }),
    });

    await delete_branch(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('delete_branch missing id', async () => {
    const req = { body: {} };
    const res = mockRes();

    await delete_branch(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('modify_branch_agents success', async () => {
    const req = {
      body: { id: '1', agents: ['a1', 'a2'] },
    };
    const res = mockRes();

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    });

    await modify_branch_agents(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('modify_branch_agents invalid input', async () => {
    const req = { body: { id: '1', agents: 'not-array' } };
    const res = mockRes();

    await modify_branch_agents(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('modify_branch_referrals success', async () => {
    const req = {
      body: { id: '1', refs: ['r1'] },
    };
    const res = mockRes();

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    });

    await modify_branch_referrals(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('modify_branch_referrals invalid input', async () => {
    const req = { body: { id: '1', refs: 'wrong' } };
    const res = mockRes();

    await modify_branch_referrals(req, res);

    expect(res.statusCode).toBe(400);
  });
});

it('handles non-JSON response', async () => {
  const req = {
    body: {
      owner_id: '123',
      Branch_name: 'Test',
      link: 'link',
    },
  };
  const res = mockRes();

  fetch.mockResolvedValue({
    ok: true,
    status: 201,
    headers: { get: () => 'text/plain' },
    text: async () => 'OK',
  });

  await create_branch(req, res);

  expect(res.responseData.success).toBe(true);
});

it('create_branch invalid hex colors', async () => {
  const req = {
    body: {
      owner_id: '123',
      Branch_name: 'Test',
      link: 'link',
      primary_color: 'red',
    },
  };
  const res = mockRes();

  await create_branch(req, res);

  expect(res.statusCode).toBe(400);
});

it('create_branch API failure', async () => {
  const req = {
    body: {
      owner_id: '123',
      Branch_name: 'Test',
      link: 'link',
    },
  };
  const res = mockRes();

  fetch.mockResolvedValue({
    ok: false,
    status: 500,
    headers: { get: () => 'application/json' },
    json: async () => ({ error: 'fail' }),
  });

  await create_branch(req, res);

  expect(res.statusCode).toBe(500);
  expect(res.responseData.success).toBe(false);
});