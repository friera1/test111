import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Получаем токен из localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Сохраняем токен в localStorage
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

// Удаляем токен из localStorage
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Sending API request: ${method} ${url}`);
  
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "Accept": "application/json"
  };
  
  // Добавляем токен авторизации, если он есть
  const token = getAuthToken();
  if (token) {
    console.log("Adding auth token to request");
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.log("No auth token available");
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Оставляем для поддержки сессий
  });

  console.log(`API response status: ${res.status}`);
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query request: ${queryKey[0]}`);
    
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    
    // Добавляем токен авторизации, если он есть
    const token = getAuthToken();
    if (token) {
      console.log("Adding auth token to query request");
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Оставляем для совместимости
      headers
    });
    
    console.log(`Query response status: ${res.status} for ${queryKey[0]}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Returning null for 401 response (${queryKey[0]})`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
