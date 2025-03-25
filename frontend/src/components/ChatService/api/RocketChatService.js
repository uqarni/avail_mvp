export const sendRocketChatMessage = async (message, roomId = 'GENERAL', rocketChatConfig) => {
  try {
    const { rocketChatHost, adminUser, adminPass } = rocketChatConfig;
    
    const loginResponse = await fetch(`${rocketChatHost}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: adminUser,
        password: adminPass
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const { authToken, userId } = loginData.data;
    
    // Now send the message using the token
    const sendMessageResponse = await fetch(`${rocketChatHost}/api/v1/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      body: JSON.stringify({
        channel: roomId,
        text: message
      })
    });
    
    if (!sendMessageResponse.ok) {
      throw new Error(`Failed to send message: ${sendMessageResponse.status}`);
    }
    
    return await sendMessageResponse.json();
  } catch (error) {
    console.error('Error sending Rocket.Chat message:', error);
    return null;
  }
};

export const resetChatSession = async (roomId = 'GENERAL', rocketChatConfig) => {
  let retries = 0;
  const maxRetries = 3;
  const { rocketChatHost, adminUser, adminPass } = rocketChatConfig;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to reset chat session`);
      
      // Check if Rocket.Chat is available first
      const pingResponse = await fetch(`${rocketChatHost}/api/info`, { 
        method: 'GET',
        timeout: 5000 
      }).catch(e => {
        console.warn('Ping failed:', e.message);
        return { ok: false };
      });
      
      if (!pingResponse.ok) {
        throw new Error('Rocket.Chat server is not responding');
      }
      
      // Login to get the auth token
      const loginResponse = await fetch(`${rocketChatHost}/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: adminUser,
          password: adminPass
        }),
        timeout: 5000
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      const { authToken, userId } = loginData.data;
      
      const deleteResult = await deleteAllChannelMessages(roomId, authToken, userId, rocketChatConfig);
      console.log('Delete result:', deleteResult);
      
      return { success: true, cleared: true };
      
    } catch (error) {
      retries++;
      console.error(`Error resetting chat session (attempt ${retries}):`, error);
      
      if (retries >= maxRetries) {
        console.error('Max retries reached, giving up on reset chat session');
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
};

export const deleteAllChannelMessages = async (roomId = 'GENERAL', authToken = null, userId = null, rocketChatConfig) => {
  try {
    const { rocketChatHost, adminUser, adminPass } = rocketChatConfig;
    
    // If auth tokens were not provided, login first
    if (!authToken || !userId) {
      const loginResponse = await fetch(`${rocketChatHost}/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: adminUser,
          password: adminPass
        }),
        timeout: 5000
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      authToken = loginData.data.authToken;
      userId = loginData.data.userId;
    }
    
    let actualRoomId = null;
    
    try {
      const roomInfoResponse = await fetch(`${rocketChatHost}/api/v1/rooms.info?roomName=${roomId}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        },
        timeout: 5000
      });
  
      if (roomInfoResponse.ok) {
        const roomInfo = await roomInfoResponse.json();
        actualRoomId = roomInfo.room._id;
        console.log(`Found room ID by name lookup: ${actualRoomId}`);
      }
    } catch (e) {
      console.warn('Failed to get room by name:', e);
    }
    
    if (!actualRoomId) {
      try {
        actualRoomId = roomId;
        console.log(`Using direct roomId: ${actualRoomId}`);
      } catch (e) {
        console.warn('Failed to use direct room ID:', e);
      }
    }
    
    if (!actualRoomId) {
      try {
        const roomsResponse = await fetch(`${rocketChatHost}/api/v1/rooms.get`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': authToken,
            'X-User-Id': userId
          },
          timeout: 5000
        });
        
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          const room = roomsData.update.find(r => 
            (r.name === roomId || r._id === roomId || r.fname === roomId)
          );
          
          if (room) {
            actualRoomId = room._id;
            console.log(`Found room ID by listing all rooms: ${actualRoomId}`);
          }
        }
      } catch (e) {
        console.warn('Failed to get rooms list:', e);
      }
    }
    
    if (!actualRoomId) {
      console.error(`Could not find room ID for ${roomId}`);
      return { success: false, error: 'Room not found' };
    }
    
    try {
      const deleteResponse = await fetch(`${rocketChatHost}/api/v1/channels.cleanHistory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        },
        body: JSON.stringify({
          roomId: actualRoomId,
          latest: new Date().toISOString(),
          oldest: new Date(0).toISOString(),
          inclusive: true
        }),
        timeout: 10000
      });
      
      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('History clean result:', result);
        return { success: true, result };
      } else {
        const errorData = await deleteResponse.json().catch(() => ({}));
        console.error('Delete response error:', errorData);
        return { success: false, error: errorData };
      }
    } catch (e) {
      console.warn('Failed to clean history:', e);
      return { success: false, error: e.message };
    }
  } catch (error) {
    console.error('Error in deleteAllChannelMessages:', error);
    return { success: false, error: error.message };
  }
}; 