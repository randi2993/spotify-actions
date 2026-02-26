import streamDeck, { action, SingletonAction, KeyDownEvent, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { preflight, getPlayer, runOAuth, setRepeat } from "../core/spotify-core";

const ACTION_UUID = "com.gilgamesh.spotify-actions.repeat";

@action({ UUID: ACTION_UUID })
export class SpotifyRepeat extends SingletonAction<any> {

    override async onWillAppear(ev: WillAppearEvent<any>) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);

            // Sincronizar el icono inicial con el estado real de Spotify
            const state = player?.repeat_state ?? "off";
            await this.updateIcon(ev.action, state);
        } catch (e) {
            await ev.action.setImage("imgs/actions/repeat.png");
        }
    }

    override async onKeyDown(ev: KeyDownEvent<any>) {
        try {
            const { accessToken } = await preflight();
            const player = await getPlayer(accessToken);
            const currentState = player?.repeat_state ?? "off";

            let nextState: "off" | "context" | "track";

            // Lógica de rotación: off -> context (repeat all) -> track (repeat 1) -> off
            if (currentState === "off") {
                nextState = "context";
            } else if (currentState === "context") {
                nextState = "track";
            } else {
                nextState = "off";
            }

            await setRepeat(accessToken, nextState);
            await this.updateIcon(ev.action, nextState);
            // await ev.action.showOk();

        } catch (e: any) {
            this.handleError(ev, e);
        }
    }

    /**
     * Selecciona el archivo de imagen correcto según el estado
     */
    private async updateIcon(action: any, state: string) {
        let image = "repeat.png"; // Estado 'off' por defecto

        if (state === "context") image = "repeat-.png";
        if (state === "track") image = "repeat-1.png";

        await action.setImage(`imgs/actions/${image}`);
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

            await (ev.action as any).setImage("imgs/actions/previous.png");
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