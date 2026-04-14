/**
 * Jest tests for basic_search.js
 * Run with: npm run test:search or NODE_OPTIONS=--experimental-vm-modules jest Search/basic_search.test.js
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  search_referrals,
  guest_search,
  branch_search,
  normalize_referrals,
  run_search,
  fetch_agent_referrals,
  fetch_public_referrals,
} from './basic_search.js';

global.fetch = jest.fn();

const mockReferrals = [
  { id: 'ref1', name: "Bob's Plumbing", desc: "Bob is a plumber. Quality work.", agent_score: 5, type: 'Home improvement', requests: 10 },
  { id: 'ref2', name: "Alice's Electrical Services", desc: "Professional electrical services", agent_score: 4, type: 'Home improvement', requests: 5 },
  { id: 'ref3', name: "Mike's HVAC Solutions", desc: "Expert heating, ventilation, air conditioning. Emergency 24/7", agent_score: 5, type: 'Home improvement', requests: 15 },
  { id: 'ref4', name: "Sarah's Roofing & Gutters", desc: "Quality roofing repairs and gutter installation", agent_score: 4, type: 'Home improvement', requests: 8 },
  { id: 'ref5', name: "John's Handyman Services", desc: "General handyman. Quick response times", agent_score: 3, type: 'Home improvement', requests: 20 },
  { id: 'ref6', name: "Elite Plumbing Co", desc: "Premium plumbing. Complex installations", agent_score: 5, type: 'Home improvement', requests: 12 },
  { id: 'ref7', name: "Quick Fix Electrical", desc: "Fast electrical repairs. Same-day service", agent_score: 4, type: 'Home improvement', requests: 18 },
  { id: 'ref8', name: "Green Energy Solar", desc: "Solar panel installation. Renewable energy. Go green", agent_score: 5, type: 'Businesses', requests: 6 },
  { id: 'ref9', name: "Master Carpenter", desc: "Custom carpentry. Kitchen cabinets", agent_score: 4, type: 'Home improvement', requests: 9 },
  { id: 'ref10', name: "Bob's Home Improvement", desc: "Full-service. Small repairs to renovations", agent_score: 4, type: 'Home improvement', requests: 14 },
  { id: 'ref11', name: "Pro Painters Plus", desc: "Interior and exterior painting. Professional finish", agent_score: 3, type: 'life & local fav', requests: 11 },
  { id: 'ref12', name: "Landscape Design Experts", desc: "Landscaping, lawn care, garden design", agent_score: 4, type: 'Moving', requests: 7 },
];

/** Minimal fetch Response mock that matches basic_search.js expectations */
const mockRefsResponse = () => ({
  ok: true,
  status: 200,
  headers: {
    get: () => 'application/json',
  },
  json: () => Promise.resolve({ response: { refs: mockReferrals } }),
});

const mockReq = (body) => ({ body });
const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};

describe('normalize_referrals', () => {
  it('returns empty array for non-array input', () => {
    expect(normalize_referrals(null)).toEqual([]);
    expect(normalize_referrals(undefined)).toEqual([]);
    expect(normalize_referrals({})).toEqual([]);
  });

  it('normalizes Bubble-shaped objects (Name, _id, Agent score, type?)', () => {
    const raw = [{ Name: 'Bob', _id: 'x1', 'Agent score': 5, 'type?': 'plumber', desc: 'Plumbing' }];
    const out = normalize_referrals(raw);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'x1', name: 'Bob', type: 'plumber', agent_score: 5, desc: 'Plumbing' });
  });

  it('accepts already-normalized shape (id, name, desc, type)', () => {
    const raw = [{ id: 'r1', name: 'Alice', desc: 'Desc', type: 'electrician' }];
    const out = normalize_referrals(raw);
    expect(out[0]).toMatchObject({ id: 'r1', name: 'Alice', desc: 'Desc', type: 'electrician' });
  });
});

