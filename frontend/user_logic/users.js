/**
 * Referral Logic - API Service for Bubble.io Database
 * Connects to: https://realestatesimplified.xyz/version-test/api/1.1/wf
 */


import { API_CONFIG } from '../API_bubble/api_connect.js';
// tested and working 



export const signUp = async (req, res) => {
    try {
        // Collect validation errors
        const errors = [];
        let shouldProceed = true; // Pass/fail flag

        // Validate email length first (quick check)
        if (req.email.length < 3) {
            errors.push('Email is too short');
            shouldProceed = false;
        }

        // Validate password match
        if (req.password !== req.confirm_password) {
            errors.push('Passwords do not match');
            shouldProceed = false;
        }

        // If basic validations fail, return early
        if (!shouldProceed) {
            return res.status(400).json({ 
                success: false,
                shouldProceed: false,
                errors: errors,
                message: 'Validation failed'
            });
        }

        // Check if user already exists
        const userResponse = await fetch(`${API_CONFIG.baseUrl}/get_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: req.email }),
        });

        const userData = await userResponse.json();

        // Check if user exists
        if (userData && userData.email) {
            return res.status(400).json({ 
                success: false,
                shouldProceed: false,
                errors: ['User already exists'],
                message: 'User already exists'
            });
        }

        // All validations passed - proceed to create user
        const createResponse = await fetch(`${API_CONFIG.baseUrl}/create_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req), // Send the request data, not the response object
        });



        // Success - user created
        return res.status(201).json({ 
            success: true,
            shouldProceed: true,
            message: 'User created successfully',
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            shouldProceed: false,
            errors: [error.message || 'Internal server error'],
            message: 'Internal server error'
        });
    }
}


export const login = async (req, res) => {
    try {
        // Call Bubble API for login - bubble handles the authentication logic
        const loginResponse = await fetch(`${API_CONFIG.baseUrl}/log_in`, { // there is no log in workflow yet 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: req.email,
                password: req.password,
            }),
        });

        const result = await loginResponse.json();

        console.log(result);////////////////////
         console.log(req);////////////////////

        if (!loginResponse.ok) {
            console.log(loginResponse.status);////////////////////
            return res.status(loginResponse.status).json({ 
                error: result.error
            });
        }
        else{
            // Return the response for logs and frontend use
            return res.status(200).json({ success: true, data: result });    
        }
        
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Login error occurred' });
    }
}


export const login_with_agent = async (req, res) => {
    try {
        // Login with agent-specific logic
        // to make the log in logic a bit more seamless we can attactch a speacial token to the request --- relating back to the agent 
        const loginResponse = await fetch(`${API_CONFIG.baseUrl}/log_in_with_agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: req.email,
                password: req.password,
                agentId: req.agentId,
            }),
        });

        const result = await loginResponse.json();

        if (!loginResponse.ok) {
            return res.status(loginResponse.status).json({ 
                error: result.error || 'Login with agent failed' 
            });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Login with agent error occurred' });
    }
}