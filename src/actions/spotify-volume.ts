import streamDeck, { action, SingletonAction, DialRotateEvent, WillAppearEvent, DialDownEvent, SendToPluginEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { preflight, getPlayer, setVolume, runOAuth } from "../core/spotify-core";

// ASEGÚRATE de que este UUID sea exacto al del manifest.json
const ACTION_UUID = "com.gilgamesh.spotify-actions.volume";

@action({ UUID: ACTION_UUID })
export class SpotifyVolume extends SingletonAction<any> {
    private currentVol: number = 50;
    private currentSong: string = "";
    private intervalId?: NodeJS.Timeout;

    override async onWillAppear(ev: WillAppearEvent<any>) {
        // Aseguramos el layout al iniciar
        if (ev.action.isDial()) {
            await ev.action.setFeedbackLayout("$B1");
        }

        await this.syncState(ev);

        // Polling cada 3 segundos para que se sienta más rápido el cambio de canción
        this.intervalId = setInterval(async () => {
            await this.syncState(ev);
        }, 2000);
    }

    override async onWillDisappear(ev: WillDisappearEvent<any>) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    /**
     * Sincroniza Volumen y Nombre de Canción
     */
    private async syncState(ev: any) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);

            const realVol = player?.device?.volume_percent ?? 50;
            const trackName = player?.item?.name || "Spotify";

            // Si algo ha cambiado (volumen o canción), actualizamos el feedback
            if ((realVol !== this.currentVol || trackName !== this.currentSong) && ev.action.isDial()) {
                this.currentVol = realVol;
                this.currentSong = trackName;

                await ev.action.setFeedback({
                    title: this.currentSong, // Ahora se actualiza aquí
                    value: `${this.currentVol}%`,
                    indicator: this.currentVol,
                    icon: "imgs/actions/spotify.png" // Tu icono
                });
            }
        } catch (e) {
            // Manejo silencioso de errores de red
        }
    }

    override async onDialRotate(ev: DialRotateEvent<any>) {
        try {
            const { accessToken } = await preflight();

            // 1. Calcular nuevo volumen localmente (ticks es +1 o -1 generalmente)
            // Multiplicamos ticks * 2 para un control más fino, o * 5 para más rápido
            const change = ev.payload.ticks * 5;
            this.currentVol = Math.max(0, Math.min(100, this.currentVol + change));

            // 2. Actualizar pantalla del Dial INMEDIATAMENTE (Feedback visual)
            if (ev.action.isDial()) {
                await ev.action.setFeedback({
                    value: `${this.currentVol}%`,
                    indicator: this.currentVol
                });
            }

            // 3. Enviar comando a Spotify
            await setVolume(accessToken, this.currentVol);

        } catch (e) {
            streamDeck.logger.error("Error al rotar dial: " + e);
            await ev.action.showAlert();
        }
    }

    override async onDialDown(ev: DialDownEvent<any>) {
        // Al presionar el dial, hace un "Mute" rápido
        try {
            const { accessToken } = await preflight();
            this.currentVol = (this.currentVol > 0) ? 0 : 50; // Toggle entre 0 y 50

            await setVolume(accessToken, this.currentVol);
            await ev.action.setFeedback({
                value: `${this.currentVol}%`,
                indicator: this.currentVol
            });
        } catch (e) {
            await ev.action.showAlert();
        }
    }

    override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
        if (ev.payload?.event !== "spotify_auth_start") return;
        try {
            const refreshToken = await runOAuth();
            await streamDeck.ui.sendToPropertyInspector({ event: "spotify_auth_done", refreshToken });
        } catch (e) {
            await ev.action.showAlert();
        }
    }
}