describe('run_search', () => {
  const refs = [
    { id: '1', name: "Bob's Plumbing", desc: 'Plumber', type: 'plumber', agent_score: 5, requests: 10 },
    { id: '2', name: 'Alice Electric', desc: 'Electrical', type: 'electrician', agent_score: 4, requests: 0 },
  ];

  it('returns empty array for empty query or no matches', () => {
    expect(run_search(refs, '')).toEqual([]);
    expect(run_search(refs, '   ')).toEqual([]);
    expect(run_search(refs, 'nonexistentxyz')).toEqual([]);
  });

  it('returns matches sorted by score descending', () => {
    const matches = run_search(refs, 'plumber');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toHaveProperty('id', '1');
    expect(matches[0]).toHaveProperty('score');
    expect(matches[0]).toHaveProperty('matchFields');
    for (let i = 0; i < matches.length - 1; i++) {
      expect(matches[i].score).toBeGreaterThanOrEqual(matches[i + 1].score);
    }
  });

  it('includes matchFields and result shape', () => {
    const matches = run_search(refs, 'Bob');
    expect(matches[0].matchFields).toContain('name');
    expect(matches[0]).toMatchObject({ name: "Bob's Plumbing", desc: 'Plumber', type: 'plumber' });
  });

  it('applies type filter when provided as string', () => {
    const matches = run_search(refs, 'e', 'electrician');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every(m => m.type === 'electrician')).toBe(true);
  });

  it('applies type filter when provided as array (case-insensitive)', () => {
    const matches = run_search(refs, 'e', [' PLUMBER ', 'electrician']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every(m => ['plumber', 'electrician'].includes(m.type))).toBe(true);
  });

  it('returns empty array when type filter excludes all matches', () => {
    expect(run_search(refs, 'Bob', 'solar')).toEqual([]);
  });
});

