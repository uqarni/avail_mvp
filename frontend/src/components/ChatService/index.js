import ChatService from './ChatService';

// Export main component
export default ChatService;

// Export API services and Components if needed
export { callGepeto, performHealthCheck } from './api/ApiService';
export { sendRocketChatMessage, resetChatSession } from './api/RocketChatService';
export { default as TourManager } from './components/TourManager'; 