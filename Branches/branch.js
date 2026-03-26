/**
 * branch.js
 * Bubble workflow-backed CRUD for Branches.
 */

import { API_CONFIG, bubble_auth_headers } from '../frontend/API_bubble/api_connect.js';



const headers = bubble_auth_headers();

async function parseJsonOrText(resp) {
  const contentType = resp.headers?.get?.('content-type');
  if (contentType && contentType.includes('application/json')) return resp.json();
  return resp.text();
}

function isValidHex(color) {
  if (color == null) return true;
  return /^#([0-9a-fA-F]{6})$/.test(String(color).trim());
}

export const create_branch = async (req, res) => {
  try {
    const body = req.body || req;
    const {
      owner_id,
      Branch_name,
      link,
      primary_color,
      secondary_color,
      logo,
      agents,
      refs,
    } = body || {};

    if (!owner_id || !Branch_name || !link) {
      return res.status(400).json({ success: false, message: 'owner_id, Branch_name, and link are required' });
    }
    if (!isValidHex(primary_color) || !isValidHex(secondary_color)) {
      return res.status(400).json({ success: false, message: 'primary_color and secondary_color must be HEX like #A1B2C3' });
    }

    const payload = {
      owner_id,
      Branch_name,
      link,
      primary_color,
      secondary_color,
      logo,
      agents,
      refs,
    };

    const resp = await fetch(`${API_CONFIG.baseUrl}/create_branch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await parseJsonOrText(resp);
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, message: 'Failed to create branch', data });
    }

    return res.status(201).json({ success: true, message: 'Branch created', data });
  } catch (error) {
    console.error('[branch] create_branch error', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const update_branch = async (req, res) => {
  try {
    const body = req.body || req;
    const {
      id,
      owner_id,
      Branch_name,
      link,
      primary_color,
      secondary_color,
      logo,
      agents,
      refs,
    } = body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }
    if (!isValidHex(primary_color) || !isValidHex(secondary_color)) {
      return res.status(400).json({ success: false, message: 'primary_color and secondary_color must be HEX like #A1B2C3' });
    }

    const payload = {
      id,
      owner_id,
      Branch_name,
      link,
      primary_color,
      secondary_color,
      logo,
      agents,
      refs,
    };

    const resp = await fetch(`${API_CONFIG.baseUrl}/update_branch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await parseJsonOrText(resp);
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, message: 'Failed to update branch', data });
    }

    return res.status(200).json({ success: true, message: 'Branch updated', data });
  } catch (error) {
    console.error('[branch] update_branch error', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const delete_branch = async (req, res) => {
  try {
    const body = req.body || req;
    const { id } = body || {};
    if (!id) return res.status(400).json({ success: false, message: 'id is required' });

    const resp = await fetch(`${API_CONFIG.baseUrl}/delete_branch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id }),
    });

    const data = await parseJsonOrText(resp);
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, message: 'Failed to delete branch', data });
    }

    return res.status(200).json({ success: true, message: 'Branch deleted', data });
  } catch (error) {
    console.error('[branch] delete_branch error', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const modify_branch_agents = async (req, res) => {
  try {
    const body = req.body || req;
    const { id, agents } = body || {};
    if (!id || !Array.isArray(agents)) {
      return res.status(400).json({ success: false, message: 'id and agents (array) are required' });
    }

    const resp = await fetch(`${API_CONFIG.baseUrl}/branch_agents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, agents }),
    });

    const data = await parseJsonOrText(resp);
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, message: 'Failed to modify branch agents', data });
    }
    return res.status(200).json({ success: true, message: 'Branch agents updated', data });
  } catch (error) {
    console.error('[branch] modify_branch_agents error', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const modify_branch_referrals = async (req, res) => {
  try {
    const body = req.body || req;
    const { id, refs } = body || {};
    if (!id || !Array.isArray(refs)) {
      return res.status(400).json({ success: false, message: 'id and refs (array) are required' });
    }

    const resp = await fetch(`${API_CONFIG.baseUrl}/branch_referrals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, refs }),
    });

    const data = await parseJsonOrText(resp);
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, message: 'Failed to modify branch referrals', data });
    }
    return res.status(200).json({ success: true, message: 'Branch referrals updated', data });
  } catch (error) {
    console.error('[branch] modify_branch_referrals error', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

