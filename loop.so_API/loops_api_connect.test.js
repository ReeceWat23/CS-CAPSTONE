/**
 * Jest tests for loop.so_API/loops_api_connect.js
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('loops_api_connect', () => {
  it('get_endpoints returns transactional config', async () => {
    const { get_endpoints } = await import('./loops_api_connect.js');
    const ep = get_endpoints();
    expect(ep.transactional).toMatchObject({
      method: 'POST',
      parameters: expect.objectContaining({
        transactionalId: 'string',
        email: 'string',
        dataVariables: 'object',
      }),
    });
  });

  it('API_CONFIG has baseUrl and headers with Bearer prefix', async () => {
    const { API_CONFIG } = await import('./loops_api_connect.js');
    expect(API_CONFIG.baseUrl).toContain('loops.so');
    expect(API_CONFIG.headers['Content-Type']).toBe('application/json');
    expect(API_CONFIG.headers.Authorization).toMatch(/^Bearer /);
  });
});

describe('loops_api_connect missing LOOPS_API_KEY warning', () => {
  const prevKey = process.env.LOOPS_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.LOOPS_API_KEY;
  });

  afterEach(() => {
    if (prevKey !== undefined) process.env.LOOPS_API_KEY = prevKey;
    else delete process.env.LOOPS_API_KEY;
    jest.resetModules();
  });

  it('logs warning when LOOPS_API_KEY is unset', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await import('./loops_api_connect.js');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('LOOPS_API_KEY'),
    );
    warnSpy.mockRestore();
  });

  it('get_endpoints works on fresh import without key', async () => {
    const { get_endpoints } = await import('./loops_api_connect.js');
    expect(get_endpoints().transactional.endpoint).toBe('');
  });
});
