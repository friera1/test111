// This file wraps the game data fetching functionality from Stop.html
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CryptoJS from "crypto-js";
import { getAuthToken } from "./queryClient";

interface GameProfile {
  server: string;
  level: number;
  power_now: number;
  power_max: number;
  poten: number;
}

interface FetchGameDataResult {
  isLoading: boolean;
  error: string | null;
  getGameData: (id: string, name: string) => Promise<GameProfile | null>;
}

export function useGameApi(): FetchGameDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to convert string to binary
  function toBinaryStr(str: string) {
    const encoder = new TextEncoder();
    const charCodes = encoder.encode(str);
    let result = '';
    charCodes.forEach(code => {
      result += String.fromCharCode(code);
    });
    return result;
  }

  // HMAC SHA256 function
  function hmacSHA256(message: string, key: string) {
    return CryptoJS.HmacSHA256(message, key).toString();
  }

  // Wrapping the game API functionality from Stop.html
  async function getGameData(id: string, name: string): Promise<GameProfile | null> {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Getting game data for ID:", id, "Name:", name);
      const secret = '20f7b2cf273b085bd1fc0e2463dba668';
      const params = {
        character_id: id,
        nickname: name
      };

      const paramsStr = JSON.stringify(params);
      const paramsBase64 = btoa(toBinaryStr(paramsStr));
      const sign = hmacSHA256(paramsStr, secret);
      
      console.log("Generated signature for API request:", sign);

      // First API call to get token
      const tokenResponse = await getToken(paramsBase64, sign);
      console.log("Token response:", tokenResponse);

      if (!tokenResponse || !tokenResponse.lite_token) {
        throw new Error("Failed to get authentication token");
      }

      // Second API call to get player info
      const gameData = await getPlayerInfo(tokenResponse.lite_token);
      console.log("Game data response:", gameData);
      
      if (!gameData) {
        throw new Error("Failed to get player information");
      }

      // Parse game data
      const meta = JSON.parse(gameData.meta_info);
      console.log("Parsed meta info:", meta);
      
      const gameProfile: GameProfile = {
        server: gameData.server_id,
        level: meta.cityLvl,
        power_now: meta.power,
        power_max: meta.maxPower,
        poten: meta.maxPower - meta.power
      };
      
      console.log("Created game profile:", gameProfile);
      return gameProfile;
    } catch (err) {
      console.error("Error in getGameData:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error fetching game data",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to get token through our server proxy
  async function getToken(paramsBase64: string, sign: string) {
    try {
      const url = '/api/game/token';
      
      console.log("Requesting token through proxy:", url);
      console.log("With payload:", paramsBase64);
      console.log("And signature:", sign);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Добавляем токен авторизации, если он есть
      const authToken = getAuthToken();
      if (authToken) {
        console.log("Adding auth token to game token request");
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          encoded_payload: paramsBase64,
          sign: sign
        }),
        credentials: 'include' // Для поддержки сессий
      });
      
      console.log("Token response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token API error text:", errorText);
        throw new Error(`Token API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getToken:", error);
      throw error;
    }
  }

  // Helper function to get player info through our server proxy
  async function getPlayerInfo(token: string) {
    try {
      const url = `/api/game/info?lite_token=${encodeURIComponent(token)}`;
      
      console.log("Requesting player info through proxy:", url);
      
      const headers: Record<string, string> = {};
      
      // Добавляем токен авторизации, если он есть
      const authToken = getAuthToken();
      if (authToken) {
        console.log("Adding auth token to game info request");
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include' // Для поддержки сессий
      });
      
      console.log("Player info response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Player info API error text:", errorText);
        throw new Error(`Player info API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getPlayerInfo:", error);
      throw error;
    }
  }

  return {
    isLoading,
    error,
    getGameData
  };
}