describe('search_referrals', () => {
  const agent_id = '1702150175837x449701921424581000';

  beforeEach(() => {
    fetch.mockReset();
    fetch.mockResolvedValue(mockRefsResponse());
  });

  // Validation tests
  describe('Validation', () => {
    it('returns 400 if agent_id is missing', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ query: 'plumber' }), res);
      
      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Agent ID is required');
    });

    it('returns 400 if query is missing', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id }), res);
      
      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Search query is required');
    });

    it('returns 400 if query is empty string', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: '' }), res);
      
      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Search query is required');
    });

    it('returns 400 if query is only whitespace', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: '   ' }), res);
      
      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Search query is required');
    });
  });

  // Performance and query analysis tests
  describe('Search Performance Analysis', () => {
    const testQueries = [
      { query: 'plumber', description: 'Single word - type match' },
      { query: 'Bob', description: 'Single word - name match' },
      { query: 'electrical', description: 'Single word - description match' },
      { query: 'Bob\'s Plumbing', description: 'Exact phrase - name match' },
      { query: 'hvac solutions', description: 'Two words - description match' },
      { query: 'roofing gutters', description: 'Two words - name match' },
      { query: 'premium services', description: 'Two words - description match' },
      { query: 'green energy', description: 'Two words - name and description' },
      { query: 'quick fix', description: 'Two words - name match' },
      { query: 'xyz123nonexistent', description: 'No matches expected' }
    ];

    testQueries.forEach(({ query, description }) => {
      it(`Query: "${query}" - ${description}`, async () => {
        const startTime = performance.now();
        const res = mockRes();
        await search_referrals(mockReq({ agent_id, query }), res);
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Verify successful response
        expect(res.statusCode).toBe(200);
        expect(res.responseData.success).toBe(true);
        expect(res.responseData.query).toBe(query);
        expect(res.responseData.agent_id).toBe(agent_id);
        expect(Array.isArray(res.responseData.results)).toBe(true);
        expect(Array.isArray(res.responseData.referral_ids)).toBe(true);
        expect(res.responseData.total_matches).toBe(res.responseData.results.length);

        // Performance Analysis Output
        // console.log('\n' + '='.repeat(80));
        // console.log(`QUERY: "${query}"`);
        // console.log(`DESCRIPTION: ${description}`);
        // console.log('-'.repeat(80));
        // console.log(`EXECUTION TIME: ${executionTime.toFixed(2)}ms`);
        // console.log(`TOTAL MATCHES: ${res.responseData.total_matches}`);
        // console.log(`RESULTS RETURNED: ${res.responseData.results.length}`);
        // console.log('-'.repeat(80));

        if (res.responseData.results.length > 0) {
          //console.log('TOP RESULTS:');
          res.responseData.results.slice(0, 5).forEach((result, index) => {
            // console.log(`  ${index + 1}. ${result.name}`);
            // console.log(`     Score: ${result.score.toFixed(2)}`);
            // console.log(`     Match Fields: ${result.matchFields.join(', ')}`);
            // console.log(`     Type: ${result.type || 'N/A'}`);
            // console.log(`     Agent Score: ${result.agent_score || 'N/A'}`);
            // console.log(`     Pricing: ${result.pricing_details || 'N/A'}`);
            // console.log('');
          });

          // Performance metrics
          const avgScore = res.responseData.results.reduce((sum, r) => sum + r.score, 0) / res.responseData.results.length;
          const maxScore = Math.max(...res.responseData.results.map(r => r.score));
          const minScore = Math.min(...res.responseData.results.map(r => r.score));
          const scoreDistribution = {
            high: res.responseData.results.filter(r => r.score >= 10).length,
            medium: res.responseData.results.filter(r => r.score >= 5 && r.score < 10).length,
            low: res.responseData.results.filter(r => r.score < 5).length
          };

          // console.log('PERFORMANCE METRICS:');
          // console.log(`  Average Score: ${avgScore.toFixed(2)}`);
          // console.log(`  Max Score: ${maxScore.toFixed(2)}`);
          // console.log(`  Min Score: ${minScore.toFixed(2)}`);
          // console.log(`  Score Distribution:`);
          // console.log(`    High (≥10): ${scoreDistribution.high}`);
          // console.log(`    Medium (5-9): ${scoreDistribution.medium}`);
          // console.log(`    Low (<5): ${scoreDistribution.low}`);

          // Match field analysis
          const fieldFrequency = {};
          res.responseData.results.forEach(result => {
            result.matchFields.forEach(field => {
              fieldFrequency[field] = (fieldFrequency[field] || 0) + 1;
            });
          });
          //console.log(`  Match Field Frequency:`, fieldFrequency);
        } else {
          //console.log('NO RESULTS FOUND');
        }

        //console.log('='.repeat(80) + '\n');

        // Assertions
        expect(res.responseData.results.length).toBeGreaterThanOrEqual(0);
        if (res.responseData.results.length > 0) {
          // Results should be sorted by score (descending)
          for (let i = 0; i < res.responseData.results.length - 1; i++) {
            expect(res.responseData.results[i].score).toBeGreaterThanOrEqual(
              res.responseData.results[i + 1].score
            );
          }

          //console.log(res.responseData.results);

          // Each result should have required fields
          res.responseData.results.forEach(result => {
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('matchFields');
            expect(Array.isArray(result.matchFields)).toBe(true);
            expect(result.score).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  // Specific search scenarios
  describe('Search Scenarios', () => {
    it('finds exact name matches with high score', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: "Bob's Plumbing" }), res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.results.length).toBeGreaterThan(0);
      
      // Should find Bob's Plumbing with high score
      const bobsPlumbing = res.responseData.results.find(r => r.name.includes("Bob's Plumbing"));
      expect(bobsPlumbing).toBeDefined();
      expect(bobsPlumbing.score).toBeGreaterThanOrEqual(10); // Exact phrase match
    });

    it('finds multiple matches for common terms', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'plumber' }), res);

      expect(res.statusCode).toBe(200);
      // Should find multiple plumber-related results
      const plumberResults = res.responseData.results.filter(r => 
        r.type === 'plumber' || r.name.toLowerCase().includes('plumb') || 
        r.desc.toLowerCase().includes('plumb')
      );
      expect(plumberResults.length).toBeGreaterThan(0);
    });

    it('handles case-insensitive searches', async () => {
      const res1 = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'BOB' }), res1);

      const res2 = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'bob' }), res2);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      // Should return same results regardless of case
      expect(res1.responseData.total_matches).toBe(res2.responseData.total_matches);
    });

    it('returns empty results for non-matching queries', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'nonexistentxyz123' }), res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.total_matches).toBe(0);
      expect(res.responseData.results).toEqual([]);
      expect(res.responseData.referral_ids).toEqual([]);
    });

    it('includes all required fields in response', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'plumber' }), res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData).toHaveProperty('success');
      expect(res.responseData).toHaveProperty('query');
      expect(res.responseData).toHaveProperty('agent_id');
      expect(res.responseData).toHaveProperty('total_matches');
      expect(res.responseData).toHaveProperty('results');
      expect(res.responseData).toHaveProperty('referral_ids');
    });

    it('filters by type_filter for private search', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'services', type_filter: 'home improvement' }), res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.type_filter).toBe('Home improvement');
      expect(res.responseData.results.length).toBeGreaterThan(0);
      expect(res.responseData.results.every(r => r.type === 'Home improvement')).toBe(true);
    });

    it('supports type alias when request uses type', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'solar', type: 'businesses' }), res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.type_filter).toBe('Businesses');
      expect(res.responseData.results.every(r => r.type === 'Businesses')).toBe(true);
    });

    it('returns 400 for invalid type_filter values', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'services', type_filter: 'electrician' }), res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toContain('Invalid type filter');
    });
  });

  // Error handling
  describe('Error Handling', () => {
    it('handles errors gracefully', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: 'test' }), res);
      expect(res.statusCode).toBeDefined();
    });

    it('returns 500 from search_referrals catch block for unexpected query shape', async () => {
      const res = mockRes();
      await search_referrals(mockReq({ agent_id, query: {} }), res);
      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
    });
  });
});

