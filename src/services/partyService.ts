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

class PartyService {
  private workerUrl: string = 'https://sw5e-party-worker.stoic.workers.dev';
  private eventListeners: Map<string, Function[]> = new Map();
  private currentPartyCode: string | null = null;
  private currentCharacterId: string | null = null;
  private lastKnownUpdate: number = 0;
  private pollingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // For development, you can use a local worker URL
    if (process.env.NODE_ENV === 'development') {
      this.workerUrl = 'http://localhost:8787';
    }
  }

  async createParty(characterData: CharacterData): Promise<{ success: boolean; partyCode?: string; error?: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/party/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterData }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentPartyCode = data.partyCode;
        this.currentCharacterId = characterData.id;
        this.lastKnownUpdate = data.partyData.lastUpdated;
        this.startPolling();
        this.startHeartbeatTimer();
        
        // Emit initial party update
        this.emit('partyUpdate', data.partyData);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create party:', error);
      return { success: false, error: 'Failed to create party' };
    }
  }

  async joinParty(partyCode: string, characterData: CharacterData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/party/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partyCode, characterData }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.currentPartyCode = partyCode;
        this.currentCharacterId = characterData.id;
        this.lastKnownUpdate = data.partyData.lastUpdated;
        this.startPolling();
        this.startHeartbeatTimer();
        
        // Emit initial party update
        this.emit('partyUpdate', data.partyData);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to join party:', error);
      return { success: false, error: 'Failed to join party' };
    }
  }

  async leaveParty(characterId: string): Promise<void> {
    try {
      if (this.currentPartyCode) {
        await fetch(`${this.workerUrl}/api/party/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ partyCode: this.currentPartyCode, characterId }),
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
      await fetch(`${this.workerUrl}/api/party/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partyCode: this.currentPartyCode,
          characterData
        }),
      });
    } catch (error) {
      console.error('Failed to update character:', error);
    }
  }

  private async pollForUpdates() {
    if (!this.currentPartyCode) return;

    try {
      const response = await fetch(`${this.workerUrl}/api/party/${this.currentPartyCode}/status`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.partyData.lastUpdated > this.lastKnownUpdate) {
          this.lastKnownUpdate = data.partyData.lastUpdated;
          this.emit('partyUpdate', data.partyData);
        }
      }
    } catch (error) {
      console.error('Failed to poll for updates:', error);
    }
  }

  private async sendHeartbeat() {
    if (!this.currentPartyCode || !this.currentCharacterId) return;

    try {
      await fetch(`${this.workerUrl}/api/party/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partyCode: this.currentPartyCode,
          characterId: this.currentCharacterId
        }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll every 3 seconds for updates
    this.pollingInterval = setInterval(() => {
      this.pollForUpdates();
    }, 3000);

    // Initial poll
    this.pollForUpdates();
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

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.currentPartyCode = null;
    this.currentCharacterId = null;
    this.lastKnownUpdate = 0;
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

  // Legacy method - no longer needed with polling
  startHeartbeat() {
    // This method is called by existing code, but heartbeat is now automatic
  }
}

export default new PartyService();
export type { CharacterData, PartyMember, PartyData }; 