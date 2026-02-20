/**
 * Test script for update_message function
 * Run with: node test_update_message.js
 */

import { update_message } from '../frontend/messages/messages.js';
import { API_CONFIG } from '../frontend/API_bubble/api_connect.js';

const health_check_token = "571e360e38f0c11cded79162b849da13";

// Mock request and response objects
const mockReq = {
        _id: '1722972906249x312848900126670850',
        message: 'hola how are you',
        sender_id: '',
        receiver_id: '',
        opened: false,
};

const mockRes = () => {
    const res = {
        statusCode: null,
        responseData: null
    };
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.responseData = data;
        return res;
    };
    return res;
};

// Run the test
console.log('Testing update_message function...');
console.log('Message ID:', mockReq._id);
console.log('Updating message from "hola??" to "hola how are you"\n');

const res = mockRes();

try {
    await update_message(mockReq, res);
    
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', JSON.stringify(res.responseData, null, 2));
    
    if (res.responseData && res.responseData.success) {
        console.log('\n✅ Test passed! Message updated successfully.');
        
        // Verify the update by fetching the message again
        console.log('\nVerifying update...');


        
        const verifyResponse = await fetch(`${API_CONFIG.baseUrl}/get_message?id=${mockReq._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(verifyResponse);
        
        const verifyData = await verifyResponse.json();
        if (verifyData && verifyData.response && verifyData.response.message) {
            console.log('Updated message content:', verifyData.response.message.content);
            if (verifyData.response.message.content === 'hola how are you') {
                console.log('✅ Verification successful! Message content matches expected value.');
            } else {
                console.log('⚠️  Warning: Message content does not match expected value.');
            }
        }
    } else {
        console.log('\n❌ Test failed. Check the response above.');
    }
} catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
}

