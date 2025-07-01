# Cloudflare Worker Setup for Local Development

## Overview
This application uses a Cloudflare Worker for real-time game state synchronization. When developing locally, you need to connect to the deployed worker.

## Configuration

### 1. Update Worker URL
Edit `src/config/worker.ts` and update the `WEBSOCKET_URL` to match your deployed worker:

```typescript
export const WORKER_CONFIG = {
  // Update this to your actual worker URL
  WEBSOCKET_URL: 'wss://your-worker-name.your-subdomain.workers.dev/ws',
  // ...
};
```

### 2. Environment Variables (Optional)
You can also set environment variables for different environments:

Create a `.env.local` file in the root directory:
```bash
REACT_APP_WORKER_URL=wss://your-worker-name.your-subdomain.workers.dev/ws
REACT_APP_API_BASE_URL=https://your-worker-name.your-subdomain.workers.dev
```

### 3. Deploy Your Worker
Make sure your Cloudflare Worker is deployed and accessible. The worker should be deployed to the same URL you're using in the configuration.

## Testing the Connection

1. Start your local development server:
   ```bash
   npm start
   ```

2. Open the browser console and look for:
   ```
   Connecting to WebSocket: wss://your-worker-name.your-subdomain.workers.dev/ws
   WebSocket connected
   ```

3. If you see connection errors, check:
   - Worker URL is correct
   - Worker is deployed and running
   - No CORS issues (worker should allow all origins for development)

## Troubleshooting

### Connection Failed
- Verify the worker URL is correct
- Check that the worker is deployed and running
- Ensure the worker supports WebSocket connections

### CORS Errors
- The worker should include CORS headers for localhost
- Check the worker's CORS configuration

### WebSocket Upgrade Failed
- Verify the worker handles WebSocket upgrades at `/ws`
- Check worker logs for any errors

## Production Deployment

For production, update the configuration to use your production worker URL:

```typescript
export const WORKER_CONFIG = {
  WEBSOCKET_URL: 'wss://your-production-worker.workers.dev/ws',
  API_BASE_URL: 'https://your-production-worker.workers.dev',
  // ...
};
``` 