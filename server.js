/**
 * Express API Server
 * Deployable to Render and other hosting platforms
 */

import express from 'express';
import cors from 'cors';
import { signUp, login, login_with_agent } from './user_logic/users.js';
// Import referral functions if they exist
// import { createReferral, getReferrals, updateReferral, deleteReferral } from './referrals/referrals.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Realtor Referral API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/signup': 'Create a new user account',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/login-with-agent': 'Login user with agent',
      },
      // Add more endpoint groups as needed
    }
  });
});

// Authentication Routes
app.post('/api/signup', async (req, res) => {
  // Extract data from request body
  console.log(' Signup request:', req.body);

  const userData = {
    email: req.body.email,
    password: req.body.password,
    confirm_password: req.body.confirm_password,
    agentId: req.body.agentId
  };

  // signUp will send the response, so we just await it
  await signUp(userData, res);
});

app.post('/api/login', async (req, res) => {
  console.log(' Login request:', req.body);
  const loginData = {
    email: req.body.email,
    password: req.body.password,
  };

  // login will send the response
  await login(loginData, res);
});

app.post('/api/login-with-agent', async (req, res) => {
  console.log(' Login with agent request:', req.body);
  const loginData = {
    email: req.body.email,
    password: req.body.password,
    agentId: req.body.agentId,
  };

  // login_with_agent will send the response
  await login_with_agent(loginData, res);
});

// Referral Routes (uncomment when referral functions are ready)
// app.post('/api/referrals', async (req, res) => {
//   await createReferral(req.body, res);
// });

// app.get('/api/referrals', async (req, res) => {
//   await getReferrals(req, res);
// });

// app.put('/api/referrals/:id', async (req, res) => {
//   await updateReferral(req.params.id, req.body, res);
// });

// app.delete('/api/referrals/:id', async (req, res) => {
//   await deleteReferral(req.params.id, res);
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
});

export default app;

