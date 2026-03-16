/**
 * Demo - test search against real API
 * Run with: node Search/demo.js
 */

import { search_referrals, guest_search } from './basic_search.js';

const AGENT_ID = '1702150175837x449701921424581000';
const QUERY = 'Mario bros';

const mockReq = (body) => ({ ...body, body });
const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};

// 1702150175837x449701921424581000
// 1712860519688x490949209623158000
const res = mockRes();
// await search_referrals(mockReq({ agent_id: AGENT_ID, query: QUERY }), res);
await guest_search(mockReq({ agent_id: AGENT_ID, query: QUERY }), res);
console.log('--------------------------------');

console.log(`Query: "${QUERY}" | Agent: ${AGENT_ID}`);
console.log(`Status: ${res.statusCode}`);
console.log(`Matches: ${res.responseData?.total_matches ?? 0}`);
console.log(JSON.stringify(res.responseData, null, 2));
