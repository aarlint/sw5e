interface CharacterData {
  id: string;
  name: string;
  level: number;
  class: string;
  background: string;
  species: string;
  alignment: string;
  experiencePoints: number;
  
  // Ability Scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Combat
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  
  // Hit Dice
  hitDice: string;
  hitDiceTotal: string;
  
  // Death Saves
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  // Weapons
  weapons: Weapon[];
  
  // Skills
  skills: Skill[];
  
  // Proficiencies
  proficiencies: {
    armor: string;
    weapons: string;
    tools: string;
    languages: string;
  };
  
  // Features & Traits
  features: string;
  
  // Resources
  credits: number;
  forcePoints: number;
  techPoints: number;
  
  // Exhaustion
  exhaustion: number;
  
  // Equipment
  equipment: string;
  
  // Personality
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  
  // Notes
  notes: string;
  
  // Metadata
  createdAt: string;
  lastModified: string;
  
  // Initiative roll (optional)
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
}

interface Weapon {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: string;
  properties: string;
}

interface Skill {
  name: string;
  ability: string;
  proficient: boolean;
  bonus: number;
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
  type: 'join' | 'leave' | 'update' | 'heartbeat' | 'create' | 'roll_initiative';
  partyCode?: string;
  characterId?: string;
  characterData?: CharacterData;
  partyMember?: PartyMember;
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
        this.emit('connectionStatus', 'connecting');
        const wsUrl = this.workerUrl.replace('http', 'ws') + '/ws';
        this.webSocket = new WebSocket(wsUrl);

        this.webSocket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connectionStatus', 'connected');
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
          this.emit('connectionStatus', 'disconnected');
          this.handleDisconnect();
        };

        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('connectionStatus', 'disconnected');
          reject(error);
        };
      } catch (error) {
        this.emit('connectionStatus', 'disconnected');
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
      
      case 'initiative_rolled':
        this.emit('partyUpdate', message.partyData);
        this.emit('initiativeRolled', {
          characterId: message.characterId,
          initiativeRoll: message.initiativeRoll
        });
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
    if (!this.currentPartyCode || !this.currentCharacterId) return;

    try {
      // Create complete party member data
      const partyMember: PartyMember = {
        characterId: this.currentCharacterId,
        characterData: characterData,
        lastSeen: Date.now()
      };

      this.sendWebSocketMessage({
        type: 'update',
        partyCode: this.currentPartyCode,
        partyMember: partyMember
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
    this.emit('connectionStatus', 'disconnected');
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

  async rollInitiative(characterData: CharacterData): Promise<void> {
    if (!this.currentPartyCode || !this.currentCharacterId) return;

    try {
      // Calculate initiative roll
      const roll = Math.floor(Math.random() * 20) + 1; // 1d20
      const modifier = Math.floor((characterData.initiative - 10) / 2); // Convert initiative bonus to modifier
      const total = roll + modifier;
      
      // Create updated character data with initiative roll
      const updatedCharacterData: CharacterData = {
        ...characterData,
        initiativeRoll: {
          total,
          roll,
          modifier,
          timestamp: Date.now()
        }
      };

      // Create complete party member data
      const partyMember: PartyMember = {
        characterId: this.currentCharacterId,
        characterData: updatedCharacterData,
        lastSeen: Date.now()
      };

      this.sendWebSocketMessage({
        type: 'roll_initiative',
        partyCode: this.currentPartyCode,
        partyMember: partyMember
      });
    } catch (error) {
      console.error('Failed to roll initiative:', error);
    }
  }
}

const partyService = new PartyService();
export default partyService;
export type { CharacterData, PartyMember, PartyData }; 