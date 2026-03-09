import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import * as storesDb from "../storesDb";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getRedirectUri(req: Request): string {
  const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${protocol}://${host}/api/auth/google/callback`;
}

export function registerGoogleAuthRoutes(app: Express) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Endpoint pubblico: il client controlla se Google auth è abilitato
  app.get("/api/auth/google/status", (_req: Request, res: Response) => {
    res.json({ enabled: !!(clientId && clientSecret) });
  });

  if (!clientId || !clientSecret) {
    console.log("[Google Auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google login disabled");
    return;
  }

  // Avvia il flusso OAuth con Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/auth?${params.toString()}`);
  });

  // Callback OAuth Google
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error || !code) {
      console.error("[Google Auth] OAuth error:", error);
      return res.redirect("/login?error=google_cancelled");
    }

    try {
      const redirectUri = getRedirectUri(req);

      // Scambia il codice per un token di accesso
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Google Auth] Token exchange failed:", errBody);
        return res.redirect("/login?error=google_token_failed");
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        id_token?: string;
      };

      // Recupera le informazioni dell'utente da Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        console.error("[Google Auth] userinfo failed:", userInfoRes.status);
        return res.redirect("/login?error=google_userinfo_failed");
      }

      const userInfo = (await userInfoRes.json()) as {
        id: string;
        email: string;
        name?: string;
        given_name?: string;
      };

      const { email, name, id: googleId } = userInfo;

      if (!email) {
        return res.redirect("/login?error=google_no_email");
      }

      // Controlla se esiste già un utente con questa email ma metodo login diverso
      const existingUser = await db.getUserByEmail(email);
      if (existingUser && existingUser.loginMethod !== "google" && existingUser.loginMethod !== null) {
        // Email già registrata con password locale — blocca e avvisa
        return res.redirect("/login?error=email_already_registered");
      }

      const openId = `google:${googleId}`;

      // Crea o aggiorna l'utente (prima registrazione diventa admin)
      const userCount = await db.countUsers();
      const role = (existingUser ? existingUser.role : (userCount === 0 ? "admin" : "user")) as "admin" | "user" | "manager" | "cook";

      await db.upsertUser({
        openId,
        name: name || email.split("@")[0],
        email,
        loginMethod: "google",
        role,
        lastSignedIn: new Date(),
      });

      // Assegna lo store al nuovo utente Google se non ne ha già uno
      const user = await db.getUserByOpenId(openId);
      if (user && !user.preferredStoreId) {
        const allStores = await storesDb.getAllStores();
        if (allStores.length > 0) {
          await storesDb.addUserToStore(user.id, allStores[0].id, "user");
          await storesDb.setUserPreferredStore(user.id, allStores[0].id);
        }
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect("/");
    } catch (err) {
      console.error("[Google Auth] Callback error:", err);
      res.redirect("/login?error=google_auth_failed");
    }
  });
}
