import streamDeck from "@elgato/streamdeck";
import fetch from "node-fetch";
import { spotifyFetch } from "./spotify-api";
import { openSpotifyIfNeeded, sleep } from "./spotify-open";
import { buildSpotifyAuthorizeUrl, startSpotifyAuth } from "../spotify-auth";
import { exec } from "node:child_process";

export type SpotifyGlobal = {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;

};

const REDIRECT_URI = "http://127.0.0.1:4399/callback";
const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-library-read",
    "user-library-modify"
];

// cache simple en memoria (por sesión del plugin)
let cachedAccessToken = "";
let cachedAccessExp = 0;

export async function getGlobal(): Promise<SpotifyGlobal> {
    return (await streamDeck.settings.getGlobalSettings()) as any;
}

export async function setGlobal(g: SpotifyGlobal) {
    await streamDeck.settings.setGlobalSettings(g as any);
}

export function hasCreds(g: SpotifyGlobal) {
    return !!(g?.clientId && g?.clientSecret);
}

export function hasAuth(g: SpotifyGlobal) {
    return !!(g?.clientId && g?.clientSecret && g?.refreshToken);
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
        }).toString()
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`refreshAccessToken failed: ${res.status} ${t}`);
    }

    const json: any = await res.json();
    const token = json.access_token as string;
    const expiresIn = Number(json.expires_in ?? 3600);

    cachedAccessToken = token;
    cachedAccessExp = Date.now() + (expiresIn - 60) * 1000; // 60s margen
    return token;
}

export async function getAccessToken(): Promise<string> {
    const g = await getGlobal();
    if (!hasAuth(g)) throw new Error("NOT_AUTH");

    if (cachedAccessToken && Date.now() < cachedAccessExp) return cachedAccessToken;
    return refreshAccessToken(g.clientId!, g.clientSecret!, g.refreshToken!);
}

/**
 * Preflight común:
 * - valida auth
 * - abre spotify
 * - obtiene access token
 */
export async function preflight(): Promise<{ accessToken: string }> {
    const g = await getGlobal();
    if (!hasAuth(g)) throw new Error("NOT_AUTH");

    await openSpotifyIfNeeded();
    await sleep(900); // pequeño delay para que el cliente levante

    const accessToken = await getAccessToken();
    return { accessToken };
}

/** OAuth: se dispara desde PI por sendToPlugin */
export async function runOAuth(): Promise<string> {
    const g = await getGlobal();
    if (!hasCreds(g)) throw new Error("MISSING_CREDS");

    const authorizeUrl = buildSpotifyAuthorizeUrl(g.clientId!, REDIRECT_URI, SCOPES, true);
    const sys = (streamDeck as any).system;

    if (sys?.openUrl) await sys.openUrl(authorizeUrl);
    else exec(`start "" "${authorizeUrl}"`);

    const { refreshToken } = await startSpotifyAuth({
        clientId: g.clientId!,
        clientSecret: g.clientSecret!,
        redirectUri: REDIRECT_URI,
        scopes: SCOPES
    });

    await setGlobal({ ...g, refreshToken });
    cachedAccessToken = "";
    cachedAccessExp = 0;

    return refreshToken;
}

/** Player State mínimo */
type PlayerState = {
    is_playing: boolean;
    progress_ms?: number;    // Para calcular adelantos/atrasos (+5s)
    shuffle_state?: boolean; // Para saber si el aleatorio está activo
    repeat_state?: "track" | "context" | "off";
    item?: { id?: string; type?: string; name?: string };
    device?: {
        id?: string;
        is_active?: boolean;
        name?: string;
        volume_percent?: number;    // Para calcular adelantos/atrasos (+5s)
    };

};

export async function getPlayer(accessToken: string): Promise<PlayerState | null> {
    const r = await spotifyFetch(accessToken, "GET", "https://api.spotify.com/v1/me/player");
    if (r.status === 204) return null;
    if (r.status >= 400) throw new Error(`getPlayer failed: ${r.status}`);
    return r.data as PlayerState;
}

export async function play(accessToken: string) {
    const r = await spotifyFetch(accessToken, "PUT", "https://api.spotify.com/v1/me/player/play");
    if (r.status >= 400 && r.status !== 204) throw new Error(`play failed: ${r.status}`);
}

export async function pause(accessToken: string) {
    const r = await spotifyFetch(accessToken, "PUT", "https://api.spotify.com/v1/me/player/pause");
    if (r.status >= 400 && r.status !== 204) throw new Error(`pause failed: ${r.status}`);
}

export async function next(accessToken: string) {
    const r = await spotifyFetch(accessToken, "POST", "https://api.spotify.com/v1/me/player/next");
    if (r.status >= 400 && r.status !== 204) throw new Error(`pause failed: ${r.status}`);
}

export async function previous(accessToken: string) {
    const r = await spotifyFetch(accessToken, "POST", "https://api.spotify.com/v1/me/player/previous");
    if (r.status >= 400 && r.status !== 204) throw new Error(`pause failed: ${r.status}`);
}

export async function isTrackSaved(accessToken: string, trackId: string): Promise<boolean> {
    const r = await spotifyFetch(
        accessToken,
        "GET",
        `https://api.spotify.com/v1/me/tracks/contains?ids=${encodeURIComponent(trackId)}`
    );
    if (r.status >= 400) throw new Error(`contains failed: ${r.status}`);
    return Array.isArray(r.data) ? !!r.data[0] : false;
}

export async function saveTrack(accessToken: string, trackId: string) {
    const r = await spotifyFetch(
        accessToken,
        "PUT",
        `https://api.spotify.com/v1/me/tracks?ids=${encodeURIComponent(trackId)}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`saveTrack failed: ${r.status}`);
}

export async function removeTrack(accessToken: string, trackId: string) {
    const r = await spotifyFetch(
        accessToken,
        "DELETE",
        `https://api.spotify.com/v1/me/tracks?ids=${encodeURIComponent(trackId)}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`removeTrack failed: ${r.status}`);
}

/** * Mueve la posición de la canción (en milisegundos)
 * Endpoint: me/player/seek
 */
export async function seek(accessToken: string, positionMs: number) {
    const r = await spotifyFetch(
        accessToken,
        "PUT",
        `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`seek failed: ${r.status}`);
}

/** * Ajusta el volumen (0 a 100)
 * Endpoint: me/player/volume?volume_percent=X
 */
export async function setVolume(accessToken: string, volumePercent: number) {
    const r = await spotifyFetch(
        accessToken,
        "PUT",
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`volume failed: ${r.status}`);
}

/** * Activa/Desactiva el modo aleatorio
 * Endpoint: me/player/shuffle?state=true/false
 */
export async function setShuffle(accessToken: string, state: boolean) {
    const r = await spotifyFetch(
        accessToken,
        "PUT",
        `https://api.spotify.com/v1/me/player/shuffle?state=${state}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`shuffle failed: ${r.status}`);
}

/** * Cambia el modo de repetición
 * Endpoint: me/player/repeat?state=track/context/off
 */
export async function setRepeat(accessToken: string, mode: "track" | "context" | "off") {
    const r = await spotifyFetch(
        accessToken,
        "PUT",
        `https://api.spotify.com/v1/me/player/repeat?state=${mode}`
    );
    if (r.status >= 400 && r.status !== 204) throw new Error(`repeat failed: ${r.status}`);
}
