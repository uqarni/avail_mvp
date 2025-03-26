let authToken = null;
let userId = null;
let roomCache = {};

export const initRocketChat = async (config) => {
  try {
    const { rocketChatHost, adminUser, adminPass } = config;
    
    const apiHost = rocketChatHost.endsWith('/') 
      ? rocketChatHost.slice(0, -1) 
      : rocketChatHost;
    
    try {
      const loginResult = await xhrRequest({
        url: `${apiHost}/api/v1/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          user: adminUser,
          password: adminPass
        }),
        timeout: 3000
      });
      
      if (!loginResult.success) {
        return false;
      }
      
      try {
        const loginData = JSON.parse(loginResult.data);
        
        if (!loginData.data || !loginData.data.authToken || !loginData.data.userId) {
          return false;
        }
        
        authToken = loginData.data.authToken;
        userId = loginData.data.userId;
        
        return true;
      } catch (parseError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

function xhrRequest({ url, method = 'GET', headers = {}, data = null, timeout = 5000 }) {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.timeout = timeout;
      
      // Silently handle all errors
      const handleError = () => {
        resolve({ success: false, status: xhr.status, data: null });
      };
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, status: xhr.status, data: xhr.responseText });
        } else {
          handleError();
        }
      };
      
      xhr.onerror = handleError;
      xhr.ontimeout = handleError;
      xhr.onabort = handleError;
      
      xhr.open(method, url, true);
      
      // Set headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      // Send request
      xhr.send(data);
    } catch (e) {
      resolve({ success: false, status: 0, data: null });
    }
  });
}

export const getOrCreateChannel = async (channelName, config) => {
  try {
    if (!authToken || !userId) {
      throw new Error('Not authenticated with Rocket.Chat');
    }
    
    // Make sure the host is correctly formatted
    const apiHost = config.rocketChatHost.endsWith('/') 
      ? config.rocketChatHost.slice(0, -1) 
      : config.rocketChatHost;
    
    // Check cache first
    if (roomCache[channelName]) {
      return roomCache[channelName];
    }
    
    // Try to get the channel first
    try {
      const result = await xhrRequest({
        url: `${apiHost}/api/v1/channels.info?roomName=${channelName}`,
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        }
      });
      
      if (result.success) {
        try {
          const channelData = JSON.parse(result.data);
          if (channelData.success && channelData.channel && channelData.channel._id) {
            roomCache[channelName] = channelData.channel._id;
            return channelData.channel._id;
          }
        } catch (e) {
          // JSON parse error - continue to create channel
        }
      }
    } catch (e) {
      // Channel not found, will try to create it
    }
    
    // Create the channel if it doesn't exist
    try {
      const createResult = await xhrRequest({
        url: `${apiHost}/api/v1/channels.create`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        },
        data: JSON.stringify({
          name: channelName
        })
      });
      
      if (createResult.success) {
        try {
          const createData = JSON.parse(createResult.data);
          if (createData.success) {
            roomCache[channelName] = createData.channel._id;
            return createData.channel._id;
          }
        } catch (e) {
          // JSON parse error - continue to retry
        }
      }
      
      // If creation failed, try to find channel again (might already exist)
      const retryResult = await xhrRequest({
        url: `${apiHost}/api/v1/channels.info?roomName=${channelName}`,
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        }
      });
      
      if (retryResult.success) {
        try {
          const channelData = JSON.parse(retryResult.data);
          if (channelData.success && channelData.channel && channelData.channel._id) {
            roomCache[channelName] = channelData.channel._id;
            return channelData.channel._id;
          }
        } catch (e) {
          // JSON parse error - throw error
        }
      }
    } catch (error) {
      // Failed to create or find channel
      throw new Error('Could not create or find channel');
    }
    
    throw new Error('Could not create or find channel');
  } catch (error) {
    throw error;
  }
};

export const sendMessage = async (message, roomId, config) => {
  try {
    if (!authToken || !userId) {
      throw new Error('Not authenticated with Rocket.Chat');
    }
    
    // Make sure the host is correctly formatted
    const apiHost = config.rocketChatHost.endsWith('/') 
      ? config.rocketChatHost.slice(0, -1) 
      : config.rocketChatHost;
    
    const result = await xhrRequest({
      url: `${apiHost}/api/v1/chat.postMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      data: JSON.stringify({
        channel: roomId,
        text: message
      })
    });
    
    if (!result.success) {
      throw new Error('Failed to send message');
    }
    
    try {
      return JSON.parse(result.data);
    } catch (e) {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    throw error;
  }
};

export const subscribeToMessages = (roomId, callback, config) => {
  if (!authToken || !userId) {
    throw new Error('Not authenticated with Rocket.Chat');
  }
  
  // Make sure the host is correctly formatted
  const apiHost = config.rocketChatHost.endsWith('/') 
    ? config.rocketChatHost.slice(0, -1) 
    : config.rocketChatHost;
  
  // Keep track of the latest message timestamp
  let latestTimestamp = new Date().toISOString();
  let intervalId = null;
  let isActive = true;
  
  // Function to fetch new messages
  const fetchMessages = async () => {
    if (!isActive) return;
    
    try {
      const result = await xhrRequest({
        url: `${apiHost}/api/v1/channels.messages?roomId=${roomId}&count=10`,
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        }
      });
      
      if (!result.success) {
        return;
      }
      
      try {
        const data = JSON.parse(result.data);
        
        if (data.success && data.messages && data.messages.length > 0) {
          // Process messages in chronological order
          const messages = data.messages.sort((a, b) => 
            new Date(a.ts).getTime() - new Date(b.ts).getTime()
          );
          
          for (const message of messages) {
            if (new Date(message.ts).toISOString() <= latestTimestamp) {
              continue;
            }
            
            if (message.u && message.u._id === userId) {
              continue;
            }
            
            if (message.t) {
              continue;
            }
            
            latestTimestamp = new Date(message.ts).toISOString();
            
            callback(message);
          }
        }
      } catch (e) {
      }
    } catch (error) {
    }
  };
  
  // Start polling
  intervalId = setInterval(fetchMessages, 2000);
  
  // Return function to stop polling
  return () => {
    isActive = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

export const clearChannelHistory = async (roomId, config) => {
  try {
    if (!authToken || !userId) {
      return false;
    }
    
    // Make sure the host is correctly formatted
    const apiHost = config.rocketChatHost.endsWith('/') 
      ? config.rocketChatHost.slice(0, -1) 
      : config.rocketChatHost;
    
    const result = await xhrRequest({
      url: `${apiHost}/api/v1/channels.cleanHistory`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      data: JSON.stringify({
        roomId,
        latest: new Date().toISOString(),
        oldest: new Date(0).toISOString(),
        inclusive: true
      })
    });
    
    if (!result.success) {
      return false;
    }
    
    try {
      const data = JSON.parse(result.data);
      return data.success;
    } catch (e) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const disconnectRocketChat = async (config) => {
  try {
    if (!authToken || !userId) {
      return;
    }
    
    // Make sure the host is correctly formatted
    const apiHost = config.rocketChatHost.endsWith('/') 
      ? config.rocketChatHost.slice(0, -1) 
      : config.rocketChatHost;
    
    
    // Logout silently
    try {
      await xhrRequest({
        url: `${apiHost}/api/v1/logout`,
        method: 'POST',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        }
      });
    } catch (error) {
      // Ignore errors during logout
    }
    
    authToken = null;
    userId = null;
    roomCache = {};
  } catch (error) {
    authToken = null;
    userId = null;
    roomCache = {};
  }
}; 