/// <reference types="@cloudflare/workers-types" />

export interface Env {
  PARTY_STORAGE: KVNamespace;
}

export interface CharacterData {
  id: string;
  name: string;
  level: number;
  class: string;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  armorClass: number;
  initiative: number;
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
  deathSaves: {
    successes: number;
    failures: number;
  };
  // Add other relevant fields as needed
}

export interface PartyMember {
  characterId: string;
  characterData: CharacterData;
  lastSeen: number;
}

export interface PartyData {
  code: string;
  members: { [key: string]: PartyMember };
  createdAt: number;
  lastUpdated: number;
}

interface WebSocketMessage {
  type: 'join' | 'leave' | 'update' | 'heartbeat' | 'create' | 'roll_initiative';
  partyCode?: string;
  characterId?: string;
  characterData?: CharacterData;
}

interface WebSocketConnection {
  partyCode: string;
  characterId: string;
  webSocket: WebSocket;
}

// In-memory storage for WebSocket connections (will be reset on worker restart)
const connections = new Map<string, WebSocketConnection[]>();

function generatePartyCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return newResponse;
}

async function broadcastToParty(partyCode: string, message: any, excludeCharacterId?: string) {
  const partyConnections = connections.get(partyCode) || [];
  
  for (const connection of partyConnections) {
    if (excludeCharacterId && connection.characterId === excludeCharacterId) {
      continue;
    }
    
    try {
      connection.webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message to WebSocket:', error);
    }
  }
}

