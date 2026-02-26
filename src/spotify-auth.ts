import http from "http";
import { URL } from "url";
import fetch from "node-fetch";
import streamDeck from "@elgato/streamdeck";
import { exec } from "node:child_process"; // Para abrir en Windows/Mac

export type SpotifyAuthConfig = {
    clientId: string;
    clientSecret: string;
    redirectUri: string; // ej: http://127.0.0.1:4399/callback
    scopes: string[];
};

export async function startSpotifyAuth(cfg: SpotifyAuthConfig): Promise<{ refreshToken: string }> {
    const { clientId, clientSecret, redirectUri, scopes } = cfg;

    const redirect = new URL(redirectUri);
    const port = Number(redirect.port || "4399");

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(" "));
    exec(`start "" "${authUrl.toString()}"`);

    const code = await waitForAuthCode(port, redirect.pathname);

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", { // URL Real
        method: "POST",
        headers: {
            "Authorization": `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        }).toString() // Asegúrate de enviarlo como string
    });

    if (!tokenRes.ok) {
        const errorBody = await tokenRes.text().catch(() => "");
        let errorMessage = `Status ${tokenRes.status}`;
        try {
            const json = JSON.parse(errorBody);
            errorMessage = json.error_description || json.error || errorMessage;
        } catch {
            errorMessage = errorBody || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const json: any = await tokenRes.json();

    if (!json.refresh_token) {
        throw new Error("No refresh_token returned (revisa scopes y redirect URI).");
    }

    return { refreshToken: json.refresh_token };
}

function waitForAuthCode(port: number, callbackPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            try {
                if (!req.url) return;

                const u = new URL(req.url, `http://127.0.0.1:${port}`);
                if (u.pathname !== callbackPath) {
                    res.writeHead(200); res.end("OK"); return;
                }

                const err = u.searchParams.get("error");
                const code = u.searchParams.get("code");

                if (err) {
                    res.writeHead(200); res.end("Auth error. You can close this tab.");
                    server.close();
                    reject(new Error(err));
                    return;
                }

                if (!code) {
                    res.writeHead(200); res.end("No code received. You can close this tab.");
                    server.close();
                    reject(new Error("No code received"));
                    return;
                }

                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("Authorized. You can close this tab and return to Stream Deck.");

                server.close();
                resolve(code);
            } catch (e: any) {
                server.close();
                reject(e);
            }
        });

        server.listen(port, "127.0.0.1");
    });
}

export function buildSpotifyAuthorizeUrl(
    clientId: string,
    redirectUri: string,
    scopes: string[],
    forceDialog = true
) {
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(" "));
    if (forceDialog) authUrl.searchParams.set("show_dialog", "true");

    return authUrl.toString();
}
