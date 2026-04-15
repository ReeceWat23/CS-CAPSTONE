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

  it('create_branch returns 500 from catch when fetch rejects', async () => {
    fetch.mockRejectedValueOnce(new Error('Bubble unreachable'));
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
    await create_branch(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Bubble unreachable');
  });

  it('create_branch catch uses Internal server error when error has no message', async () => {
    fetch.mockRejectedValueOnce(new Error());
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
    await create_branch(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.message).toBe('Internal server error');
  });

  it('create_branch returns 500 from catch when JSON parse fails on Bubble response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('invalid json');
      },
    });
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
    await create_branch(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('invalid json');
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

  it('update_branch returns 400 when primary_color is not valid hex', async () => {
    const res = mockRes();
    await update_branch({
      body: {
        id: '1',
        primary_color: 'red',
        secondary_color: '#000000',
      },
    }, res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe(
      'primary_color and secondary_color must be HEX like #A1B2C3',
    );
  });

  it('update_branch returns 400 when secondary_color is not valid hex', async () => {
    const res = mockRes();
    await update_branch({
      body: {
        id: '1',
        primary_color: '#FFFFFF',
        secondary_color: '#GGG',
      },
    }, res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe(
      'primary_color and secondary_color must be HEX like #A1B2C3',
    );
  });

  it('update_branch returns 400 when hex is wrong length (short form)', async () => {
    const res = mockRes();
    await update_branch({
      body: {
        id: '1',
        primary_color: '#FFF',
        secondary_color: '#000000',
      },
    }, res);
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

  describe('error paths (Bubble / network failures)', () => {
    const validUpdateBody = {
      id: '1',
      primary_color: '#FFFFFF',
      secondary_color: '#000000',
    };

    it('update_branch returns 500 from catch when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      const res = mockRes();
      await update_branch({ body: validUpdateBody }, res);
      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Network error');
    });

    it('update_branch returns Bubble error when update API responds not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'validation failed' }),
      });
      const res = mockRes();
      await update_branch({ body: validUpdateBody }, res);
      expect(res.statusCode).toBe(422);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Failed to update branch');
      expect(res.responseData.data).toEqual({ error: 'validation failed' });
    });

    it('delete_branch returns Bubble error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'not found' }),
      });
      const res = mockRes();
      await delete_branch({ body: { id: 'branch-1' } }, res);
      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Failed to delete branch');
      expect(res.responseData.data).toEqual({ error: 'not found' });
    });

    it('delete_branch returns 500 from catch when parseJsonOrText throws', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => {
          throw new Error('JSON parse failed');
        },
      });
      const res = mockRes();
      await delete_branch({ body: { id: '1' } }, res);
      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('JSON parse failed');
    });

    it('modify_branch_agents returns Bubble error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: { get: () => 'application/json' },
        json: async () => ({ reason: 'forbidden' }),
      });
      const res = mockRes();
      await modify_branch_agents({ body: { id: '1', agents: ['a1'] } }, res);
      expect(res.statusCode).toBe(403);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Failed to modify branch agents');
    });

    it('modify_branch_agents returns 500 from catch when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Agents update failed'));
      const res = mockRes();
      await modify_branch_agents({ body: { id: '1', agents: [] } }, res);
      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Agents update failed');
    });

    it('modify_branch_referrals returns Bubble error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'conflict' }),
      });
      const res = mockRes();
      await modify_branch_referrals({ body: { id: '1', refs: ['r1'] } }, res);
      expect(res.statusCode).toBe(409);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Failed to modify branch referrals');
    });

    it('modify_branch_referrals returns 500 from catch when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Referrals update failed'));
      const res = mockRes();
      await modify_branch_referrals({ body: { id: '1', refs: ['r1'] } }, res);
      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Referrals update failed');
    });
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