async function handleWebSocketMessage(webSocket: WebSocket, message: WebSocketMessage, env: Env) {
  try {
    switch (message.type) {
      case 'create': {
        const partyCode = generatePartyCode();
        const partyData: PartyData = {
          code: partyCode,
          members: {},
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };

        if (message.characterData) {
          partyData.members[message.characterData.id] = {
            characterId: message.characterData.id,
            characterData: message.characterData,
            lastSeen: Date.now()
          };
        }

        await env.PARTY_STORAGE.put(`party:${partyCode}`, JSON.stringify(partyData));
        
        // Store connection
        if (message.characterData) {
          const connection: WebSocketConnection = {
            partyCode,
            characterId: message.characterData.id,
            webSocket
          };
          
          if (!connections.has(partyCode)) {
            connections.set(partyCode, []);
          }
          connections.get(partyCode)!.push(connection);
        }
        
        webSocket.send(JSON.stringify({
          type: 'party_created',
          success: true,
          partyCode,
          partyData: {
            code: partyData.code,
            members: Object.values(partyData.members),
            createdAt: partyData.createdAt,
            lastUpdated: partyData.lastUpdated
          }
        }));
        break;
      }

      case 'join': {
        if (!message.partyCode || !message.characterData) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Missing partyCode or characterData'
          }));
          return;
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${message.partyCode}`);
        if (!partyDataStr) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Party not found'
          }));
          return;
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
        partyData.members[message.characterData.id] = {
          characterId: message.characterData.id,
          characterData: message.characterData,
          lastSeen: Date.now()
        };
        partyData.lastUpdated = Date.now();

        await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData));
        
        // Store connection
        const connection: WebSocketConnection = {
          partyCode: message.partyCode,
          characterId: message.characterData.id,
          webSocket
        };
        
        if (!connections.has(message.partyCode)) {
          connections.set(message.partyCode, []);
        }
        connections.get(message.partyCode)!.push(connection);
        
        // Broadcast to all party members
        await broadcastToParty(message.partyCode, {
          type: 'member_joined',
          partyData: {
            code: partyData.code,
            members: Object.values(partyData.members),
            createdAt: partyData.createdAt,
            lastUpdated: partyData.lastUpdated
          }
        });
        break;
      }

      case 'update': {
        if (!message.partyCode || !message.characterData) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Missing partyCode or characterData'
          }));
          return;
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${message.partyCode}`);
        if (!partyDataStr) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Party not found'
          }));
          return;
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
        if (partyData.members[message.characterData.id]) {
          partyData.members[message.characterData.id].characterData = message.characterData;
          partyData.members[message.characterData.id].lastSeen = Date.now();
          partyData.lastUpdated = Date.now();
          
          await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData));
          
          // Broadcast to all party members
          await broadcastToParty(message.partyCode, {
            type: 'member_updated',
            partyData: {
              code: partyData.code,
              members: Object.values(partyData.members),
              createdAt: partyData.createdAt,
              lastUpdated: partyData.lastUpdated
            }
          });
        }
        break;
      }

      case 'roll_initiative': {
        if (!message.partyCode || !message.characterData) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Missing partyCode or characterData'
          }));
          return;
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${message.partyCode}`);
        if (!partyDataStr) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Party not found'
          }));
          return;
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
        if (partyData.members[message.characterData.id]) {
          // Update the character data with the initiative roll
          partyData.members[message.characterData.id].characterData = message.characterData;
          partyData.members[message.characterData.id].lastSeen = Date.now();
          partyData.lastUpdated = Date.now();
          
          await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData));
          
          // Broadcast to all party members
          await broadcastToParty(message.partyCode, {
            type: 'initiative_rolled',
            characterId: message.characterData.id,
            initiativeRoll: message.characterData.initiativeRoll,
            partyData: {
              code: partyData.code,
              members: Object.values(partyData.members),
              createdAt: partyData.createdAt,
              lastUpdated: partyData.lastUpdated
            }
          });
        }
        break;
      }

      case 'leave': {
        if (!message.partyCode || !message.characterId) {
          webSocket.send(JSON.stringify({
            type: 'error',
            error: 'Missing partyCode or characterId'
          }));
          return;
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${message.partyCode}`);
        if (partyDataStr) {
          const partyData: PartyData = JSON.parse(partyDataStr);
          
          if (partyData.members[message.characterId]) {
            delete partyData.members[message.characterId];
            partyData.lastUpdated = Date.now();
            
            // If no members left, delete the party after 1 hour
            if (Object.keys(partyData.members).length === 0) {
              await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData), {
                expirationTtl: 3600 // 1 hour
              });
            } else {
              await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData));
            }
            
            // Broadcast to remaining party members
            await broadcastToParty(message.partyCode, {
              type: 'member_left',
              characterId: message.characterId,
              partyData: {
                code: partyData.code,
                members: Object.values(partyData.members),
                createdAt: partyData.createdAt,
                lastUpdated: partyData.lastUpdated
              }
            });
          }
        }
        
        // Remove connection
        const partyConnections = connections.get(message.partyCode) || [];
        const updatedConnections = partyConnections.filter(
          conn => conn.characterId !== message.characterId
        );
        
        if (updatedConnections.length === 0) {
          connections.delete(message.partyCode);
        } else {
          connections.set(message.partyCode, updatedConnections);
        }
        
        webSocket.send(JSON.stringify({
          type: 'left_party',
          success: true
        }));
        break;
      }

      case 'heartbeat': {
        if (!message.partyCode || !message.characterId) {
          return;
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${message.partyCode}`);
        if (partyDataStr) {
          const partyData: PartyData = JSON.parse(partyDataStr);
          
          if (partyData.members[message.characterId]) {
            partyData.members[message.characterId].lastSeen = Date.now();
            await env.PARTY_STORAGE.put(`party:${message.partyCode}`, JSON.stringify(partyData));
          }
        }
        break;
      }

      default:
        webSocket.send(JSON.stringify({
          type: 'error',
          error: 'Unknown message type'
        }));
    }
  } catch (error) {
    console.error('WebSocket message handling error:', error);
    webSocket.send(JSON.stringify({
      type: 'error',
      error: 'Internal server error'
    }));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 200 }));
    }

    // WebSocket upgrade
    if (url.pathname === '/ws' && request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();

      server.addEventListener('message', async (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data as string);
          await handleWebSocketMessage(server, message, env);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          server.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }));
        }
      });

      server.addEventListener('close', () => {
        // Clean up connections when WebSocket closes
        for (const [partyCode, partyConnections] of connections.entries()) {
          const updatedConnections = partyConnections.filter(conn => conn.webSocket !== server);
          if (updatedConnections.length === 0) {
            connections.delete(partyCode);
          } else {
            connections.set(partyCode, updatedConnections);
          }
        }
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Fallback HTTP endpoints for non-WebSocket clients
    try {
      // Create party (HTTP fallback)
      if (url.pathname === '/api/party/create' && request.method === 'POST') {
        const body = await request.json() as { characterData?: CharacterData };
        const partyCode = generatePartyCode();
        
        const partyData: PartyData = {
          code: partyCode,
          members: {},
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };

        if (body.characterData) {
          partyData.members[body.characterData.id] = {
            characterId: body.characterData.id,
            characterData: body.characterData,
            lastSeen: Date.now()
          };
        }

        await env.PARTY_STORAGE.put(`party:${partyCode}`, JSON.stringify(partyData));
        
        return addCorsHeaders(new Response(JSON.stringify({
          success: true,
          partyCode,
          partyData: {
            code: partyData.code,
            members: Object.values(partyData.members),
            createdAt: partyData.createdAt,
            lastUpdated: partyData.lastUpdated
          }
        })));
      }

      // Join party (HTTP fallback)
      if (url.pathname === '/api/party/join' && request.method === 'POST') {
        const body = await request.json() as { partyCode: string; characterData?: CharacterData };
        
        const partyDataStr = await env.PARTY_STORAGE.get(`party:${body.partyCode}`);
        if (!partyDataStr) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Party not found'
          }), { status: 404 }));
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
        if (body.characterData) {
          partyData.members[body.characterData.id] = {
            characterId: body.characterData.id,
            characterData: body.characterData,
            lastSeen: Date.now()
          };
          partyData.lastUpdated = Date.now();

          await env.PARTY_STORAGE.put(`party:${body.partyCode}`, JSON.stringify(partyData));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          success: true,
          partyData: {
            code: partyData.code,
            members: Object.values(partyData.members),
            createdAt: partyData.createdAt,
            lastUpdated: partyData.lastUpdated
          }
        })));
      }

      return addCorsHeaders(new Response('Not found', { status: 404 }));

    } catch (error) {
      console.error('Worker error:', error);
      return addCorsHeaders(new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500 }));
    }
  },
}; 