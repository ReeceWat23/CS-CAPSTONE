import { API_CONFIG } from '../API_bubble/api_connect.js';
// tested and working 



export const sendInvite = async (req, res) => {
    try {
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
            return res.status(201).json({
            success: true,
            message: 'Invite Valid'
            });
        }
        else{
            return res.status(201).json({
            success: true,
            message: 'User Not Found'
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            errors: [error.message || 'Internal server error'],
            message: 'Internal server error'
        });
    }
}

export const receviveNotification = async (req,res) => {
    try{
        const userResponse = await fetch(`${API_CONFIG.baseUrl}/get_notifications`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: req.email }),
        });

        //fix
        return res.status(201).json({
            success: true,
            message: 'Notifications Grabbed'
        });
    }
    catch(error){
        return res.status(500).json({ 
            success: false,
            shouldProceed: false,
            errors: [error.message || 'Internal server error'],
            message: 'Internal server error'
        });
    }

}