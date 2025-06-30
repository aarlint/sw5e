interface CharacterData {
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
}

interface PartyMember {
  characterId: string;
  characterData: CharacterData;
  lastSeen: number;
}

interface PartyData {
  code: string;
  members: PartyMember[];
  createdAt: number;
  lastUpdated: number;
}

interface WebSocketMessage {
  type: 'join' | 'leave' | 'update' | 'heartbeat' | 'create';
  partyCode?: string;
  characterId?: string;
  characterData?: CharacterData;
}

class PartyService {
  private workerUrl: string = 'https://sw5e-party-worker.stoic.workers.dev';
  private eventListeners: Map<string, Function[]> = new Map();
  private currentPartyCode: string | null = null;
  private currentCharacterId: string | null = null;
  private webSocket: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    // For development, you can use a local worker URL
    if (process.env.NODE_ENV === 'development') {
      this.workerUrl = 'http://localhost:8787';
    }
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.workerUrl.replace('http', 'ws') + '/ws';
        this.webSocket = new WebSocket(wsUrl);

        this.webSocket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.webSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.webSocket.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleDisconnect();
        };

        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'party_created':
        this.emit('partyUpdate', message.partyData);
        break;
      
      case 'member_joined':
      case 'member_updated':
      case 'member_left':
        this.emit('partyUpdate', message.partyData);
        break;
      
      case 'left_party':
        this.emit('partyUpdate', null);
        break;
      
      case 'error':
        console.error('WebSocket error:', message.error);
        this.emit('error', message.error);
        break;
      
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentPartyCode) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket().then(() => {
          // Rejoin the party after reconnection
          if (this.currentPartyCode && this.currentCharacterId) {
            this.rejoinParty();
          }
        }).catch((error) => {
          console.error('Failed to reconnect:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private async rejoinParty() {
    if (!this.currentPartyCode || !this.currentCharacterId || !this.webSocket) return;

    // Get character data from storage or emit an event to request it
    this.emit('requestCharacterData', this.currentCharacterId);
  }

  private sendWebSocketMessage(message: WebSocketMessage) {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  async createParty(characterData: CharacterData): Promise<{ success: boolean; partyCode?: string; error?: string }> {
    try {
      if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
        await this.connectWebSocket();
      }

      this.currentCharacterId = characterData.id;
      
      this.sendWebSocketMessage({
        type: 'create',
        characterData
      });

      // Return a promise that will be resolved when we get the party_created response
      return new Promise((resolve) => {
        const handlePartyCreated = (partyData: PartyData) => {
          this.off('partyUpdate', handlePartyCreated);
          this.currentPartyCode = partyData.code;
          this.startHeartbeatTimer();
          resolve({ success: true, partyCode: partyData.code });
        };

        const handleError = (error: string) => {
          this.off('error', handleError);
          resolve({ success: false, error });
        };

        this.on('partyUpdate', handlePartyCreated);
        this.on('error', handleError);
      });
    } catch (error) {
      console.error('Failed to create party:', error);
      return { success: false, error: 'Failed to create party' };
    }
  }

  async joinParty(partyCode: string, characterData: CharacterData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
        await this.connectWebSocket();
      }

      this.currentPartyCode = partyCode;
      this.currentCharacterId = characterData.id;
      
      this.sendWebSocketMessage({
        type: 'join',
        partyCode,
        characterData
      });

      // Return a promise that will be resolved when we get the member_joined response
      return new Promise((resolve) => {
        const handlePartyUpdate = (partyData: PartyData) => {
          this.off('partyUpdate', handlePartyUpdate);
          this.startHeartbeatTimer();
          resolve({ success: true });
        };

        const handleError = (error: string) => {
          this.off('error', handleError);
          resolve({ success: false, error });
        };

        this.on('partyUpdate', handlePartyUpdate);
        this.on('error', handleError);
      });
    } catch (error) {
      console.error('Failed to join party:', error);
      return { success: false, error: 'Failed to join party' };
    }
  }

  async leaveParty(characterId: string): Promise<void> {
    try {
      if (this.webSocket && this.currentPartyCode) {
        this.sendWebSocketMessage({
          type: 'leave',
          partyCode: this.currentPartyCode,
          characterId
        });
      }
    } catch (error) {
      console.error('Failed to leave party:', error);
    }

    this.disconnect();
  }

  async updateCharacter(characterData: CharacterData) {
    if (!this.currentPartyCode) return;

    try {
      this.sendWebSocketMessage({
        type: 'update',
        partyCode: this.currentPartyCode,
        characterData
      });
    } catch (error) {
      console.error('Failed to update character:', error);
    }
  }

  private startHeartbeatTimer() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send heartbeat every 30 seconds to update last seen
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);

    // Initial heartbeat
    this.sendHeartbeat();
  }

  private sendHeartbeat() {
    if (!this.currentPartyCode || !this.currentCharacterId) return;

    try {
      this.sendWebSocketMessage({
        type: 'heartbeat',
        partyCode: this.currentPartyCode,
        characterId: this.currentCharacterId
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    this.currentPartyCode = null;
    this.currentCharacterId = null;
    this.reconnectAttempts = 0;
  }

  // Event system for listening to party updates
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Legacy method - kept for compatibility
  startHeartbeat() {
    // This method is called by existing code, but heartbeat is now automatic
  }
}

const partyService = new PartyService();
export default partyService;
export type { CharacterData, PartyMember, PartyData }; 