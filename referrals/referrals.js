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

// Trigger a request to (click to copy) 
//  https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize


import { API_CONFIG } from '../frontend/API_bubble/api_connect.js';
const health_check_token = "571e360e38f0c11cded79162b849da13";
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
        const createResponse = await fetch(`${API_CONFIG.baseUrl}/create_referral`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(referralData),
        });

        const contentType = createResponse.headers.get('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await createResponse.json();
        } else {
            const textResponse = await createResponse.text();
            console.error('Bubble API create_referral returned non-JSON:', textResponse?.substring(0, 200));
            return res.status(500).json({
                success: false,
                message: 'Bubble API returned invalid response format'
            });
        }

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

export const update_referral = async (req, res) => {
    try {
        const { id } = req.params || req.id;
        const { name, desc, agent_score, agent_id, link, picture, pricing_details, type, confirm_name } = req.body || req;

        // First, get the existing referral to verify and compare
        const getReferralResponse = await fetch(`${API_CONFIG.baseUrl}/get_ref?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const existingReferral = await getReferralResponse.json();

        // Check if referral exists
        if (!existingReferral || !existingReferral.id) {
            return res.status(404).json({
                success: false,
                message: "Referral not found"
            });
        }

        // Confirmation check - ensure user confirms the update with the referral name
        if (!confirm_name || existingReferral.name !== confirm_name) {
            return res.status(400).json({
                success: false,
                message: "Referral update failed: Name does not match confirmation text"
            });
        }

        // Build update data - only include fields that are provided and different from existing data
        const updateData = {};
        
        // Only add fields that are provided AND different from existing values
        if (name !== undefined && name !== existingReferral.name) {
            updateData.name = name;
        }
        if (desc !== undefined && desc !== existingReferral.desc) {
            updateData.desc = desc;
        }
        if (agent_score !== undefined && agent_score !== existingReferral.agent_score) {
            updateData.agent_score = agent_score;
        }
        if (agent_id !== undefined && agent_id !== existingReferral.agent_id) {
            updateData.agent_id = agent_id;
        }
        if (link !== undefined && link !== existingReferral.link) {
            updateData.link = link;
        }
        if (picture !== undefined && picture !== existingReferral.picture) {
            updateData.picture = picture;
        }
        if (pricing_details !== undefined && pricing_details !== existingReferral.pricing_details) {
            updateData.pricing_details = pricing_details;
        }
        if (type !== undefined && type !== existingReferral.type) {
            updateData.type = type;
        }

        // Check if there are any changes to update
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({
                success: true,
                message: "No changes detected - referral data is already up to date",
                data: existingReferral
            });
        }

        // Add id to update data
        updateData.id = id;

        // Update referral in Bubble database
        const updateResponse = await fetch(`${API_CONFIG.baseUrl}/update_ref/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        const contentType = updateResponse.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
            result = await updateResponse.json();
        } else {
            const textResponse = await updateResponse.text();
            console.error('Bubble API update_referral returned non-JSON:', textResponse.substring(0, 200));
            return res.status(500).json({
                success: false,
                message: 'Bubble API returned invalid response format'
            });
        }

        if (!updateResponse.ok) {
            return res.status(updateResponse.status).json({
                success: false,
                message: result.error || 'Failed to update referral',
                data: result
            });
        }

        // Success - referral updated
        return res.status(200).json({
            success: true,
            message: 'Referral updated successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Error updating referral:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

export const delete_referral = async (req, res) => {

    // all of these requests should not only have a id reference but also a confirmation text from the user 
    try {
        const  id = req.id;

        // find the referral in the data base and confirm the name with the confimration delete text from the user
        const referral = await fetch(`${API_CONFIG.baseUrl}/get_ref?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const referralData = await referral.json();

        if (referralData.name !== req.body.confirm_name) {

            return res.status(400).json({
                success: false,
                message: "Referral deletion failed: Name does not match confirmation text"
            });
        } else {

            const deleteResponse = await fetch(`${API_CONFIG.baseUrl}/delete_ref/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${health_check_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id}),
            });
            const deleteData = await deleteResponse.json();
            if (deleteData.success) {
                return res.status(200).json({
                    success: true,
                    message: "Referral deleted successfully"
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Referral deletion failed"
                });
            }
        }
    } catch (error){
        console.error('Error deleting referral:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}