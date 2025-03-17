import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, setAuthToken, removeAuthToken, getAuthToken } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  email: string;
  token?: string; // Добавлен токен
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Проверяем наличие токена в localStorage при первом рендере
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      console.log("Found existing auth token in localStorage");
      // Токен уже добавляется автоматически в запросы через getQueryFn
    }
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Сохраняем токен, если он пришел с сервера
      if (userData.token) {
        console.log("Storing auth token after login:", userData.token.substring(0, 10) + "...");
        setAuthToken(userData.token);
        
        // Удаляем токен из объекта пользователя перед сохранением в кэш
        const { token, ...userWithoutToken } = userData;
        queryClient.setQueryData(["/api/user"], userWithoutToken);
      } else {
        console.warn("No token received during login");
        queryClient.setQueryData(["/api/user"], userData);
      }
      
      setLocation("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const validatedData = insertUserSchema.parse(data);
      const res = await apiRequest("POST", "/api/register", validatedData);
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Сохраняем токен, если он пришел с сервера
      if (userData.token) {
        console.log("Storing auth token after registration:", userData.token.substring(0, 10) + "...");
        setAuthToken(userData.token);
        
        // Удаляем токен из объекта пользователя перед сохранением в кэш
        const { token, ...userWithoutToken } = userData;
        queryClient.setQueryData(["/api/user"], userWithoutToken);
      } else {
        console.warn("No token received during registration");
        queryClient.setQueryData(["/api/user"], userData);
      }
      
      setLocation("/");
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Удаляем токен при выходе
      removeAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
