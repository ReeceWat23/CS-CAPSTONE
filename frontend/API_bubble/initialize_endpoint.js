/**
 * initialize_endpoint.js
 *
 * Super basic helper to initialize / sync a Bubble workflow endpoint.
 *
 * Usage:
 *   NODE_OPTIONS=--experimental-vm-modules node frontend/API_bubble/initialize_endpoint.js
 *
 * Then tweak `endpointUrl` and `payload` below as needed.
 */

import { API_CONFIG } from './api_connect.js';

// Hard-coded endpoint URL – change this to the Bubble workflow you want to initialize.
// Example: `${API_CONFIG.baseUrl}/create_analytics/initialize`

// Trigger a request to (click to copy) 
//  https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/log_analytics/initialize
const endpointUrl = " https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/log_analytics/initialize";


 

// Hard-coded payload – change fields as needed per endpoint.
const payload = {
    "actor-ref-id": "1234",
    "ref-id": "1234",
    "privacy-id" : "9999",
    "ref_ids": ["1234", "1234", "1234"],
    "info": "searched for a refferal"

};

const health_check_token = '571e360e38f0c11cded79162b849da13';

async function initializeEndpoint() {
  try {
    console.log('[init] POST', endpointUrl);
    console.log('[init] payload', payload);

    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${health_check_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type');
    let body;
    if (contentType && contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    console.log('[init] status', res.status, res.ok ? '(ok)' : '(error)');
    console.log('[init] response:', body);
  } catch (err) {
    console.error('[init] error initializing endpoint:', err.message);
  }
}

// Only run when executed directly with Node, not when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeEndpoint();
}


// how to run this file
// NODE_OPTIONS=--experimental-vm-modules node frontend/API_bubble/initialize_endpoint.js