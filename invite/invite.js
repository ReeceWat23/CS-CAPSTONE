import { API_CONFIG } from '../loop.so_API/loops_api_connect.js';
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


export const sendBranchInvite = async (req,res) => {
    /// takes in a list of emails that we can then send loops invites to using the API config we have set 
    /// this makes the request on bubble leaner because say we have to do this for 100 employees we want that to be a seamless proces s 

    /// make this accessible via the api but also as a back end script that we can run on a excel or csv file

    // expected body 
    // {
    //     "transactionalId": "cmn638pd102pn0i2aq2ef58z3",
    //     "email": "rwatkins@realestatesimplified.xyz",
    //     "dataVariables": {
    //       "branch-name": "var0",
    //       "sign-up-lin": "var1"
    //     }
    //   }


    // all variables must be present in order to send otherwise send an error
    try{
        const body = req.body || req;
        const { transactionalId, email, dataVariables } = body || {};

        if (!transactionalId || !email || !dataVariables) {
            return res.status(400).json({
                success: false,
                message: 'transactionalId, email, and dataVariables are required',
            });
        }

        const branchName = dataVariables['branch-name'];
        const signUpLink = dataVariables['sign-up-lin'] ?? dataVariables['sign-up-link'];

        if (!branchName || !signUpLink) {
            return res.status(400).json({
                success: false,
                message: 'dataVariables must include branch-name and sign-up-lin',
            });
        }

        const payload = {
            transactionalId,
            email,
            dataVariables: {
                'branch-name': branchName,
                'sign-up-lin': signUpLink,
            },
        };

        const inviteResponse = await fetch(`${API_CONFIG.baseUrl}`, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: JSON.stringify(payload),
        });

        const contentType = inviteResponse.headers?.get?.('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await inviteResponse.json();
        } else {
            result = await inviteResponse.text();
        }

        if (!inviteResponse.ok) {
            return res.status(inviteResponse.status).json({
                success: false,
                message: 'Failed to send branch invite',
                data: result,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Branch invite sent',
            data: result,
        });
    }
    catch(error){
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