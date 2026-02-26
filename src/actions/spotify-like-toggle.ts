import streamDeck, { action, SingletonAction, KeyDownEvent, SendToPluginEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { preflight, getPlayer, isTrackSaved, saveTrack, removeTrack, runOAuth } from "../core/spotify-core";

const ACTION_UUID = "com.gilgamesh.spotify-actions.like";

@action({ UUID: ACTION_UUID })
export class SpotifyLikeToggle extends SingletonAction<any> {
    private intervalId?: NodeJS.Timeout;
    private currentTrackId: string = "";
    private isCurrentlyLiked: boolean = false;

    override async onWillAppear(ev: WillAppearEvent<any>) {
        // Sincronización inicial
        await this.syncLikeState(ev);

        // Polling cada 2 segundos
        this.intervalId = setInterval(async () => {
            await this.syncLikeState(ev);
        }, 2000);
    }

    override async onWillDisappear(ev: WillDisappearEvent<any>) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private async syncLikeState(ev: any) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);
            const trackId = player?.item?.id;

            if (!trackId) {
                if (this.currentTrackId !== "") {
                    this.currentTrackId = "";
                    await ev.action.setImage("imgs/actions/dislike.png");
                }
                return;
            }

            // Si la canción cambió o es la primera vez, verificamos el estado de Like
            if (trackId !== this.currentTrackId) {
                const liked = await isTrackSaved(accessToken, trackId);
                this.currentTrackId = trackId;
                this.isCurrentlyLiked = liked;
                await ev.action.setImage(liked ? "imgs/actions/like.png" : "imgs/actions/dislike.png");
            } else {
                // Opcional: Verificar si el estado de Like cambió en la misma canción (vía móvil)
                // Para no saturar la API, podrías hacer esto solo cada 2 ciclos
                const liked = await isTrackSaved(accessToken, trackId);
                if (liked !== this.isCurrentlyLiked) {
                    this.isCurrentlyLiked = liked;
                    await ev.action.setImage(liked ? "imgs/actions/like.png" : "imgs/actions/dislike.png");
                }
            }
        } catch (e) {
            // Error silencioso en polling
        }
    }

    override async onKeyDown(ev: KeyDownEvent<any>) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);
            const trackId = player?.item?.id;

            if (!trackId) {
                await ev.action.showAlert();
                return;
            }

            // Cambiamos el estado
            if (this.isCurrentlyLiked) {
                await removeTrack(accessToken, trackId);
                this.isCurrentlyLiked = false;
                await ev.action.setImage("imgs/actions/dislike.png");
            } else {
                await saveTrack(accessToken, trackId);
                this.isCurrentlyLiked = true;
                await ev.action.setImage("imgs/actions/like.png");
            }
        } catch (e: any) {
            streamDeck.logger.error(String(e));
            await ev.action.showAlert();
        }
    }

    override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
        if (ev.payload?.event !== "spotify_auth_start") return;
        try {
            const refreshToken = await runOAuth();
            await streamDeck.ui.sendToPropertyInspector({ event: "spotify_auth_done", refreshToken });
        } catch (e: any) {
            await ev.action.showAlert();
        }
    }
}