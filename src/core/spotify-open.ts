import streamDeck from "@elgato/streamdeck";
import { exec } from "node:child_process";

export async function openSpotifyIfNeeded() {
    try {
        const sys = (streamDeck as any).system;
        if (sys?.openUrl) await sys.openUrl("spotify:");
        else exec(`start "" "spotify:"`);
    } catch {
        // fallback store app
        try {
            exec(`start "" "shell:AppsFolder\\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify"`);
        } catch { }
    }
}

export function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}
