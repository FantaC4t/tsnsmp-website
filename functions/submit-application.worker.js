// Deploy this as a standalone Cloudflare Worker.
// Set secret: DISCORD_WEBHOOK = your full webhook URL (including ?wait=true)
// Then update WEBHOOK in index.html to your Worker's URL.

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': 'https://www.tsnsmp.online',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        if (!env.DISCORD_WEBHOOK) {
            return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
                status: 500,
                headers: corsHeaders()
            });
        }

        let payload;
        try {
            payload = await request.json();
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid request body' }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const mc = payload?.embeds?.[0]?.fields?.[0]?.value || '';

        let faceBlob = null;
        if (mc && mc !== '—') {
            const avatarUrls = [
                `https://crafatar.com/avatars/${encodeURIComponent(mc)}?size=128&overlay`,
                `https://minotar.net/helm/${encodeURIComponent(mc)}/128`
            ];
            for (const url of avatarUrls) {
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
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
    }
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': 'https://www.tsnsmp.online',
        'Content-Type': 'application/json'
    };
}