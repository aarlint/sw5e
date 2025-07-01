# SW5e Character Sheet with Party System

A Star Wars 5th Edition character sheet application with real-time party synchronization using React and Cloudflare Workers with KV storage. Features Google OAuth SSO for user authentication and tracking.

## Features

- **Complete Character Management**: Create and manage SW5e characters with all stats, skills, weapons, and resources
- **Real-time Party System**: Join or create parties with 5-digit codes to share character status in real-time
- **Google OAuth SSO**: Secure authentication with Google accounts
- **User Tracking**: Monitor user activity, characters created, and games played
- **Admin Dashboard**: View user statistics and activity
- **Health Tracking**: Visual health bars and status indicators for all party members
- **Death Save Tracking**: Real-time death save status for unconscious characters
- **Offline Detection**: See when party members go offline
- **Mobile Responsive**: Works on desktop and mobile devices

## Features

- **Complete Character Management**: Create and manage SW5e characters with all stats, skills, weapons, and resources
- **Real-time Party System**: Join or create parties with 5-digit codes to share character status in real-time
- **Health Tracking**: Visual health bars and status indicators for all party members
- **Death Save Tracking**: Real-time death save status for unconscious characters
- **Offline Detection**: See when party members go offline
- **Mobile Responsive**: Works on desktop and mobile devices

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set up the OAuth consent screen
6. Create a Web application client ID
7. Add `http://localhost:3000` to authorized JavaScript origins
8. Add `http://localhost:3000/auth/callback` to authorized redirect URIs

### 2. Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. Restart your development server

## Party System Setup

The party system uses **Cloudflare KV storage** for persistence and a polling mechanism for real-time updates. This keeps the entire system **completely free** while being highly reliable.

### 1. Deploy the Cloudflare Worker

#### Prerequisites
- A Cloudflare account (free tier works)
- Node.js 16+ installed
- npm or yarn

#### Quick Setup (Windows)

1. **Navigate to the worker directory:**
   ```bash
   cd worker
   ```

2. **Run the automated setup script:**
   ```bash
   setup-and-deploy.bat
   ```

This script will:
- Install Wrangler CLI if needed
- Log you into Cloudflare
- Create the required KV namespaces
- Update the configuration automatically
- Deploy the worker

#### Manual Setup (All Platforms)

If the automated script doesn't work, follow these manual steps:

1. **Navigate to the worker directory:**
   ```bash
   cd worker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

4. **Create KV namespaces:**
   ```bash
   npx wrangler kv:namespace create "PARTY_STORAGE"
   npx wrangler kv:namespace create "PARTY_STORAGE" --preview
   ```

5. **Update wrangler.toml:**
   
   Copy the output from step 4 and add it to `wrangler.toml`. It should look like:
   ```toml
   name = "sw5e-party-worker"
   main = "src/index.ts"
   compatibility_date = "2024-01-15"

   [[kv_namespaces]]
   binding = "PARTY_STORAGE"
   id = "your-namespace-id-here"
   preview_id = "your-preview-id-here"
   ```

6. **Deploy the worker:**
   ```bash
   npx wrangler deploy
   ```

7. **Note your worker URL:**
   After deployment, you'll get a URL like: `https://sw5e-party-worker.your-subdomain.workers.dev`

### 2. Configure the React App

1. **Update the worker URL in the party service:**
   
   Edit `src/services/partyService.ts` and replace:
   ```typescript
   private workerUrl: string = 'https://sw5e-party-worker.your-subdomain.workers.dev';
   ```
   
   With your actual worker URL from step 1.

2. **For development**, you can also run the worker locally:
   ```bash
   cd worker
   npm run dev
   ```
   
   This will start the worker on `http://localhost:8787` (the service automatically detects this in development mode).

### 3. Run the React App

```bash
npm start
```

## How to Use the Party System

### Creating a Party

1. Fill in your character's basic information (name, class, level, etc.)
2. Click "Create New Party" in the Party System section
3. You'll receive a 5-digit code - share this with your friends
4. Your character will appear as a party member card

### Joining a Party

