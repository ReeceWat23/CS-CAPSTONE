// referrals.js
// this is the file where we will handle all the logic for refferals

/// functions:
/// - create_referral
/// - update / edit-referral 
/// - delete referral 
/// - get all referrals
/// - get referral by id 

/// - search referrals ( we may be able to do this with bubble's search functionality)

// data structure for reference: 
// id |
// name | "Bobs plumbing"
// desc | "Bob is a plumber who has been in the business for 10 years and is known for his quality work"
// agent_score |
// link |
// picture | bubble can handle this complexity well
// pricing details  | "$" max "$$$$"
// requests | number of requests for the referral
// type | ( hold on this)

import { API_CONFIG } from '../API_bubble/api_connect.js';

export const get_all_referrals = async (req, res) => {

    try {
        const { user_id } = req.body || req;

        const response = await fetch(`${API_CONFIG.baseUrl}/refs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        response.json().then()

    } catch (error) {
        console.error('Error getting all referrals:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

export const create_referral = async (req, res) => {
    try {
        // Extract data from request
        const { name, desc, agent_score, agent_id, link, picture, pricing_details, type } = req.body || req;

        // Validate required fields: name, desc and agent_score are required
        if (!name || !desc || !agent_score) {
            return res.status(400).json({
                success: false,
                message: "Name, description and agent score are required fields to make a referral"
            });
        }

        // Ensure we have an agent_id to link this referral to
        if (!agent_id) {
            return res.status(400).json({
                success: false,
                message: "Agent ID is required to link this referral to an agent"
            });
        }

        // Prepare referral data
        const referralData = {
            name,
            desc,
            agent_score,
            agent_id,
            link: link || null,
            picture: picture || null,
            pricing_details: pricing_details || null,
            type: type || null,
            requests: 0
        };

        // Create referral in Bubble database https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize
        const createResponse = await fetch("https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(referralData),
        });

        // Check content type before parsing
        // const contentType = createResponse.headers.get('content-type');
        // let result;

        // if (contentType && contentType.includes('application/json')) {
        //     result = await createResponse.json();
        // } else {
        //     const textResponse = await createResponse.text();
        //     console.error('Bubble API create_referral returned non-JSON:', textResponse.substring(0, 200));
        //     return res.status(500).json({
        //         success: false,
        //         message: 'Bubble API returned invalid response format'
        //     });
        // }

        if (!createResponse.ok) {
            return res.status(createResponse.status).json({
                success: false,
                message: result.error || 'Failed to create referral',
                data: result
            });
        }

        // Success - referral created
        return res.status(201).json({
            success: true,
            message: 'Referral created successfully',
            data: result
        });

    } catch (error) {
        console.error('Error creating referral:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};