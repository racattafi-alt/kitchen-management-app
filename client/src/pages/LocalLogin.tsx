import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat } from "lucide-react";
import { useState, useEffect } from "react";

type Mode = "login" | "register";

interface StoreOption {
  id: string;
  name: string;
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Accesso con Google annullato.",
  google_token_failed: "Errore durante il collegamento con Google. Riprova.",
  google_userinfo_failed: "Impossibile ottenere le informazioni da Google. Riprova.",
  google_no_email: "Il tuo account Google non ha un'email associata.",
  google_auth_failed: "Autenticazione Google fallita. Riprova.",
  apple_cancelled: "Accesso con Apple annullato.",
  apple_auth_failed: "Autenticazione Apple fallita. Riprova.",
  email_already_registered: "Questa email è già registrata con password. Accedi con email e password.",
};

export default function LocalLogin() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeId, setStoreId] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);

  // Controlla disponibilità provider OAuth sul server
  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data: { enabled: boolean }) => setGoogleEnabled(data.enabled))
      .catch(() => setGoogleEnabled(false));

    fetch("/api/auth/apple/status")
      .then((r) => r.json())
      .then((data: { enabled: boolean }) => setAppleEnabled(data.enabled))
      .catch(() => setAppleEnabled(false));
  }, []);

  // Carica i locali disponibili quando si entra in modalità registrazione
  useEffect(() => {
    if (mode === "register" && stores.length === 0) {
      fetch("/api/auth/stores")
        .then((r) => r.json())
        .then((data: StoreOption[]) => {
          setStores(data);
          if (data.length === 1) setStoreId(data[0].id);
        })
        .catch(() => {});
    }
  }, [mode]);

  // Leggi errori OAuth dal query string (es. /login?error=email_already_registered)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || "Errore durante l'accesso. Riprova.");
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (mode === "register" && !storeId) {
      setError("Seleziona il locale in cui lavori.");
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const body: Record<string, string> = {};
    data.forEach((value, key) => {
      body[key] = value as string;
    });

    if (mode === "register") body.storeId = storeId;

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        window.location.href = "/";
        return;
      }

      if (res.status === 409) {
        setError("Questa email è già registrata. Prova ad accedere.");
      } else {
        setError(json.error ?? "Si è verificato un errore. Riprova.");
      }
    } catch {
      setError("Errore di rete. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <ChefHat className="h-10 w-10 text-emerald-600" />
          <span className="text-2xl font-bold text-slate-900">Kitchen Management</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Accedi" : "Crea Account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Inserisci le credenziali per accedere."
                : "Registra un nuovo account per iniziare."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pulsanti OAuth — visibili solo se il server li ha configurati */}
            {(googleEnabled || appleEnabled) && (
              <>
                <div className="space-y-2">
                  {googleEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-3"
                      onClick={() => { window.location.href = "/api/auth/google"; }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continua con Google
                    </Button>
                  )}

                  {appleEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-3 bg-black text-white hover:bg-slate-800 border-black"
                      onClick={() => { window.location.href = "/api/auth/apple"; }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      Continua con Apple
                    </Button>
                  )}
                </div>

                {/* Separatore */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">oppure</span>
                  </div>
                </div>
              </>
            )}

            {/* Form email/password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="name">Nome e Cognome</Label>
                    <Input id="name" name="name" type="text" required placeholder="Mario Rossi" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="storeSelect">Locale di lavoro *</Label>
                    {stores.length === 0 ? (
                      <p className="text-sm text-slate-500">Caricamento locali…</p>
                    ) : (
                      <select
                        id="storeSelect"
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        required
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">— Scegli un locale —</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="mario@example.com" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required placeholder="••••••••" minLength={8} />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Attendere…" : mode === "login" ? "Accedi" : "Crea Account"}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>
                  Non hai un account?{" "}
                  <button
                    type="button"
                    className="text-emerald-600 hover:underline font-medium"
                    onClick={() => { setMode("register"); setError(null); }}
                  >
                    Registrati
                  </button>
                </>
              ) : (
                <>
                  Hai già un account?{" "}
                  <button
                    type="button"
                    className="text-emerald-600 hover:underline font-medium"
                    onClick={() => { setMode("login"); setError(null); }}
                  >
                    Accedi
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
