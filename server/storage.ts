import { users, gameProfiles, alliances, type User, type InsertUser, type GameProfile, type InsertGameProfile, type Alliance } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game profile methods
  getGameProfile(userId: number): Promise<GameProfile | undefined>;
  getGameProfileByCharacterId(characterId: string): Promise<GameProfile | undefined>;
  createGameProfile(profile: InsertGameProfile): Promise<GameProfile>;
  updateGameProfile(id: number, data: Partial<GameProfile>): Promise<GameProfile | undefined>;
  
  // Player and alliance rankings
  getAllPlayers(filters?: PlayerFilters): Promise<GameProfile[]>;
  getAllAlliances(filters?: AllianceFilters): Promise<AllianceWithStats[]>;
  
  // Session store for auth
  sessionStore: any; // Using any to avoid type issues with different session store implementations
}

export type PlayerFilters = {
  server?: string;
  alliance?: string;
  sortBy?: 'powerNow' | 'powerMax' | 'level';
  sortOrder?: 'asc' | 'desc';
};

export type AllianceFilters = {
  server?: string;
  sortBy?: 'totalPower' | 'memberCount' | 'averagePower';
  sortOrder?: 'asc' | 'desc';
};

export type AllianceWithStats = Alliance & {
  averagePower: number;
};

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameProfiles: Map<number, GameProfile>;
  private alliances: Map<number, Alliance>;
  private currentUserId: number;
  private currentProfileId: number;
  private currentAllianceId: number;
  sessionStore: any; // Using any to avoid type issues

  constructor() {
    this.users = new Map();
    this.gameProfiles = new Map();
    this.alliances = new Map();
    this.currentUserId = 1;
    this.currentProfileId = 1;
    this.currentAllianceId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGameProfile(userId: number): Promise<GameProfile | undefined> {
    return Array.from(this.gameProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }

  async getGameProfileByCharacterId(characterId: string): Promise<GameProfile | undefined> {
    return Array.from(this.gameProfiles.values()).find(
      (profile) => profile.characterId === characterId,
    );
  }

  async createGameProfile(insertProfile: InsertGameProfile): Promise<GameProfile> {
    const id = this.currentProfileId++;
    
    // Ensure all optional fields have null values if not provided
    const profile: GameProfile = { 
      id,
      userId: insertProfile.userId,
      characterId: insertProfile.characterId,
      nickname: insertProfile.nickname,
      server: insertProfile.server || null,
      alliance: insertProfile.alliance || null,
      level: insertProfile.level || null,
      powerNow: insertProfile.powerNow || null,
      powerMax: insertProfile.powerMax || null,
      hiddenPower: insertProfile.hiddenPower || null
    };
    
    this.gameProfiles.set(id, profile);
    
    // Update or create alliance
    if (profile.alliance && profile.server) {
      this.updateAllianceStats(profile.alliance, profile.server, profile.powerNow || 0);
    }
    
    return profile;
  }

  async updateGameProfile(id: number, data: Partial<GameProfile>): Promise<GameProfile | undefined> {
    const profile = this.gameProfiles.get(id);
    
    if (!profile) {
      return undefined;
    }
    
    // If alliance changed, update alliances data
    if (data.alliance && data.alliance !== profile.alliance && profile.server) {
      // Decrease old alliance stats if it exists
      if (profile.alliance) {
        this.updateAllianceStats(profile.alliance, profile.server, -(profile.powerNow || 0), -1);
      }
      
      // Increase new alliance stats
      this.updateAllianceStats(data.alliance, profile.server, profile.powerNow || 0);
    }
    
    // If power changed, update alliance stats
    if (data.powerNow !== undefined && data.powerNow !== profile.powerNow && profile.alliance && profile.server) {
      const powerDiff = data.powerNow - (profile.powerNow || 0);
      this.updateAllianceStats(profile.alliance, profile.server, powerDiff);
    }
    
    const updatedProfile = { ...profile, ...data };
    this.gameProfiles.set(id, updatedProfile);
    
    return updatedProfile;
  }

  private updateAllianceStats(allianceName: string, server: string, powerDiff: number, memberDiff = 0) {
    // Find alliance or create it
    const existingAlliance = Array.from(this.alliances.values()).find(
      (a) => a.name === allianceName && a.server === server
    );
    
    if (existingAlliance) {
      const updatedAlliance = {
        ...existingAlliance,
        memberCount: (existingAlliance.memberCount || 0) + memberDiff,
        totalPower: (existingAlliance.totalPower || 0) + powerDiff
      };
      this.alliances.set(existingAlliance.id, updatedAlliance);
    } else {
      const id = this.currentAllianceId++;
      const newAlliance: Alliance = {
        id,
        name: allianceName,
        server,
        memberCount: 1,
        totalPower: powerDiff
      };
      this.alliances.set(id, newAlliance);
    }
  }

  async getAllPlayers(filters?: PlayerFilters): Promise<GameProfile[]> {
    let players = Array.from(this.gameProfiles.values());
    
    // Apply filters
    if (filters) {
      if (filters.server) {
        players = players.filter(p => p.server === filters.server);
      }
      
      if (filters.alliance) {
        players = players.filter(p => p.alliance === filters.alliance);
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'powerNow';
      const sortOrder = filters.sortOrder || 'desc';
      
      players.sort((a, b) => {
        const aValue = a[sortBy] || 0;
        const bValue = b[sortBy] || 0;
        
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }
    
    return players;
  }

  async getAllAlliances(filters?: AllianceFilters): Promise<AllianceWithStats[]> {
    let alliances = Array.from(this.alliances.values());
    
    // Apply filters
    if (filters?.server) {
      alliances = alliances.filter(a => a.server === filters.server);
    }
    
    // Calculate average power for each alliance
    const alliancesWithStats: AllianceWithStats[] = alliances.map(alliance => {
      const averagePower = alliance.memberCount > 0 
        ? Math.floor(alliance.totalPower / alliance.memberCount) 
        : 0;
      
      return {
        ...alliance,
        averagePower
      };
    });
    
    // Apply sorting
    if (filters) {
      const sortBy = filters.sortBy || 'totalPower';
      const sortOrder = filters.sortOrder || 'desc';
      
      alliancesWithStats.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        if (sortBy === 'averagePower') {
          aValue = a.averagePower;
          bValue = b.averagePower;
        } else {
          aValue = a[sortBy] || 0;
          bValue = b[sortBy] || 0;
        }
        
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }
    
    return alliancesWithStats;
  }
}

export const storage = new MemStorage();
