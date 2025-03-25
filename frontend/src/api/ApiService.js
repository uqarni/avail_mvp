export const performHealthCheck = async () => {
  try {
    const response = await fetch('http://0.0.0.0:8081/api/health')
    if (!response.ok) {
      console.error("Backend is not healthy");
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} Error: ${errorData.message}`);
    }
    const data = await response.json();
    if(data.message === "Service is healthy"){
      console.log("Backend working");
    }
    return data;
  } catch (error) {
    console.error("Error during health check:", error.message);
    return null;
  }
};

export const callGepeto = async (userMessage) => {
  try {
    console.log(JSON.stringify({ message: userMessage}))
    const response = await fetch(
        'http://0.0.0.0:8081/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userMessage})
        })
    if (!response.ok) {
      console.error("Couldn't call Gepeto")
      const errorData = await response.json()
      throw new Error(`HTTP error! status: ${response.status} Error: ${errorData.message}`);
    }
    return await response.json()
  } catch (error) {
    console.error("Error calling Gepeto:", error.message)
    return null
  }
}

// Function to send messages to Rocket.Chat as admin
export const sendRocketChatMessage = async (message, roomId = 'GENERAL') => {
  try {
    const rocketChatHost = process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001';
    const adminUser = process.env.REACT_APP_ROCKET_CHAT_USER || 'admin';
    const adminPass = process.env.REACT_APP_ROCKET_CHAT_PASS || 'password';
    
    // First, login to get the auth token
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

// Function to clear chat history by adding a delimiter message
export const resetChatSession = async (roomId = 'GENERAL') => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const rocketChatHost = process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001';
      const adminUser = process.env.REACT_APP_ROCKET_CHAT_USER || 'admin';
      const adminPass = process.env.REACT_APP_ROCKET_CHAT_PASS || 'password';
      
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
      
      // First, try to delete all messages
      const deleteResult = await deleteAllChannelMessages(roomId, authToken, userId);
      console.log('Delete result:', deleteResult);
      
      // Send a system message that indicates session boundaries
      // Using only basic parameters to avoid API errors
      const systemMessage = 'New chat session started.';
      
      const response = await fetch(`${rocketChatHost}/api/v1/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        },
        body: JSON.stringify({
          channel: roomId,
          text: systemMessage
        }),
        timeout: 5000
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Reset session response:', errorData);
        throw new Error(`Failed to reset chat session: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
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

// Function to delete all messages in a channel
export const deleteAllChannelMessages = async (roomId = 'GENERAL', authToken = null, userId = null) => {
  try {
    const rocketChatHost = process.env.REACT_APP_ROCKET_CHAT_HOST || 'http://localhost:3001';
    
    // If auth tokens were not provided, login first
    if (!authToken || !userId) {
      const adminUser = process.env.REACT_APP_ROCKET_CHAT_USER || 'admin';
      const adminPass = process.env.REACT_APP_ROCKET_CHAT_PASS || 'password';
      
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
    
    // There are three ways to try to get the room info - try them all
    let actualRoomId = null;
    
    // First, try to get info by room name
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
    
    // If that failed, try roomId directly
    if (!actualRoomId) {
      try {
        actualRoomId = roomId;
        console.log(`Using direct roomId: ${actualRoomId}`);
      } catch (e) {
        console.warn('Failed to use direct room ID:', e);
      }
    }
    
    // If we still don't have a room ID, try getting all rooms and matching
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
          const roomsInfo = await roomsResponse.json();
          const generalRoom = roomsInfo.update.find(r => 
            (r.name === roomId) || (r.fname === roomId) || (r._id === roomId));
          
          if (generalRoom) {
            actualRoomId = generalRoom._id;
            console.log(`Found room ID by listing all rooms: ${actualRoomId}`);
          }
        }
      } catch (e) {
        console.warn('Failed to list all rooms:', e);
      }
    }
    
    if (!actualRoomId) {
      console.error('Could not determine room ID, cannot delete messages');
      return false;
    }

    // Now get messages in the room
    let messages = [];
    try {
      // Try using channels.messages endpoint
      const messagesResponse = await fetch(`${rocketChatHost}/api/v1/channels.messages?roomId=${actualRoomId}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': authToken,
          'X-User-Id': userId
        },
        timeout: 5000
      });
  
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        messages = messagesData.messages || [];
        console.log(`Found ${messages.length} messages via channels.messages endpoint`);
      } else {
        // If that fails, try the general messages endpoint
        const messagesResponse2 = await fetch(`${rocketChatHost}/api/v1/chat.getMessage`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': authToken,
            'X-User-Id': userId
          },
          timeout: 5000
        });
        
        if (messagesResponse2.ok) {
          const messagesData = await messagesResponse2.json();
          messages = Array.isArray(messagesData.messages) ? messagesData.messages : [messagesData.message];
          console.log(`Found ${messages.length} messages via chat.getMessage endpoint`);
        }
      }
    } catch (e) {
      console.warn('Failed to get messages:', e);
    }
    
    if (messages.length === 0) {
      console.log('No messages found to delete');
      return true;
    }
    
    // Delete each message
    let deleteCount = 0;
    for (const message of messages) {
      try {
        const deleteResponse = await fetch(`${rocketChatHost}/api/v1/chat.delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken,
            'X-User-Id': userId
          },
          body: JSON.stringify({
            roomId: actualRoomId,
            msgId: message._id
          }),
          timeout: 5000
        });
        
        if (deleteResponse.ok) {
          deleteCount++;
        } else {
          console.warn(`Failed to delete message ${message._id}: ${deleteResponse.status}`);
        }
      } catch (e) {
        console.warn(`Error deleting message ${message._id}:`, e);
      }
    }
    
    console.log(`Deleted ${deleteCount} out of ${messages.length} messages from ${roomId}`);
    return true;
  } catch (error) {
    console.error('Error deleting channel messages:', error);
    return false;
  }
};