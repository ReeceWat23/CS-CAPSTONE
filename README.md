# Realtor Referral API

A referral search engine API for realtors & their clients.

UI avalaible at https://realestatesimplified.xyz/version-test


### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/signup` - Create a new user account
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "agentId": "optional-agent-id"
  }
  ```

- `POST /api/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/login-with-agent` - Login with agent
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "agentId": "agent123"
  }
  ```

### Health Check

- `GET /health` - Check API status
- `GET /api` - Get API information

## Deployment to Render

1. **Connect your repository** to Render
2. **Create a new Web Service**
3. **Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`
4. **Environment Variables** (set in Render dashboard):
   - `NODE_ENV=production`
   - `PORT=10000` (or let Render assign it)
   - Add any other environment variables you need


## Frontend Integration

```javascript
// Example: Using the API from your frontend
const API_URL = 'https://your-app-name.onrender.com/api';

// Sign up
const signUp = async (email, password, confirmPassword) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirm_password: confirmPassword })
  });
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

## Testing

```bash
# Run Jest tests
npm run test:jest

# Run manual tests
npm test
```

## Project Structure

```
├── server.js              # Main Express server
├── API_bubble/            # Bubble API connection logic
├── user_logic/            # User authentication functions
├── referrals/             # Referral management functions
└── package.json           # Dependencies and scripts
```
