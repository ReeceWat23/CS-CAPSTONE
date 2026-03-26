import { get_endpoints, API_CONFIG, BUBBLE_HEALTH_CHECK_TOKEN } from "./api_connect.js"


/// test cases
describe('API_CONFIG', () => {
        it('should return the correct endpoints', () => {
            expect(get_endpoints()).toEqual(API_CONFIG.endpoints);
        });

    const health_check_token = BUBBLE_HEALTH_CHECK_TOKEN;

        it('test connectivity to the api', async () => {
            const response = await fetch (API_CONFIG.baseUrl+'/health', { method: 'GET',headers :{
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json', // Adjust if needed
            }} );
            // console.log(response.json().res);
            expect(response.status).toBe(200);
        });

        it('test get request with user_id parameter', async () => {
            const user_id = '1702150175837x449701921424581000';
            const response = await fetch(`${API_CONFIG.baseUrl}/refs?user_id=${user_id}`, { 
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${health_check_token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            expect(response.status).toBe(200);
            const data = await response.json();
            console.log('Response data:', data);
        });

        it('test get all users', async () => {
            const response = await fetch(`${API_CONFIG.baseUrl}/get_all_users`, { 
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${health_check_token}`,
                    'Content-Type': 'application/json',
                }
            });

            expect(response.status).toBe(200);
            // const data = await response.json();
            // console.log('Response data:', data.response.users[0]);
        });

   
    });
