// API configuration for development and production
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const API_BASE_URL = isProduction 
  ? 'https://your-backend-domain.com' // Replace with your actual backend URL when deployed
  : 'http://localhost:5000';

const SOCKET_URL = isProduction
  ? 'https://your-backend-domain.com' // Replace with your actual backend URL when deployed
  : 'http://localhost:5000';

export { API_BASE_URL, SOCKET_URL };
