import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(stored: string, supplied: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  const hash = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const storedHashBuf = Buffer.from(storedHash, "hex");
  return timingSafeEqual(hash, storedHashBuf);
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const userCount = await db.countUsers();
      const role = userCount === 0 ? "admin" : "user";
      const openId = `local:${email}`;

      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "local",
        role,
        lastSignedIn: new Date(),
      });

      const newUser = await db.getUserByEmail(email);
      if (!newUser) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const hash = await hashPassword(password);
      await db.updateUserPasswordHash(newUser.id, hash);

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[LocalAuth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
}
