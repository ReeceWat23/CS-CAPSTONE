import { get_endpoints, API_CONFIG } from "./api_connect.js"


/// test cases
describe('API_CONFIG', () => {
        it('should return the correct endpoints', () => {
            expect(get_endpoints()).toEqual(API_CONFIG.endpoints);
        });

        const health_check_token = "571e360e38f0c11cded79162b849da13";

        it('test connectivity to the api', async () => {
            const response = await fetch (API_CONFIG.baseUrl+'/health', { method: 'GET',headers :{
                'Authorization': `Bearer ${health_check_token}`,
                'Content-Type': 'application/json', // Adjust if needed
            }} );
            // console.log(response.json().res);
            expect(response.status).toBe(200);
        });

   
    });
