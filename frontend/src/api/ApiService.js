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
