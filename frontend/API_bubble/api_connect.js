/// api_connect.js
/// this is the file where we will handle all the logic for connecting to the bubble api
/// this will also show what endpoints are available and how to use them we can update this as we go along and add more endpoints


// test users referral list 
// curl -X GET "https://realestatesimplified.xyz/version-test/api/1.1/wf/refs?user_id=1702150175837x449701921424581000" -H "Authorization: Bearer 571e360e38f0c11cded79162b849da13" -H "Content-Type: application/json"


// test client id 1712407502153x355984856091353660
// rill

// test agent id 1702150175837x449701921424581000


/// all creates will return a reference id that can be used to update the referral.

const BUBBLE_HEALTH_CHECK_TOKEN = process.env.BUBBLE_HEALTH_CHECK_TOKEN || '';

if (!BUBBLE_HEALTH_CHECK_TOKEN) {
    console.warn('[bubble] Missing BUBBLE_HEALTH_CHECK_TOKEN env var (Authorization will be empty).');
}

function bubble_auth_headers(extra = {}) {
    return {
        'Authorization': `Bearer ${BUBBLE_HEALTH_CHECK_TOKEN}`,
        'Content-Type': 'application/json',
        ...extra,
    };
}

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
    get_branch_refs: {
        endpoint: "get_branch_refs",
        method: "GET",
        description: " Get all referrals that a branch has ",
        parameters: {
            branch_id: "string",
            owner_id: "string"
        }

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
   ,Create_branch: {
        endpoint: '/create_branch',
        method: 'POST',
        description: 'creates a branch on RES',
        parameters: {
            owner_id: "string",
            Branch_name: "string",
            link: "string",

            //optional params
            // primary & secondary colors 
            primary_color: "string",
            secondary_color: "string",

            //logo 
            logo: "image",


            //lists ( agents & referrals)
            agents: "list of users",
            refs: "list of referrals"
        },
    },

    delete_branch: {
        endpoint: '/delete_branch',
        method: 'POST',
        description: 'creates a branch on RES',
        parameters: {
            branch_id: "string"

        }
    },

    modify_branch_agents: {
        endpoint: '/branch_agents',
        method: 'POST',
        description: 'Modify the list of agents in a branch --- set it as a new list or remove/ add one agent ',
        parameters: {
            id: "string",
            agents: "list of Ids ",
            add_or_delete: 0 // add gets a 1 flag delete gets a 0 flag and we'll delete that set from the list 

        }
    },

    modify_branch_referrals: {
        endpoint: '/branch_referrals',
        method: 'POST',
        description: 'Modify the list of agents in a branch --- set it as a new list or remove/ add one referral ',
        parameters: {
            id: "string",
            refs: "list of Ids ",
            add_or_delete: 0 // add gets a 1 flag delete gets a 0 flag and we'll delete that set from the list 

        }
    },

    update_branch: {
        endpoint: '/update_branch',
        method: 'POST',
        description: 'Updates a branch on RES ( mainly for basic informmation )  ',
        parameters: {
            owner_id: "string",
            Branch_name: "string",
            link: "string",

            //optional params
            // primary & secondary colors 
            primary_color: "string",
            secondary_color: "string",

            //logo 
            logo: "image",


            //lists ( agents & referrals)
            agents: "list of users",
            refs: "list of referrals"
        },
    }
    
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

export { get_endpoints, API_CONFIG, BUBBLE_HEALTH_CHECK_TOKEN, bubble_auth_headers };

