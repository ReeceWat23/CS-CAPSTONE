// analytics.js
// This file handles logic for creating analytics, deleting analytics and fetching analytics 

/// functions:
/// - create_referral 
/// - delete referral 
/// - get all analytics by ref_id --- helpful for analyzing data on a specific referral 
/// - get referral by user_id --- helpful for analyzing user data



import { API_CONFIG, bubble_auth_headers } from '../frontend/API_bubble/api_connect.js';


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

// const TOP_CATEGORIES = ["Moving", "finance & legal", "Home improvement", "life & local fav", "unknown"];

const headers = bubble_auth_headers();

async function parseBubbleJson(res, label) {
    const contentType = res.headers?.get?.('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`[analytics] ${label} non-JSON response: ${text?.substring(0, 200)}`);
    }
    return res.json();
}



// const summarizeByCategory = (events = []) => {
//     const counts = {};
//     for (const cat of TOP_CATEGORIES) counts[cat] = 0;

//     for (const ev of events) {
//         const rawType = ev.type || ev.category || ev.ref_type || '';
//         const name = (rawType || '').toString().trim();
//         const normalized = TOP_CATEGORIES.includes(name) ? name : (name || 'unknown');
//         counts[normalized] = (counts[normalized] || 0) + 1;
//     }
//     return counts;
// };

export const create_analytics = async (req, res) => {
    try {
        const payload = req.body || req;
        if (!payload || !payload.user_id || !payload.ref_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id and ref_id are required',
            });
        }

        const resp = await fetch(`${API_CONFIG.baseUrl}/log_analytics`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const parsed = await parseBubbleJson(resp, 'create_analytics');
        if (!resp.ok) {
            return res.status(resp.status || 500).json({
                success: false,
                message: parsed?.error || parsed?.data?.error || 'Failed to create analytics',
                data: parsed,
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Analytics event created',
            data: parsed,
        });
    } catch (error) {
        console.error('[analytics] create_analytics error', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};

export const fetch_analytics = async (req, res) => {
    try {
        const { user_id, ref_id } = req.body || req;

        if (!user_id && !ref_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id or ref_id is required',
            });
        }

        const resp = await fetch(`${API_CONFIG.baseUrl}/fetch_analytics`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ user_id, ref_id }),
        });

        const parsed = await parseBubbleJson(resp, 'fetch_analytics');
        if (!resp.ok) {
            return res.status(resp.status || 500).json({
                success: false,
                message: parsed?.error || parsed?.data?.error || 'Failed to fetch analytics',
                data: parsed,
            });
        }

        return res.status(200).json({
            success: true,
            user_id,
            ref_id,
            data: parsed,
        });
    } catch (error) {
        console.error('[analytics] fetch_analytics error', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};

export const delete_analytics = async (req, res) => {
    try {
        const { id } = req.body || req;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analytics id is required',
            });
        }

        const resp = await fetch(`${API_CONFIG.baseUrl}/delete_analytics`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ id }),
        });

        const parsed = await parseBubbleJson(resp, 'delete_analytics');
        const okFlag =
            resp.ok &&
            (parsed?.success === true ||
                parsed?.status === 'success' ||
                parsed?.['status-delete']);

        if (!okFlag) {
            return res.status(resp.status || 400).json({
                success: false,
                message: parsed?.error || parsed?.data?.error || 'Failed to delete analytics',
                data: parsed,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Analytics deleted successfully',
            data: parsed,
        });
    } catch (error) {
        console.error('[analytics] delete_analytics error', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};