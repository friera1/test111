import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const gameProfiles = pgTable("game_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: text("character_id").notNull(),
  nickname: text("nickname").notNull(),
  server: text("server"),
  alliance: text("alliance"),
  level: integer("level"),
  powerNow: integer("power_now"),
  powerMax: integer("power_max"),
  hiddenPower: integer("hidden_power"),
});

export const alliances = pgTable("alliances", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  server: text("server").notNull(),
  memberCount: integer("member_count").default(0),
  totalPower: integer("total_power").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertGameProfileSchema = createInsertSchema(gameProfiles).pick({
  userId: true,
  characterId: true,
  nickname: true,
  server: true,
  alliance: true,
  level: true,
  powerNow: true,
  powerMax: true,
  hiddenPower: true,
});

export const updateGameProfileSchema = z.object({
  alliance: z.string().optional(),
});

export const gameDataSchema = z.object({
  characterId: z.string(),
  nickname: z.string(),
  server: z.string().optional(),
  alliance: z.string().optional(),
  level: z.number().optional(),
  powerNow: z.number().optional(),
  powerMax: z.number().optional(),
  hiddenPower: z.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGameProfile = z.infer<typeof insertGameProfileSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
export type User = typeof users.$inferSelect;
export type GameProfile = typeof gameProfiles.$inferSelect;
export type Alliance = typeof alliances.$inferSelect;
