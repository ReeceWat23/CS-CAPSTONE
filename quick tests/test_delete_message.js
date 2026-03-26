/**
 * Test script for delete_message function
 * Run with: node test_delete_message.js
 */

import { delete_message } from '../frontend/messages/messages.js';
import { API_CONFIG, BUBBLE_HEALTH_CHECK_TOKEN } from '../frontend/API_bubble/api_connect.js';

const health_check_token = BUBBLE_HEALTH_CHECK_TOKEN;

// Message IDs to test deletion
const messageIds = [
    '1771601496780x414461203273762700',
    '1771601289596x882446650118842100'
];

// Mock request and response objects
const mockReq = (id) => ({
    id: id
});

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

// Run the tests
console.log('Testing delete_message function...');
console.log(`Testing ${messageIds.length} message deletions\n`);

let passed = 0;
let failed = 0;

for (const messageId of messageIds) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing deletion of message: ${messageId}`);
    console.log(`${'='.repeat(60)}`);
    
    // First, verify the message exists before deletion
    try {
        const verifyResponse = await fetch(`${API_CONFIG.baseUrl}/get_message?id=${messageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json',
            },
        });
        
        const verifyData = await verifyResponse.json();
        if (verifyData && verifyData.response && verifyData.response.message) {
            console.log('✓ Message exists before deletion');
            console.log('  Content:', verifyData.response.message.content);
        } else {
            console.log('⚠️  Message not found - may already be deleted');
        }
    } catch (error) {
        console.log('⚠️  Could not verify message existence:', error.message);
    }
    
    // Attempt to delete the message
    const req = mockReq(messageId);
    const res = mockRes();
    
    try {
        await delete_message(req, res);
        
        console.log(`Response Status: ${res.statusCode}`);
        console.log('Response Data:', JSON.stringify(res.responseData, null, 2));
        
        if (res.responseData && res.responseData.success) {
            console.log('✅ Message deleted successfully!');
            passed++;
            
            // Verify deletion by trying to fetch the message again
            console.log('\nVerifying deletion...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const checkResponse = await fetch(`${API_CONFIG.baseUrl}/get_message?id=${messageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${health_check_token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            const checkData = await checkResponse.json();
            if (!checkData || !checkData.response || !checkData.response.message) {
                console.log('✅ Verification: Message no longer exists (deleted successfully)');
            } else {
                console.log('⚠️  Verification: Message still exists (may take time to propagate)');
            }
        } else {
            console.log('❌ Deletion failed');
            failed++;
        }
    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
        console.error('Stack:', error.stack);
        failed++;
    }
    
    // Small delay between deletions
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log('TEST SUMMARY');
console.log(`${'='.repeat(60)}`);
console.log(`Total messages tested: ${messageIds.length}`);
console.log(`✅ Successful deletions: ${passed}`);
console.log(`❌ Failed deletions: ${failed}`);
console.log(`${'='.repeat(60)}\n`);