describe('guest_search', () => {
  const agent_id = '1702150175837x449701921424581000';

  beforeEach(() => {
    fetch.mockReset();
    fetch.mockResolvedValue(mockRefsResponse());
  });

  it('returns 400 if query is missing or empty', async () => {
    const res = mockRes();
    await guest_search(mockReq({ agent_id }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toContain('Search query');

    const res2 = mockRes();
    await guest_search(mockReq({ agent_id, query: '   ' }), res2);
    expect(res2.statusCode).toBe(400);
  });

  it('returns 400 if agent_id is missing in guest_search', async () => {
    const res = mockRes();
    await guest_search(mockReq({ query: 'plumber' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe('Agent ID is required');
  });

  it('returns 200 with results from public list', async () => {
    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.query).toBe('plumber');
    expect(Array.isArray(res.responseData.results)).toBe(true);
    expect(res.responseData.total_matches).toBe(res.responseData.results.length);
  });

  it('returns filtered guest results when type_filter is provided', async () => {
    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'services', type_filter: 'home improvement' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.type_filter).toBe('Home improvement');
    expect(res.responseData.results.every(r => r.type === 'Home improvement')).toBe(true);
  });

  it('returns 400 for invalid guest type_filter values', async () => {
    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'services', type_filter: 'electrician' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toContain('Invalid type filter');
  });

  it('returns 503 when public_list fetch fails (network/unreachable)', async () => {
    fetch.mockRejectedValueOnce(new Error('Public list unreachable: socket hang up'));

    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(503);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 502 when public_list throws non-unreachable error', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ error: 'bad things' }),
      })
    );

    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 502 when public_list response is non-JSON', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('<html>Error</html>'),
      })
    );

    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 502 when public_list JSON parse fails', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.reject(new Error('bad json')),
    }));

    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 500 from guest_search catch block for unexpected query shape', async () => {
    const res = mockRes();
    await guest_search(mockReq({ agent_id, query: {} }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

describe('fetch_agent_referrals / fetch_public_referrals', () => {
  it('fetch_agent_referrals returns refs from response.refs', async () => {
    fetch.mockResolvedValue(mockRefsResponse());
    const refs = await fetch_agent_referrals('agent123');
    expect(refs).toEqual(mockReferrals);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/refs?user_id=agent123'),
      expect.any(Object)
    );
  });

  it('fetch_public_referrals returns refs from public_list', async () => {
    fetch.mockResolvedValue(mockRefsResponse());
    const refs = await fetch_public_referrals('agent123');
    expect(refs).toEqual(mockReferrals);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/public_list'),
      expect.any(Object)
    );
  });
});

describe('branch_search', () => {
  const branch_id = 'branch_1';
  const owner_id = 'owner_1';

  beforeEach(() => {
    fetch.mockReset();
    fetch.mockResolvedValue(mockRefsResponse());
  });

  it('returns 400 if query is missing', async () => {
    const res = mockRes();
    await branch_search(mockReq({ branch_id, owner_id }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 400 if branch_id is missing', async () => {
    const res = mockRes();
    await branch_search(mockReq({ owner_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toBe('Branch ID is required');
  });

  it('returns 200 and applies type_filter to branch results', async () => {
    const res = mockRes();
    await branch_search(mockReq({ branch_id, owner_id, query: 'services', type_filter: 'home improvement' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.type_filter).toBe('Home improvement');
    expect(res.responseData.results.length).toBeGreaterThan(0);
    expect(res.responseData.results.every(r => r.type === 'Home improvement')).toBe(true);
  });

  it('returns 400 for invalid branch type_filter values', async () => {
    const res = mockRes();
    await branch_search(mockReq({ branch_id, owner_id, query: 'services', type_filter: 'electrician' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.responseData.message).toContain('Invalid type filter');
  });

  it('returns 503 when branch refs fetch is unreachable', async () => {
    fetch.mockRejectedValueOnce(new Error('branch list unreachable'));
    const res = mockRes();
    await branch_search(mockReq({ branch_id, owner_id, query: 'plumber' }), res);
    expect(res.statusCode).toBe(503);
    expect(res.responseData.success).toBe(false);
  });

  it('returns 500 from branch_search catch block for unexpected query shape', async () => {
    const res = mockRes();
    await branch_search(mockReq({ branch_id, owner_id, query: {} }), res);
    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });
});

