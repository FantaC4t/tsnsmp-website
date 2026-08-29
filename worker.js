const OLD_HOSTNAMES = new Set(['tsnsmp.online', 'www.tsnsmp.online']);

// Baseline security headers for served pages/assets. Mirrors firebase.json's
// `hosting.headers` so the site is protected the same way however it's served
// (firebase.json only applies on Firebase Hosting; this covers the Worker).
const SECURITY_HEADERS = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Domain migration: permanently redirect the old domain to the new
        // one, preserving path/query so deep links keep working.
        if (OLD_HOSTNAMES.has(url.hostname)) {
            url.hostname = 'tsnsmp.com';
            return Response.redirect(url.toString(), 301);
        }

        if (url.pathname === '/submit-application' && request.method === 'POST') {
            return handleSubmit(request, env, 'DISCORD_WEBHOOK');
        }

        if (url.pathname === '/submit-staff-application' && request.method === 'POST') {
            return handleSubmit(request, env, 'STAFF_APPLICATION_WEBHOOK');
        }

        // All other requests: serve the Astro build output from ./dist,
        // with the baseline security headers layered on.
        const assetRes = await env.ASSETS.fetch(request);
        const res = new Response(assetRes.body, assetRes);
        for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
        return res;
    }
};

async function handleSubmit(request, env, webhookKey) {
    const webhookUrl = env[webhookKey];
    if (!webhookUrl) {
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
        discordRes = await fetch(webhookUrl, { method: 'POST', body: form });
    } else {
        discordRes = await fetch(webhookUrl, {
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
