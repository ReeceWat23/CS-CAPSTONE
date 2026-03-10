/**
 * Express API Server
 * Deployable to Render and other hosting platforms
 */

import express from 'express';
import cors from 'cors';
import { signUp, login, login_with_agent } from './frontend/user_logic/users.js';
import { search_referrals } from './Search/basic_search.js';
import { create_message, update_message, delete_message } from './frontend/messages/messages.js';
import { get_all_referrals, create_referral, update_referral, delete_referral } from './referrals/referrals.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Root
app.get('/', (req, res) => {
  res.type('json').json({ ok: true, message: 'Realtor Referral API', docs: 'GET /api' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.type('json').json({ status: 'ok', message: 'API is running' });
});

// API info
app.get('/api', (req, res) => {
  res.type('json').json({
    message: 'Realtor Referral API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/signup': 'Create a new user account',
        'POST /api/login': 'Login user',
        'POST /api/login-with-agent': 'Login user with agent',
      },
      search: { 'POST /api/search': 'Search referrals (body: agent_id, query)' },
      messages: {
        'POST /api/messages': 'Create message',
        'PUT /api/messages/:id': 'Update message',
        'DELETE /api/messages/:id': 'Delete message',
      },
      referrals: {
        'GET /api/referrals?user_id=': 'List referrals',
        'POST /api/referrals': 'Create referral',
        'PUT /api/referrals/:id': 'Update referral',
        'DELETE /api/referrals/:id': 'Delete referral',
      },
    },
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

  await login_with_agent(loginData, res);
});

// Search
app.post('/api/search', async (req, res) => {
  await search_referrals(req, res);
});

// Messages
app.post('/api/messages', async (req, res) => {
  await create_message(req, res);
});
app.put('/api/messages/:id', async (req, res) => {
  await update_message({ ...req.body, _id: req.params.id }, res);
});
app.delete('/api/messages/:id', async (req, res) => {
  await delete_message({ ...req.body, id: req.params.id }, res);
});

// Referrals
app.get('/api/referrals', async (req, res) => {
  await get_all_referrals({ user_id: req.query.user_id }, res);
});
app.post('/api/referrals', async (req, res) => {
  await create_referral(req, res);
});
app.put('/api/referrals/:id', async (req, res) => {
  await update_referral(req, res);
});
app.delete('/api/referrals/:id', async (req, res) => {
  await delete_referral({ ...req.body, id: req.params.id }, res);
});

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

