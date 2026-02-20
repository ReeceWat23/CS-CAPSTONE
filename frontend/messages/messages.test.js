/**
 * Jest tests for messages.js
 * Run with: npm test or npm test messages.test.js
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { create_message, update_message, delete_message } from './messages.js';

// Mock fetch
global.fetch = jest.fn();

// Helper functions
const mockReq = (body, params = {}) => ({ ...body, ...params, body });
const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};

const mockFetch = (data, ok = true, status = 200, contentType = 'application/json') => 
  Promise.resolve({ 
    ok, 
    status, 
    headers: {
      get: (header) => header === 'content-type' ? contentType : null
    },
    json: () => Promise.resolve(data) 
  });

describe('create_message', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('returns 400 if sender_id is missing', async () => {
    const res = mockRes();
    await create_message(mockReq({ 
      receiver_id: 'receiver123',
      message: 'Hello',
      notification_id: 'notif123'
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('not all required fields are present');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if receiver_id is missing', async () => {
    const res = mockRes();
    await create_message(mockReq({ 
      sender_id: 'sender123',
      message: 'Hello',
      notification_id: 'notif123'
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('not all required fields are present');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if message is missing', async () => {
    const res = mockRes();
    await create_message(mockReq({ 
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      notification_id: 'notif123'
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('not all required fields are present');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if notification_id is missing', async () => {
    const res = mockRes();
    await create_message(mockReq({ 
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      message: 'Hello'
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('not all required fields are present');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 if message is empty string', async () => {
    const res = mockRes();
    await create_message(mockReq({ 
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      message: '',
      notification_id: 'notif123'
    }), res);
    
    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('a message cannot be empty');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates message successfully with all required fields', async () => {
    const messageData = {
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      message: 'Hello, how are you?',
      notification_id: 'notif123'
    };

    const mockApiResponse = {
      status: 'success',
      response: {
        id: '1722972906249x312848900126670850',
        ...messageData
      }
    };

    fetch.mockResolvedValueOnce(mockFetch(mockApiResponse, true, 201));

    const res = mockRes();
    await create_message(mockReq(messageData), res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_message',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        }),
        body: JSON.stringify(messageData)
      })
    );
    expect(res.statusCode).toBe(201);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('message created successfully');
  });

  it('returns error when API call fails', async () => {
    const messageData = {
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      message: 'Hello',
      notification_id: 'notif123'
    };

    fetch.mockResolvedValueOnce(mockFetch(
      { error: 'API Error' },
      false,
      500
    ));

    const res = mockRes();
    await create_message(mockReq(messageData), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
  });

  it('handles errors gracefully', async () => {
    const messageData = {
      sender_id: 'sender123',
      receiver_id: 'receiver123',
      message: 'Hello',
      notification_id: 'notif123'
    };

    fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = mockRes();
    await create_message(mockReq(messageData), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Network error');
  });
});

describe('update_message', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const messageId = '1722972906249x312848900126670850';
  
  const mockGetMessageResponse = {
    status: 'success',
    response: {
      message: {
        _id: messageId,
        sender: 'sender123',
        receiver: 'receiver123',
        content: 'hola??',
        date: 1722972906283,
        opened: false
      }
    }
  };

  it('returns 404 if message not found', async () => {
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'error',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ _id: messageId, message: 'New message' }), res);

    expect(res.statusCode).toBe(404);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Message not found');
  });

  it('returns 200 with no changes if message content is the same', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'hola??' // Same as existing
    }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('No changes detected - message data is already up to date');
    expect(fetch).toHaveBeenCalledTimes(1); // Only get_message, no update call
  });

  it('updates message content successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'hola how are you' // Different from existing
    }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    // Check update call
    const updateCall = fetch.mock.calls[1];
    expect(updateCall[0]).toBe('https://realestatesimplified.xyz/version-test/api/1.1/wf/update_message');
    expect(updateCall[1].method).toBe('POST');
    expect(JSON.parse(updateCall[1].body)).toEqual({
      message: 'hola how are you',
      id: messageId
    });

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message updated successfully');
  });

  it('updates opened status successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      opened: true
    }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    const updateCall = fetch.mock.calls[1];
    expect(JSON.parse(updateCall[1].body)).toEqual({
      opened: true,
      id: messageId
    });

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('updates sender_id successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      sender_id: 'newSender123'
    }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    const updateCall = fetch.mock.calls[1];
    expect(JSON.parse(updateCall[1].body)).toEqual({
      sender: 'newSender123',
      id: messageId
    });

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('updates receiver_id successfully', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      receiver_id: 'newReceiver123'
    }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    const updateCall = fetch.mock.calls[1];
    expect(JSON.parse(updateCall[1].body)).toEqual({
      receiver: 'newReceiver123',
      id: messageId
    });

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('updates multiple fields at once', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success',
      response: {}
    }, true, 200));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'Updated message',
      opened: true,
      sender_id: 'newSender123'
    }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    const updateCall = fetch.mock.calls[1];
    const updateBody = JSON.parse(updateCall[1].body);
    expect(updateBody).toMatchObject({
      message: 'Updated message',
      opened: true,
      sender: 'newSender123',
      id: messageId
    });

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
  });

  it('returns 500 when update API returns non-JSON', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch(
      'Not JSON response',
      true,
      200,
      'text/plain'
    ));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'New message'
    }), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Bubble API returned invalid response format');
  });

  it('returns error when update API call fails', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch(
      { error: 'Update failed' },
      false,
      400
    ));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'New message'
    }), res);

    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Failed to update message');
  });

  it('handles errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = mockRes();
    await update_message(mockReq({ 
      _id: messageId, 
      message: 'New message'
    }), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Network error');
  });
});

describe('delete_message', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const messageId = '1771601496780x414461203273762700';

  const mockGetMessageResponse = {
    status: 'success',
    response: {
      message: {
        _id: messageId,
        sender: 'sender123',
        receiver: 'receiver123',
        content: 'Test message',
        date: 1722972906283,
        opened: false
      }
    }
  };

  const mockDeleteResponse = {
    status: 'success',
    response: {
      'status-delete': 'successful deletion'
    }
  };

  it('deletes message successfully with status-delete response', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch(mockDeleteResponse, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(fetch).toHaveBeenCalledTimes(2);
    
    // Check get_message call
    expect(fetch.mock.calls[0][0]).toContain('get_message');
    expect(fetch.mock.calls[0][0]).toContain(`id=${messageId}`);
    
    // Check delete_message call
    expect(fetch.mock.calls[1][0]).toContain('delete_message');
    expect(fetch.mock.calls[1][0]).toContain(`id=${messageId}`);
    expect(fetch.mock.calls[1][1].method).toBe('GET');

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message deleted successfully');
    expect(res.responseData.data).toEqual(mockDeleteResponse);
  });

  it('deletes message successfully with success field response', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      success: true
    }, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message deleted successfully');
  });

  it('deletes message successfully with status success response', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'success'
    }, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message deleted successfully');
  });

  it('deletes message successfully with nested status success response', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      response: {
        status: 'success'
      }
    }, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message deleted successfully');
  });

  it('deletes message successfully with HTTP 200 even if response format is unexpected', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      someUnexpectedFormat: true
    }, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);
    expect(res.responseData.message).toBe('Message deleted successfully');
  });

  it('returns 400 when deletion fails', async () => {
    fetch.mockResolvedValueOnce(mockFetch(mockGetMessageResponse, true, 200));
    fetch.mockResolvedValueOnce(mockFetch({
      error: 'Deletion failed',
      success: false
    }, false, 400));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(400);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Message deletion failed');
  });

  it('handles errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    expect(res.statusCode).toBe(500);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.message).toBe('Network error');
  });

  it('handles case when message does not exist before deletion', async () => {
    fetch.mockResolvedValueOnce(mockFetch({
      status: 'error',
      response: {}
    }, true, 200));

    const res = mockRes();
    await delete_message(mockReq({ id: messageId }), res);

    // Should still attempt deletion even if get_message fails
    // The actual behavior depends on implementation, but we test it doesn't crash
    expect(fetch).toHaveBeenCalled();
  });
});

