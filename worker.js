export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/submit-application' && request.method === 'POST') {
            return handleSubmit(request, env);
        }

        // All other requests: serve the Astro build output from ./dist
        return env.ASSETS.fetch(request);
    }
};

async function handleSubmit(request, env) {
    if (!env.DISCORD_WEBHOOK) {
        return json({ error: 'Webhook not configured' }, 500);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return json({ error: 'Invalid request body' }, 400);
    }

    const mc = payload?.embeds?.[0]?.fields?.[0]?.value || '';

    let faceBlob = null;
    if (mc && mc !== '—') {
        for (const url of [
            `https://crafatar.com/avatars/${encodeURIComponent(mc)}?size=128&overlay`,
            `https://minotar.net/helm/${encodeURIComponent(mc)}/128`
        ]) {
            try {
                const r = await fetch(url, { headers: { 'User-Agent': 'TSNSMP-Bot/1.0' } });
                if (r.ok) { faceBlob = await r.blob(); break; }
            } catch { /* try next */ }
        }
    }

    let discordRes;
    if (faceBlob) {
        payload.embeds[0].thumbnail = { url: 'attachment://face.png' };
        const form = new FormData();
        form.append('payload_json', JSON.stringify(payload));
        form.append('file', faceBlob, 'face.png');
        discordRes = await fetch(env.DISCORD_WEBHOOK, { method: 'POST', body: form });
    } else {
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

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
