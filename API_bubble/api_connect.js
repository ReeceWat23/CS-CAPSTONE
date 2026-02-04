/// api_connect.js
/// this is the file where we will handle all the logic for connecting to the bubble api
/// this will also show what endpoints are available and how to use them we can update this as we go along and add more endpoints

const endpoints = {

    get_user: {
        endpoint: '/get_user',
        method: 'GET',
        description: 'Get a user by their email',
        parameters: {
            email: 'string',
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
        method: 'PUT',
        description: 'Update a referral',
        parameters: {
            email: 'string',
        },
    },
    delete_referral: {
        endpoint: '/delete_referral',
        method: 'DELETE',
        description: 'Delete a referral',
        parameters: {
            email: 'string',
        },
    },};


const API_CONFIG = {
    baseUrl: 'https://realestatesimplified.xyz/version-test/api/1.1/wf',
    endpoints: endpoints,
  };

function get_endpoints() {
    return API_CONFIG.endpoints;
}

export { get_endpoints, API_CONFIG};

