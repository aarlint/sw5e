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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 200 }));
    }

    try {
      // Create party
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

      // Join party
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

      // Update character
      if (url.pathname === '/api/party/update' && request.method === 'POST') {
        const body = await request.json() as { partyCode: string; characterData: CharacterData };
        
        if (!body.partyCode || !body.characterData) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Invalid request - missing partyCode or characterData'
          }), { status: 400 }));
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${body.partyCode}`);
        if (!partyDataStr) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Party not found'
          }), { status: 404 }));
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
        if (partyData.members[body.characterData.id]) {
          partyData.members[body.characterData.id].characterData = body.characterData;
          partyData.members[body.characterData.id].lastSeen = Date.now();
          partyData.lastUpdated = Date.now();
          
          await env.PARTY_STORAGE.put(`party:${body.partyCode}`, JSON.stringify(partyData));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({ success: true })));
      }

      // Get party status (for polling)
      if (url.pathname.startsWith('/api/party/') && url.pathname.endsWith('/status') && request.method === 'GET') {
        const partyCode = url.pathname.split('/')[3];
        
        const partyDataStr = await env.PARTY_STORAGE.get(`party:${partyCode}`);
        if (!partyDataStr) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Party not found'
          }), { status: 404 }));
        }

        const partyData: PartyData = JSON.parse(partyDataStr);
        
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

      // Leave party
      if (url.pathname === '/api/party/leave' && request.method === 'POST') {
        const body = await request.json() as { partyCode: string; characterId: string };
        
        if (!body.partyCode || !body.characterId) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Invalid request - missing partyCode or characterId'
          }), { status: 400 }));
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${body.partyCode}`);
        if (partyDataStr) {
          const partyData: PartyData = JSON.parse(partyDataStr);
          
          if (partyData.members[body.characterId]) {
            delete partyData.members[body.characterId];
            partyData.lastUpdated = Date.now();
            
            // If no members left, delete the party after 1 hour
            if (Object.keys(partyData.members).length === 0) {
              await env.PARTY_STORAGE.put(`party:${body.partyCode}`, JSON.stringify(partyData), {
                expirationTtl: 3600 // 1 hour
              });
            } else {
              await env.PARTY_STORAGE.put(`party:${body.partyCode}`, JSON.stringify(partyData));
            }
          }
        }
        
        return addCorsHeaders(new Response(JSON.stringify({ success: true })));
      }

      // Heartbeat to update last seen
      if (url.pathname === '/api/party/heartbeat' && request.method === 'POST') {
        const body = await request.json() as { partyCode: string; characterId: string };
        
        if (!body.partyCode || !body.characterId) {
          return addCorsHeaders(new Response(JSON.stringify({
            success: false,
            error: 'Invalid request'
          }), { status: 400 }));
        }

        const partyDataStr = await env.PARTY_STORAGE.get(`party:${body.partyCode}`);
        if (partyDataStr) {
          const partyData: PartyData = JSON.parse(partyDataStr);
          
          if (partyData.members[body.characterId]) {
            partyData.members[body.characterId].lastSeen = Date.now();
            await env.PARTY_STORAGE.put(`party:${body.partyCode}`, JSON.stringify(partyData));
          }
        }
        
        return addCorsHeaders(new Response(JSON.stringify({ success: true })));
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