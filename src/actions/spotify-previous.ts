

import streamDeck, { action, SingletonAction, KeyDownEvent, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { preflight, getPlayer, runOAuth, previous } from "../core/spotify-core";

const ACTION_UUID = "com.gilgamesh.spotify-actions.previous";

@action({ UUID: ACTION_UUID })
export class SpotifyPrevious extends SingletonAction<any> {
    /**
     * Se ejecuta automáticamente cuando el botón aparece en el Stream Deck
     */
    override async onWillAppear(ev: WillAppearEvent<any>) {
        try {
            // Opcional: Puedes verificar el estado actual de Spotify al cargar
            // const { accessToken } = await preflight();
            // const player = await getPlayer(accessToken);
            // const isPlaying = !!player?.is_playing;

            // Establece el icono/texto inicial
            await ev.action.setImage("imgs/actions/previous.jpg");
        } catch (e) {
            // Si no hay auth o hay error, ponemos un estado neutro
            await ev.action.setImage("imgs/actions/previous.png");
        }
    }

    override async onKeyDown(ev: KeyDownEvent<any>) {
        try {
            const { accessToken } = await preflight();

            const player = await getPlayer(accessToken);
            const isPlaying = !!player?.is_playing;

            await previous(accessToken);

            await ev.action.setImage("imgs/actions/previous.jpg");
            // await (ev.action as any).showOk?.();
        } catch (e: any) {
            if (String(e?.message) === "NOT_AUTH") {
                await (ev.action as any).setTitle?.("SET");
            } else {
                streamDeck.logger.error(String(e));
                await (ev.action as any).setTitle?.("ERR");
            }
            await (ev.action as any).showAlert?.();
        }
    }

    // Recibe el evento de PI: spotify_auth_start
    override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
        if (ev.payload?.event !== "spotify_auth_start") return;

        try {
            await (ev.action as any).setTitle?.("AUTH");
            const refreshToken = await runOAuth();

            await streamDeck.ui.sendToPropertyInspector({
                event: "spotify_auth_done",
                refreshToken
            });

            await (ev.action as any).setImage("imgs/actions/previous.jpg");
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
