import fetch from "node-fetch";

export async function spotifyFetch(accessToken: string, method: string, url: string, body?: any) {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (res.status === 204) return { status: 204, data: null };

    const text = await res.text().catch(() => "");

    // FIX: Intentar parsear JSON, si falla devolver el texto plano
    try {
        const data = text ? JSON.parse(text) : null;
        return { status: res.status, data };
    } catch (e) {
        // Si no es JSON (como tu error con 'V...'), devolvemos el texto tal cual
        return { status: res.status, data: text };
    }
}