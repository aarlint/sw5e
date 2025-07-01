// Cloudflare Worker Configuration
export const WORKER_CONFIG = {
  // Update this URL to match your deployed worker
  // Replace 'your-worker-name.your-subdomain' with your actual worker URL
  WEBSOCKET_URL: 'wss://sw5e-party-worker.stoic.workers.dev/ws',
  
  // HTTP endpoints for fallback
  API_BASE_URL: 'https://sw5e-party-worker.stoic.workers.dev',
  
  // Connection settings
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  
  // Environment
  ENVIRONMENT: process.env.NODE_ENV || 'development'
};

// Helper function to get the WebSocket URL
export function getWebSocketUrl(): string {
  // Check for environment variable first
  if (process.env.REACT_APP_WORKER_URL) {
    return process.env.REACT_APP_WORKER_URL;
  }
  
  // Fall back to config
  return WORKER_CONFIG.WEBSOCKET_URL;
}

// Helper function to get the API base URL
export function getApiBaseUrl(): string {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  return WORKER_CONFIG.API_BASE_URL;
} 