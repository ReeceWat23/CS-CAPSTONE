/**
 * Demo script for basic_search.js
 * Run with: node Search/demo.js
 * 
 * This demonstrates how the search function works with mock data
 */

import { search_referrals } from './basic_search.js';

// Mock request/response objects
const mockReq = (body) => ({
    body: body,
    agent_id: body.agent_id,
    query: body.query
});

const mockRes = () => {
    const res = {
        statusCode: null,
        responseData: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.responseData = data;
            console.log('\n📊 Response:', JSON.stringify(data, null, 2));
            return this;
        }
    };
    return res;
};

// Demo scenarios
async function runDemos() {
    console.log('🔍 Basic Search Demo\n');
    console.log('='.repeat(60));

    // Demo 1: Search for "plumber"
    console.log('\n📝 Demo 1: Search for "plumber"');
    console.log('-'.repeat(60));
    const res1 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'plumber'
    }), res1);
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Found ${res1.responseData?.total_matches || 0} matches`);
    if (res1.responseData?.referral_ids) {
        console.log(`Referral IDs: ${res1.responseData.referral_ids.join(', ')}`);
    }

    // Demo 2: Search for "electrical"
    console.log('\n📝 Demo 2: Search for "electrical"');
    console.log('-'.repeat(60));
    const res2 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'electrical'
    }), res2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Found ${res2.responseData?.total_matches || 0} matches`);

    // Demo 3: Search for "Bob"
    console.log('\n📝 Demo 3: Search for "Bob"');
    console.log('-'.repeat(60));
    const res3 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'Bob'
    }), res3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Found ${res3.responseData?.total_matches || 0} matches`);
    if (res3.responseData?.results) {
        res3.responseData.results.forEach((result, idx) => {
            console.log(`\n  Match ${idx + 1}:`);
            console.log(`    ID: ${result.id}`);
            console.log(`    Name: ${result.name}`);
            console.log(`    Score: ${result.score.toFixed(2)}`);
            console.log(`    Matched in: ${result.matchFields.join(', ')}`);
        });
    }

    // Demo 4: Search for "quality work"
    console.log('\n📝 Demo 4: Search for "quality work" (phrase search)');
    console.log('-'.repeat(60));
    const res4 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'quality work'
    }), res4);
    console.log(`Status: ${res4.statusCode}`);
    console.log(`Found ${res4.responseData?.total_matches || 0} matches`);

    // Demo 4b: Search for "Bob" (should find multiple Bob's)
    console.log('\n📝 Demo 4b: Search for "Bob" (multiple matches)');
    console.log('-'.repeat(60));
    const res4b = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'Bob'
    }), res4b);
    console.log(`Status: ${res4b.statusCode}`);
    console.log(`Found ${res4b.responseData?.total_matches || 0} matches`);
    if (res4b.responseData?.results) {
        res4b.responseData.results.forEach((result, idx) => {
            console.log(`  ${idx + 1}. ${result.name} (Score: ${result.score.toFixed(2)})`);
        });
    }

    // Demo 5: Search for "hvac" or "heating"
    console.log('\n📝 Demo 5: Search for "heating"');
    console.log('-'.repeat(60));
    const res5 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'heating'
    }), res5);
    console.log(`Status: ${res5.statusCode}`);
    console.log(`Found ${res5.responseData?.total_matches || 0} matches`);

    // Demo 6: Search for "contractor" or "renovation"
    console.log('\n📝 Demo 6: Search for "renovation"');
    console.log('-'.repeat(60));
    const res6 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'renovation'
    }), res6);
    console.log(`Status: ${res6.statusCode}`);
    console.log(`Found ${res6.responseData?.total_matches || 0} matches`);

    // Demo 7: Search with no matches
    console.log('\n📝 Demo 7: Search for "dentist" (no matches expected)');
    console.log('-'.repeat(60));
    const res7 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'dentist'
    }), res7);
    console.log(`Status: ${res7.statusCode}`);
    console.log(`Found ${res7.responseData?.total_matches || 0} matches`);

    // Demo 8: Search for "green" or "solar"
    console.log('\n📝 Demo 8: Search for "solar"');
    console.log('-'.repeat(60));
    const res8 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'solar'
    }), res8);
    console.log(`Status: ${res8.statusCode}`);
    console.log(`Found ${res8.responseData?.total_matches || 0} matches`);
    if (res8.responseData?.results) {
        res8.responseData.results.forEach((result, idx) => {
            console.log(`  ${idx + 1}. ${result.name} - ${result.type} (Score: ${result.score.toFixed(2)})`);
        });
    }

    // Demo 9: Missing agent_id (error case)
    console.log('\n📝 Demo 9: Missing agent_id (error case)');
    console.log('-'.repeat(60));
    const res9 = mockRes();
    await search_referrals(mockReq({
        query: 'plumber'
    }), res9);
    console.log(`Status: ${res9.statusCode}`);
    console.log(`Error: ${res9.responseData?.message}`);

    // Demo 10: Missing query (error case)
    console.log('\n📝 Demo 10: Missing query (error case)');
    console.log('-'.repeat(60));
    const res10 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123'
    }), res10);
    console.log(`Status: ${res10.statusCode}`);
    console.log(`Error: ${res10.responseData?.message}`);

    // Demo 11: Show all referral types available
    console.log('\n📝 Demo 11: Summary - All referral types in mock data');
    console.log('-'.repeat(60));
    const res11 = mockRes();
    await search_referrals(mockReq({
        agent_id: 'agent123',
        query: 'a' // Very broad search to get most results
    }), res11);
    if (res11.responseData?.results) {
        const types = [...new Set(res11.responseData.results.map(r => r.type))];
        console.log(`Available types: ${types.join(', ')}`);
        console.log(`Total referrals: ${res11.responseData.total_matches}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo complete!');
}

// Run demos
runDemos().catch(error => {
    console.error('❌ Demo error:', error);
    process.exit(1);
});

