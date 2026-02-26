(function () {
    "use strict";

    const REDIRECT_URI = "http://127.0.0.1:4399/callback";

    let ws;
    let pluginUUID = "";
    let actionUUID = "";   // el action real (playpause o like)
    let saveTimer;
    let actionContext = ""; // Variable global

    function el(id) {
        const n = document.getElementById(id);
        if (!n) throw new Error("Missing element: " + id);
        return n;
    }

    function getGlobal() {
        return {
            clientId: el("clientId").value.trim(),
            clientSecret: el("clientSecret").value.trim(),
            refreshToken: el("refreshToken").value.trim()
        };
    }

    function setGlobal(s) {
        el("clientId").value = (s && s.clientId) || "";
        el("clientSecret").value = (s && s.clientSecret) || "";
        el("refreshToken").value = (s && s.refreshToken) || "";
    }

    function scheduleSaveGlobal() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            ws.send(JSON.stringify({
                event: "setGlobalSettings",
                context: pluginUUID,
                payload: getGlobal()
            }));
        }, 200);
    }

    function requestGlobalSettings() {
        ws.send(JSON.stringify({ event: "getGlobalSettings", context: pluginUUID }));
    }

    window.connectElgatoStreamDeckSocket = function (inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
        pluginUUID = inUUID;

        // Muestra redirect URI fijo
        el("callback").textContent = REDIRECT_URI;

        // action actual (depende del botón que abriste)
        const a = JSON.parse(inActionInfo || "{}");
        actionUUID = a.action || "com.gilgamesh.spotify-actions.playpause";
        actionContext = a.context || pluginUUID;

        ws = new WebSocket("ws://127.0.0.1:" + inPort);

        ws.onopen = () => {
            ws.send(JSON.stringify({ event: inRegisterEvent, uuid: inUUID }));

            requestGlobalSettings();

            ["clientId", "clientSecret", "refreshToken"].forEach((id) => {
                el(id).addEventListener("input", scheduleSaveGlobal);
                el(id).addEventListener("change", scheduleSaveGlobal);
            });

            el("authorize").addEventListener("click", () => {
                scheduleSaveGlobal();

                ws.send(JSON.stringify({
                    event: "sendToPlugin",
                    action: actionUUID,      // cualquiera de las acciones sirve
                    context: pluginUUID,     // 🔥 TU FIX que funciona
                    payload: {
                        event: "spotify_auth_start",
                        originalContext: actionContext
                    }
                }));
            });

            el("edit").addEventListener("click", () => {
                el("clientSecret").disabled = false;
                el("clientId").disabled = false;
            });

            el("clean").addEventListener("click", () => {
                el("refreshToken").value = '';
                el("clientId").value = '';
                el("clientSecret").value = '';
                el("clientSecret").disabled = false;
                el("clientId").disabled = false;
                scheduleSaveGlobal();
            });
        };

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (msg.event === "didReceiveGlobalSettings") {
                setGlobal(msg.payload && msg.payload.settings ? msg.payload.settings : {});
            }

            // Los mensajes que vienen del Plugin (el código .ts)
            if (msg.event === "sendToPropertyInspector") {
                const payload = msg.payload;

                if (payload.event === "spotify_auth_done") {
                    el("error-display").style.display = "none";
                    el("clientSecret").disabled = true;
                    el("clientId").disabled = true;
                    el("ok-display").style.display = "block";
                    el("ok-display").textContent = "✅ Linked!";
                    el("refreshToken").value = payload.refreshToken;
                    scheduleSaveGlobal();
                }

                if (payload.event === "spotify_auth_error") {
                    const errorEl = el("error-display");
                    // Ahora payload.message sí tendrá el texto del error
                    errorEl.textContent = `⚠️ ${payload.message}`;
                    errorEl.style.display = "block";
                    el("ok-display").style.display = "none";
                    el("clientSecret").disabled = false;
                    el("clientId").disabled = false;
                }
                // console.log('payload: ', payload);

            }
        };
    };
})();
