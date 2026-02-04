/**
 * Referral Logic - API Service for Bubble.io Database
 * Connects to: https://realestatesimplified.xyz/version-test/api/1.1/wf
 */

// ==================== Configuration ====================

const API_CONFIG = {
  baseUrl: 'https://realestatesimplified.xyz/version-test/api/1.1/wf',
};

// ==================== Utility Functions ====================


export const signUp = async (req, res) => {
    try {
        // ensure that no user already exists with the email
        
        const userResponse = await fetch(`${API_CONFIG.baseUrl}/get_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: req.email }),
        });

        const userData = await userResponse.json();
        
        if (userData && userData.email) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate password match
        if (req.password !== req.confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        // Validate email length
        if (req.email.length < 3) {
            return res.status(400).json({ error: 'Email is too short' });
        }

        // Send the request to the database to create the user
        const createResponse = await fetch(`${API_CONFIG.baseUrl}/create_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });

        const result = await createResponse.json();
        
        if (!createResponse.ok) {
            return res.status(createResponse.status).json({ error: result.error || 'Failed to create user' });
        }

        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}


export const login = async (req, res) => {
    try {
        // Call Bubble API for login - bubble handles the authentication logic
        const loginResponse = await fetch(`${API_CONFIG.baseUrl}/log_in`, {
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

        if (!loginResponse.ok) {
            return res.status(loginResponse.status).json({ 
                error: result.error || 'Invalid email or password' 
            });
        }

        // Return the response for logs and frontend use
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Login error occurred' });
    }
}



export const login_with_agent = async (req, res) => {
   
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
}