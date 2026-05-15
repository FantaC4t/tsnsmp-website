export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.DISCORD_WEBHOOK) {
        return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Extract MC username from the first embed field
    const mc = payload?.embeds?.[0]?.fields?.[0]?.value || '';

    // Try to fetch the Minecraft face server-side (crafatar → minotar fallback)
    let faceBlob = null;
    if (mc && mc !== '—') {
        const avatarUrls = [
            `https://crafatar.com/avatars/${encodeURIComponent(mc)}?size=128&overlay`,
            `https://minotar.net/helm/${encodeURIComponent(mc)}/128`
        ];
        for (const url of avatarUrls) {
            try {
                const r = await fetch(url, { headers: { 'User-Agent': 'TSNSMP-Bot/1.0' } });
                if (r.ok) {
                    faceBlob = await r.blob();
                    break;
                }
            } catch { /* try next */ }
        }
    }

    let discordRes;

    if (faceBlob) {
        // Attach image as a file and reference it in the embed thumbnail
        payload.embeds[0].thumbnail = { url: 'attachment://face.png' };

        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));
        form.append('file', faceBlob, 'face.png');

        discordRes = await fetch(env.DISCORD_WEBHOOK, {
            method: 'POST',
            body: form
        });
    } else {
        // No image available — send as plain JSON
        discordRes = await fetch(env.DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    const text = await discordRes.text();
    return new Response(text, {
        status: discordRes.status,
        headers: { 'Content-Type': 'application/json' }
    });
}