1. Fill in your character's basic information
2. Click "Join Party" in the Party System section
3. Enter the 5-digit party code from your game master or friend
4. Click "Join" - you'll now see all party members

### Party Features

- **Real-time Health Updates**: See everyone's current HP, max HP, and temporary HP (updates every 3 seconds)
- **Status Indicators**: Know who's conscious, unconscious, stabilized, or dead
- **Death Save Tracking**: See live death save successes and failures for unconscious characters
- **Offline Detection**: Party members who haven't been active for over 1 minute show as offline
- **Combat Stats**: View AC and initiative modifiers for quick reference

## Technical Details

### Architecture

- **Frontend**: React with polling every 3 seconds for updates
- **Backend**: Cloudflare Worker with REST API
- **Storage**: Cloudflare KV (key-value store)
- **Updates**: Polling-based for reliability across all network conditions

### Why Polling Instead of WebSockets?

KV storage is simpler and more reliable than Durable Objects for this use case:
- **100% Free**: KV storage has very generous free limits
- **No Connection Issues**: Works behind firewalls and proxies
- **Battery Friendly**: No persistent connections on mobile
- **Simple Architecture**: Easier to debug and maintain

## Cost Information

The party system is designed to be **completely free** using Cloudflare's generous free tiers:

- **Cloudflare Workers**: 100,000 requests/day free
- **KV Storage**: 100,000 read operations/day + 1,000 write operations/day free
- **Total cost for typical D&D group**: $0/month

For a party of 6 players:
- **Polling**: 6 players × 20 polls/minute × 4 hours = 2,880 reads per session
- **Updates**: ~50-100 writes per session (character changes)
- **Monthly usage**: ~12,000 reads + 400 writes (well within free limits)

## Development

### Project Structure

```
src/
├── components/
│   ├── CharacterSheet.tsx      # Main character sheet
│   ├── PartyManager.tsx        # Party creation/joining UI
│   ├── PartyMemberCard.tsx     # Individual party member display
│   └── DiceRollPopup.tsx       # Dice rolling functionality
├── services/
│   └── partyService.ts         # Polling communication with worker
└── ...

worker/
├── src/
│   └── index.ts                # Cloudflare Worker code
├── wrangler.toml               # Worker configuration
├── setup-and-deploy.bat       # Automated setup script (Windows)
└── package.json
```

### Key Technologies

- **Frontend**: React 18, TypeScript, CSS
- **Backend**: Cloudflare Workers, KV Storage
- **Updates**: HTTP polling every 3 seconds
- **Storage**: Cloudflare KV (key-value distributed storage)

### Local Development

1. **Start the worker locally:**
   ```bash
   cd worker
   npm run dev
   ```

2. **Start the React app:**
   ```bash
   npm start
   ```

The React app will automatically connect to the local worker when running in development mode.

## Troubleshooting

### Party Connection Issues

1. **Check the worker URL** in `src/services/partyService.ts`
2. **Verify CORS settings** - the worker should allow all origins
3. **Check browser console** for network errors
4. **Try refreshing** the page if updates stop

### Worker Deployment Issues

1. **KV Namespace Error**: Make sure you've created the KV namespaces first:
   ```bash
   wrangler kv:namespace create "PARTY_STORAGE"
   wrangler kv:namespace create "PARTY_STORAGE" --preview
   ```

2. **Make sure you're logged in to Cloudflare:**
   ```bash
   npx wrangler whoami
   ```

3. **Check your wrangler.toml configuration** has the correct namespace IDs

### Character Not Syncing

1. **Ensure your character has a name** - unnamed characters can't join parties
2. **Check that character data is being saved** - refresh the page to verify
3. **Verify polling is active** in browser developer tools (Network tab)

### Performance Issues

If updates seem slow:
- The system polls every 3 seconds by default
- Updates appear immediately for the person making changes
- Other party members see changes within 3 seconds
- You can refresh manually anytime for instant updates

## Contributing

Feel free to open issues or submit pull requests! The party system is designed to be extensible for additional real-time features.

## License

MIT License - feel free to use this for your own campaigns!
