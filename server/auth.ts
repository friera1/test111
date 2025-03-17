import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Сохраняем активные сессии в памяти
const activeTokens = new Map<string, number>(); // token -> userId

export function setupAuth(app: Express) {
  // Упрощенная версия сессии для Replit
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "gamesttats-secret-key",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: false,
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Middleware для проверки токена
  app.use((req, res, next) => {
    // Если пользователь уже аутентифицирован через сессию, пропускаем
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Проверяем токен
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && activeTokens.has(token)) {
      const userId = activeTokens.get(token)!;
      storage.getUser(userId).then(user => {
        if (user) {
          req.login(user, (err) => {
            if (err) {
              console.error("Error logging in with token:", err);
              return next();
            }
            console.log("User authenticated via token:", userId);
            next();
          });
        } else {
          next();
        }
      }).catch(err => {
        console.error("Error getting user by token:", err);
        next();
      });
    } else {
      next();
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("Registration attempt:", req.body.username);
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      console.log("Username already exists:", req.body.username);
      return res.status(400).send("Username already exists");
    }

    try {
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      console.log("User created:", user.id, user.username);

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        console.log("User authenticated after registration:", req.isAuthenticated());
        console.log("Session ID:", req.sessionID);
        
        // Save session explicitly to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return next(err);
          }
          // Генерируем токен авторизации
          const token = randomBytes(32).toString('hex');
          activeTokens.set(token, user.id);
          console.log("Generated token for new user:", user.id, token);
          
          const { password, ...userWithoutPassword } = user;
          res.status(201).json({
            ...userWithoutPassword,
            token // Отправляем токен клиенту
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).send("Registration failed");
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("User authenticated on login:", req.isAuthenticated());
    console.log("Session ID:", req.sessionID);
    
    // Генерируем токен авторизации
    const token = randomBytes(32).toString('hex');
    activeTokens.set(token, req.user!.id);
    console.log("Generated token for user:", req.user!.id, token);
    
    // Save session explicitly after login
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Login failed - session error");
      }
      const { password, ...userWithoutPassword } = req.user!;
      res.status(200).json({
        ...userWithoutPassword,
        token // Отправляем токен клиенту
      });
    });
  });

  app.post("/api/logout", (req, res, next) => {
    // Удаляем токен из активных
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      console.log("Removing token on logout:", token);
      activeTokens.delete(token);
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    // Сначала проверяем токен
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && activeTokens.has(token)) {
      const userId = activeTokens.get(token)!;
      console.log("Found user by token:", userId);
      
      const user = await storage.getUser(userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
    }
    
    // Если токен не валиден, проверяем сессию
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user!;
      return res.json(userWithoutPassword);
    }
    
    return res.sendStatus(401);
  });
  
  // Экспортируем функцию и карту токенов для использования в routes.ts
  (app as any).activeTokens = activeTokens;
  (app as any).authUtils = {
    getUserByToken: async (token: string) => {
      if (activeTokens.has(token)) {
        const userId = activeTokens.get(token)!;
        return await storage.getUser(userId);
      }
      return undefined;
    }
  };
}
