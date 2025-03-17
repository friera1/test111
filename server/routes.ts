import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updateGameProfileSchema, gameDataSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import FormData from "form-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Game profile API
  app.get("/api/profile", async (req, res) => {
    console.log("Received request to /api/profile");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Session:", req.sessionID);
    console.log("Authorization header:", req.headers.authorization ? "Present" : "Not present");
    
    let userId: number;
    
    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }
    
    const profile = await storage.getGameProfile(userId);
    
    console.log("User profile from storage:", profile);
    
    if (!profile) {
      console.log("No profile found for user:", userId);
      return res.status(404).json({ message: "Profile not found" });
    }
    
    res.json(profile);
  });
  
  app.post("/api/profile/game-data", async (req, res) => {
    console.log("Received request to /api/profile/game-data");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Session:", req.sessionID);
    
    let userId: number;
    
    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }
    
    try {
      console.log("Game data payload:", req.body);
      const gameData = gameDataSchema.parse(req.body);
      
      // Check if profile exists
      let profile = await storage.getGameProfile(userId);
      console.log("Existing profile:", profile);
      
      if (profile) {
        // Update existing profile
        console.log("Updating profile for user:", userId);
        profile = await storage.updateGameProfile(profile.id, {
          server: gameData.server,
          alliance: gameData.alliance,
          level: gameData.level,
          powerNow: gameData.powerNow,
          powerMax: gameData.powerMax,
          hiddenPower: gameData.hiddenPower,
        });
      } else {
        // Create new profile
        console.log("Creating new profile for user:", userId);
        profile = await storage.createGameProfile({
          userId,
          characterId: gameData.characterId,
          nickname: gameData.nickname,
          server: gameData.server,
          alliance: gameData.alliance,
          level: gameData.level,
          powerNow: gameData.powerNow,
          powerMax: gameData.powerMax,
          hiddenPower: gameData.hiddenPower,
        });
      }
      
      console.log("Profile saved successfully:", profile);
      res.status(200).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid game data", 
          errors: error.errors 
        });
      }
      
      console.error("Error saving game data:", error);
      res.status(500).json({ message: "Failed to save game data" });
    }
  });
  
  app.patch("/api/profile/alliance", async (req, res) => {
    console.log("Received request to update alliance");
    console.log("Auth status:", req.isAuthenticated());
    console.log("Authorization header:", req.headers.authorization ? "Present" : "Not present");
    
    let userId: number;
    
    // Проверяем токен в заголовке Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && (app as any).activeTokens && (app as any).activeTokens.has(token)) {
      userId = (app as any).activeTokens.get(token);
      console.log("User authenticated via token:", userId);
    } else if (req.isAuthenticated()) {
      // Если токен не предоставлен, используем сессию
      userId = req.user!.id;
      console.log("User authenticated via session:", userId, req.user!.username);
    } else {
      console.log("User not authenticated - sending 401");
      return res.sendStatus(401);
    }
    
    try {
      const updateData = updateGameProfileSchema.parse(req.body);
      console.log("Alliance update data:", updateData);
      
      // Get profile
      const profile = await storage.getGameProfile(userId);
      
      if (!profile) {
        console.log("Profile not found for user:", userId);
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Update alliance
      console.log("Updating alliance for profile:", profile.id);
      const updatedProfile = await storage.updateGameProfile(profile.id, {
        alliance: updateData.alliance
      });
      
      console.log("Alliance updated successfully:", updatedProfile);
      res.status(200).json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors 
        });
      }
      
      console.error("Error updating alliance:", error);
      res.status(500).json({ message: "Failed to update alliance" });
    }
  });
  
  // Player rankings API
  app.get("/api/rankings/players", async (req, res) => {
    try {
      const { server, alliance, sortBy, sortOrder } = req.query;
      
      const filters = {
        server: server as string | undefined,
        alliance: alliance as string | undefined,
        sortBy: (sortBy as 'powerNow' | 'powerMax' | 'level' | undefined) || 'powerNow',
        sortOrder: (sortOrder as 'asc' | 'desc' | undefined) || 'desc'
      };
      
      const players = await storage.getAllPlayers(filters);
      res.json(players);
    } catch (error) {
      console.error("Error fetching player rankings:", error);
      res.status(500).json({ message: "Failed to fetch player rankings" });
    }
  });
  
  // Alliance rankings API
  app.get("/api/rankings/alliances", async (req, res) => {
    try {
      const { server, sortBy, sortOrder } = req.query;
      
      const filters = {
        server: server as string | undefined,
        sortBy: (sortBy as 'totalPower' | 'memberCount' | 'averagePower' | undefined) || 'totalPower',
        sortOrder: (sortOrder as 'asc' | 'desc' | undefined) || 'desc'
      };
      
      const alliances = await storage.getAllAlliances(filters);
      res.json(alliances);
    } catch (error) {
      console.error("Error fetching alliance rankings:", error);
      res.status(500).json({ message: "Failed to fetch alliance rankings" });
    }
  });
  
  // Proxy API for the game
  app.post("/api/game/token", async (req, res) => {
    try {
      const { encoded_payload, sign } = req.body;
      
      if (!encoded_payload || !sign) {
        return res.status(400).json({ error: "Missing parameters" });
      }
      
      const addr = 'https://5c7021242c10k1d2.tap4hub.com:10443';
      const url = addr + '/tgs/gateway2/character/litetoken?client_id=k1d2:oap.1.0.0';
      
      console.log("Proxying token request to:", url);
      
      const formData = new FormData();
      formData.append("encoded_payload", encoded_payload);
      formData.append("sign", sign);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData as any,
        // @ts-ignore
        headers: {
          ...formData.getHeaders()
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Token API error:", response.status, text);
        return res.status(response.status).send(text);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in game token proxy:", error);
      res.status(500).json({ error: "Failed to get game token" });
    }
  });
  
  app.get("/api/game/info", async (req, res) => {
    try {
      const { lite_token } = req.query;
      
      if (!lite_token) {
        return res.status(400).json({ error: "Missing token parameter" });
      }
      
      const addr = 'https://5c7021242c10k1d2.tap4hub.com:10443';
      const url = `${addr}/tgs/gateway2/oap/character/info?lite_token=${encodeURIComponent(lite_token as string)}&client_id=k1d2:oap.1.0.0`;
      
      console.log("Proxying game info request to:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Game info API error:", response.status, text);
        return res.status(response.status).send(text);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error in game info proxy:", error);
      res.status(500).json({ error: "Failed to get game info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
