// referrals.js
// this is the file where we will handle all the logic for messages

/// functions:
/// - create_message
/// - delete message 
/// - get all messages * not doing this for privacy reasons
/// - get message by id * not doing this for privacy reasons


//messages data structure:

// id |
// sender_id |
// receiver_id |
// message |
// notification_id
// timestamp |
// opened |
// deleted |

// Example message data structure:
// const exampleMessage = {
//     "id": 1,
//     "sender_id": 1,
//     "receiver_id": 2,
//     "message": "Hello, how are you?",
//     "notification_id": 1,
//     "timestamp": "2026-02-19 10:00:00",
//     "opened": false,
// }


//  https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_message/initialize


import { API_CONFIG } from '../API_bubble/api_connect.js';
const health_check_token = "571e360e38f0c11cded79162b849da13";
// export const get_all_messages = async (req, res) => {

//     try {
//         const { user_id } = req.body || req;

//         const response = await fetch(`${API_CONFIG.baseUrl}/`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         response.json().then()

//     } catch (error) {
//         console.error('Error getting all referrals:', error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Internal server error"
//         });
//     }


export const create_message = async (req, res) => {
    try {
        // Extract data from request
        const { sender_id, receiver_id, message, notification_id } = req.body || req;

       
        if ( !sender_id || !receiver_id || !message || !notification_id) {
            return res.status(400).json({
                success: false,
                message: "not all required fields are present"
            });
        }

        // Ensure actually have content other wise don't wast 
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "a message cannot be empty"
            });
        }

        // Prepare referral data *Ids are created by bubble
        const referralData = {
            sender_id,
            receiver_id,
            message,
            notification_id
        };

        // Create referral in Bubble database https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize
        const createResponse = await fetch("https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_message", {
            method: 'POST',
            
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${health_check_token}`,
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
                message: result.error || 'Failed to create message',
                data: result
            });
        }

        // Success - referral created
        return res.status(201).json({
            success: true,
            message: 'message created successfully',
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

export const update_message = async (req, res) => {
    try {
        const  id  =  req._id;
        const { sender_id, receiver_id, message, opened } = req;

        console.log("req", req);


        console.log("id", id);
        // First, get the existing message to verify and compare
        const getMessageResponse = await fetch(`${API_CONFIG.baseUrl}/get_message?id=${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log( "seeing if this is getting to this point ", getMessageResponse);

        const responseData = await getMessageResponse.json();
        
        // Handle Bubble API response structure: { status: "success", response: { message: {...} } }
        let existingMessage = null;
        if (responseData && responseData.status === 'success' && responseData.response && responseData.response.message) {
            const msg = responseData.response.message;
            // Normalize the message structure to match our schema
            existingMessage = {
                id: msg._id || msg.id,
                sender_id: msg.sender || msg.sender_id,
                receiver_id: msg.receiver || msg.receiver_id,
                message: msg.content || msg.message,
                notification_id: msg.notification_id,
                timestamp: msg.date || msg.timestamp,
                opened: msg.opened,
                deleted: msg.deleted
            };
        }

        // Check if message exists
        if (!existingMessage || !existingMessage.id) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Build update data - only include fields that are provided and different from existing data
        // Note: Bubble API uses 'content' instead of 'message', 'sender' instead of 'sender_id', etc.
        const updateData = {};
        
        // Only add fields that are provided AND different from existing values
        // Map our schema fields to Bubble API field names
        if (sender_id !== undefined && sender_id !== existingMessage.sender_id) {
            updateData.sender = sender_id; // Bubble uses 'sender' not 'sender_id'
        }
        if (receiver_id !== undefined && receiver_id !== existingMessage.receiver_id) {
            updateData.receiver = receiver_id; // Bubble uses 'receiver' not 'receiver_id'
        }
        if (message !== undefined && message !== existingMessage.message) {
            updateData.message = message; // Bubble uses 'content' not 'message'
        }
        // if (notification_id !== undefined && notification_id !== existingMessage.notification_id) {
        //     updateData.notification_id = notification_id;
        // }
        // if (timestamp !== undefined && timestamp !== existingMessage.timestamp) {
        //     updateData.date = timestamp; // Bubble uses 'date' not 'timestamp'
        // }
        if (opened !== undefined && opened !== existingMessage.opened) {
            updateData.opened = opened;
        }
      

        // Check if there are any changes to update
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({
                success: true,
                message: "No changes detected - message data is already up to date",
                data: existingMessage
            });
        }

        // Add id to update data (Bubble API expects ID in the payload, not URL)
        updateData.id = id;

        // Update message in Bubble database (ID is in payload, not URL)
        const updateResponse = await fetch(`${API_CONFIG.baseUrl}/update_message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
        });

        const contentType = updateResponse.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
            result = await updateResponse.json();
        } else {
            const textResponse = await updateResponse.text();
            console.error('Bubble API update_message returned non-JSON:', textResponse.substring(0, 200));
            return res.status(500).json({
                success: false,
                message: 'Bubble API returned invalid response format'
            });
        }

        if (!updateResponse.ok) {
            return res.status(updateResponse.status).json({
                success: false,
                message: result.error || 'Failed to update message',
                data: result
            });
        }

        // Success - message updated
        return res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Error updating message:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

export const delete_message = async (req, res) => {

    // all of these requests should not only have a id reference but also a confirmation text from the user 
    try {
        const  id = req.id;

        // find the message in the data base and confirm the name with the confimration delete text from the user
        const referral = await fetch(`${API_CONFIG.baseUrl}/get_message?id=${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json'
            },
        });
        const referralData = await referral.json();

        // if (referralData.name !== req.body.confirm_name) {

        //     return res.status(400).json({
        //         success: false,
        //         message: "Referral deletion failed: Name does not match confirmation text"
        //     });
        

            const deleteResponse = await fetch(`${API_CONFIG.baseUrl}/delete_message?id=${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${health_check_token}`,
                    'Content-Type': 'application/json',
                }
            });

            const deleteData = await deleteResponse.json();
            
            // Handle dynamic/unexpected API response formats
            // Check for various success indicators: success field, status-delete, status === 'success', or HTTP 200
            const isSuccess = deleteData.success || 
                              deleteData.status === 'success' ||
                              deleteData['status-delete'] ||
                              (deleteData.response && deleteData.response.status === 'success') ||
                              (deleteResponse.ok && deleteResponse.status === 200);
            
            if (isSuccess) {
                return res.status(200).json({
                    success: true,
                    message: "Message deleted successfully",
                    data: deleteData
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Message deletion failed",
                    data: deleteData
                });
            }
        
    } catch (error){
        console.error('Error deleting message:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}