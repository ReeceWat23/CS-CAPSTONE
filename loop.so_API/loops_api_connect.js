/// loops_api_connect.js
/// Loops transactional email API config

const endpoints = {
  transactional: {
    endpoint: '',
    method: 'POST',
    description: 'Send transactional email via Loops',
    parameters: {
      transactionalId: 'string',
      email: 'string',
      dataVariables: 'object',
    },
  },
};

const API_CONFIG = {
  baseUrl: 'https://app.loops.so/api/v1/transactional',
  endpoints,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.LOOPS_API_KEY || ''}`,
  },
};

if (!process.env.LOOPS_API_KEY) {
  console.warn('[loops] Missing LOOPS_API_KEY env var (Authorization will be empty).');
}

function get_endpoints() {
  return API_CONFIG.endpoints;
}

// function test_connection_endpoint ( endpoint, type ) {


//     const response = fetch(API_CONFIG.baseUrl+endpoint, { method: type, headers: {
//         'Authorization': `Bearer ${health_check_token}`,
//         'Content-Type': 'application/json', // Adjust if needed
//     }});
//     return response.json();
// }

export { get_endpoints, API_CONFIG};

