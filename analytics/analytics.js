// analytics.js
// This file handles logic for creating analytics, deleting analytics and fetching analytics 

/// functions:
/// - create_referral 
/// - delete referral 
/// - get all analytics by ref_id --- helpful for analyzing data on a specific referral 
/// - get referral by user_id --- helpful for analyzing user data



import { API_CONFIG } from '../frontend/API_bubble/api_connect.js';
const health_check_token = "571e360e38f0c11cded79162b849da13";


// this endpoint is fetch_analytics: {
//         endpoint: '/fetch_analytics',
//         method: 'POST',
//         description: 'Gets analytics for a specific referral or all analytics for a user',
//         parameters: {
//             user_id: 'string',
//             ref_id: 'string',
//         },
//     }
//     // 


// for this we should return some summary stats like frequency or intesting data like if they keep intereacting with a speficic referral like a top referral. and we can also do this by type because now all referrals will have a type and subtype there for we can see where there are some patterns there 

// 1st will just implement the top category to be analyzed 
// [ "Moving", "finance & legal", "Home improvement", "life & local fav"] # if it is null then just call it unknown 