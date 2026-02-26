import streamDeck, { action, SingletonAction, KeyDownEvent, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { preflight, getPlayer, runOAuth, seek } from "../core/spotify-core";

const ACTION_UUID = "com.gilgamesh.spotify-actions.seek-backward";

@action({ UUID: ACTION_UUID })
export class SpotifySeekBackward extends SingletonAction<any> {

    override async onWillAppear(ev: WillAppearEvent<any>) {
        await ev.action.setImage(`imgs/actions/seek-.jpg`);
    }

    override async onKeyDown(ev: KeyDownEvent<any>) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);

            // Verificamos que haya una canción reproduciéndose y tengamos el progreso
            if (player && typeof player.progress_ms === "number") {
                // Calculamos la nueva posición (asegurando que no sea menor a 0)
                const newPosition = Math.max(0, player.progress_ms - 5000);

                await seek(accessToken, newPosition);
                // await ev.action.showOk();
            } else {
                // Si no hay nada reproduciéndose
                await ev.action.showAlert();
            }
        } catch (e: any) {
            this.handleError(ev, e);
        }
    }

    private async handleError(ev: KeyDownEvent<any>, e: any) {
        if (String(e?.message) === "NOT_AUTH") {
            await ev.action.setTitle("SET");
        } else {
            streamDeck.logger.error(String(e));
            await ev.action.setTitle("ERR");
        }
        await ev.action.showAlert();
    }

    override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
        if (ev.payload?.event !== "spotify_auth_start") return;

        try {
            await (ev.action as any).setTitle?.("AUTH");
            const refreshToken = await runOAuth();

            await streamDeck.ui.sendToPropertyInspector({
                event: "spotify_auth_done",
                refreshToken
            });

            await (ev.action as any).setImage("imgs/actions/seek-.jpg");
            await (ev.action as any).showOk?.();
        } catch (e: any) {
            await streamDeck.ui.sendToPropertyInspector({
                event: "spotify_auth_error",
                message: String(e.message || e)
            });
            streamDeck.logger.error(String(e));
            await (ev.action as any).setTitle?.("ERR");
            await (ev.action as any).showAlert?.();
        }
    }
}