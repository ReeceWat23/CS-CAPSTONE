/// api_connect.js
/// this is the file where we will handle all the logic for connecting to the bubble api
/// this will also show what endpoints are available and how to use them we can update this as we go along and add more endpoints


// test users referral list 
// curl -X GET "https://realestatesimplified.xyz/version-test/api/1.1/wf/refs?user_id=1702150175837x449701921424581000" -H "Authorization: Bearer 571e360e38f0c11cded79162b849da13" -H "Content-Type: application/json"


// test client id 1712407502153x355984856091353660
// rill

// test agent id 1702150175837x449701921424581000


/// all creates will return a reference id that can be used to update the referral.

const endpoints = {

    get_user: {
        endpoint: '/get_user',
        method: 'GET',
        description: 'Get a user by their email',
        parameters: {
            email: 'string',
        },
    },
    get_all_users: {
        endpoint: '/get_all_users',
        method: 'GET',
        description: 'Get all users',
        parameters: {
            user_id: 'string',
        },
    },
    create_user: {
        endpoint: '/create_user',
        method: 'POST',
        description: 'Create a new user',
        parameters: {
            email: 'string',
        },
    },
    login: {
        endpoint: '/login',
        method: 'POST',
        description: 'Login a user',
        parameters: {
            email: 'string',
        },
    },
    login_with_agent: {
        endpoint: '/login_with_agent',
        method: 'POST',
        description: 'Login a user with an agent',
        parameters: {
            email: 'string',
        },
    },
    create_referral: {
        endpoint: '/create_referral',
        method: 'POST',
        description: 'Create a new referral',
        parameters: {
            email: 'string',
        },
    },
    update_referral: {
        endpoint: '/update_referral',
        method: 'POST',
        description: 'Update a referral',
        parameters: {
            email: 'string',
        },
    },
    get_referrals: { // based on the user id --- so for testing we can just use a demo one
        endpoint: '/refs',
        method: 'GET',
        description: 'Get all referrals that a agent has',
        parameters: {
            user_id: 'string',
        },
    },
    get_referras: { // get one referral by id
        endpoint: '/get_ref',
        method: 'GET',
        description: 'Get a referral by id',
        parameters: {
            user_id: 'string',
        },
    },
    delete_referral: {
        endpoint: '/delete_referral',
        method: 'DELETE',
        description: 'Delete a referral',
        parameters: {
            email: 'string',
        },
    },
    basic_search: {
        endpoint: '/basic_search',
        method: 'POST',
        description: 'Perfroms a basic search',
        parameters: {
            agent_id: 'string',
            query: 'string',
        },
    },
    guest_search: {
        endpoint: '/basic_search',
        method: 'POST',
        description: 'Perfroms a guest search based on what referrals are public',
        parameters: {
            agent_id: 'string',
            query: 'string',
        },
    },
    fetch_analytics: {
        endpoint: '/fetch_analytics',
        method: 'POST',
        description: 'Gets analytics for a specific referral or all analytics for a user',
        parameters: {
            user_id: 'string',
            ref_id: 'string',
        },
    },
    log_analytics: {
        endpoint: '/log_analytics',
        method: 'POST',
        description: 'Logs analytics for a specific event on the platform, a user doing a search, clicking a referral etc',
        parameters: {
            actor_id: 'string',
            ref_id: 'string',
            ref_ids: 'array',
            info: "String"
        },
    },
    Delete_analytics: {
        endpoint: '/delete_analytics',
        method: 'POST',
        description: 'for deleting a specific event on the platform',
        parameters: {
            id: "string"
        },
    }

    // fetch_analytics
    /*
    get_notification: {
        endpoint: 'notifications',
        method: 'GET',
        description: 'Get the notifications from the client',
        parameters: {
            user_id: 'string',
        },
    },
    */
};


const API_CONFIG = {
    baseUrl: 'https://realestatesimplified.xyz/version-test/api/1.1/wf',
    endpoints: endpoints,
  };

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

