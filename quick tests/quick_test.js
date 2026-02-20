// this is a basic testing script to test out the api connection with bubble 

import { signUp, login, login_with_agent } from './referral_logic.js';

// Simple test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    console.log(' Running Quick Tests...\n');
    
    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log(' ${name}');
            passed++;
        } catch (error) {
            console.log(`${name}`);
            console.log(`   Error: ${error.message}\n`);
            failed++;
        }
    }
    
    console.log(`\n Results: ${passed} passed, ${failed} failed`);
}

// Mock request/response for testing
function mockReq(body) {
    return {
        body,
        email: body.email,
        password: body.password,
        confirm_password: body.confirm_password,
        agentId: body.agentId,
    };
}

function mockRes() {
    return {
        statusCode: null,
        responseData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.responseData = data;
            return this;
        },
    };
}

// Test validation logic
test('signUp: Passwords must match', async () => {
    const req = mockReq({
        email: 'test@example.com',
        password: 'pass123',
        confirm_password: 'pass456',
    });
    const res = mockRes();
    
    await signUp(req, res);
    
    if (res.statusCode !== 400 || res.responseData?.error !== 'Passwords do not match') {
        throw new Error('Should return 400 for mismatched passwords');
    }
});

test('signUp: Email must be at least 3 characters', async () => {
    const req = mockReq({
        email: 'ab',
        password: 'pass123',
        confirm_password: 'pass123',
    });
    const res = mockRes();
    
    await signUp(req, res);
    
    if (res.statusCode !== 400 || res.responseData?.error !== 'Email is too short') {
        throw new Error('Should return 400 for short email');
    }
});

// Run tests
runTests();

