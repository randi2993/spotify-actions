

import streamDeck, { action, SingletonAction, KeyDownEvent, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import {
    preflight, getPlayer, isTrackSaved, saveTrack, removeTrack, runOAuth
} from "../core/spotify-core";

const ACTION_UUID = "com.gilgamesh.spotify-actions.open";

@action({ UUID: ACTION_UUID })
export class SpotifyOpen extends SingletonAction<any> {
    /**
     * Se ejecuta automáticamente cuando el botón aparece en el Stream Deck
     */
    override async onWillAppear(ev: WillAppearEvent<any>) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);
            const trackId = player?.item?.id;

            if (!trackId) {
                // Si no hay nada sonando, ponemos el icono neutro o dislike
                await ev.action.setImage("imgs/actions/dislike.jpg");
                return;
            }

            const liked = await isTrackSaved(accessToken, trackId);
            await (ev.action as any).setTitle?.("");
            await ev.action.setImage(liked ? "imgs/actions/like.jpg" : "imgs/actions/dislike.jpg");
        } catch (e) {
            // Estado por defecto si no hay auth o hay error
            await ev.action.setImage("imgs/actions/dislike.jpg");
        }
    }

    override async onKeyDown(ev: KeyDownEvent<any>) {
        try {
            const { accessToken } = await preflight();

            const player = await getPlayer(accessToken);
            const trackId = player?.item?.id;

            if (!trackId) {
                await (ev.action as any).setTitle?.("NO");
                await (ev.action as any).showAlert?.();
                return;
            }

            const liked = await isTrackSaved(accessToken, trackId);

            if (liked) {
                await removeTrack(accessToken, trackId);
                await (ev.action as any).setTitle?.("");
                await ev.action.setImage("imgs/actions/dislike.jpg");
            } else {
                await saveTrack(accessToken, trackId);
                await (ev.action as any).setTitle?.("");
                await ev.action.setImage("imgs/actions/like.jpg");
            }
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

    override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
        if (ev.payload?.event !== "spotify_auth_start") return;

        try {
            await (ev.action as any).setTitle?.("AUTH");
            const refreshToken = await runOAuth();

            await streamDeck.ui.sendToPropertyInspector({
                event: "spotify_auth_done",
                refreshToken
            });

            await (ev.action as any).setTitle?.("");
            await (ev.action as any).setImage("imgs/actions/like-dislike.png");
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
