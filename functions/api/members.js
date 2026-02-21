// Cloudflare Pages Function — /api/members
// Requires: KV binding named MEMBERS_KV, env secret ADMIN_PASSWORD

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

function unauthorized() {
    return json({ error: 'Unauthorized' }, 401);
}

export async function onRequest(context) {
    const { request, env } = context;

    // Preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS });
    }

    // GET — public, returns member list
    if (request.method === 'GET') {
        const raw = await env.MEMBERS_KV.get('members');
        const members = raw ? JSON.parse(raw) : [];
        return json(members);
    }

    // POST — admin only
    if (request.method === 'POST') {
        const auth = request.headers.get('Authorization') || '';
        if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) return unauthorized();

        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Invalid JSON' }, 400); }

        const raw = await env.MEMBERS_KV.get('members');
        let members = raw ? JSON.parse(raw) : [];

        const { action } = body;

        if (action === 'add') {
            const { name, role, pronouns = '', color = '', twitch = '' } = body;
            if (!name || !role) return json({ error: 'name and role are required' }, 400);
            if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
                return json({ error: 'Member already exists' }, 409);
            }
            members.push({ name, role, pronouns, color, twitch });

        } else if (action === 'remove') {
            const { name } = body;
            if (!name) return json({ error: 'name is required' }, 400);
            members = members.filter(m => m.name.toLowerCase() !== name.toLowerCase());

        } else if (action === 'update') {
            const { name, ...updates } = body;
            if (!name) return json({ error: 'name is required' }, 400);
            const idx = members.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
            if (idx === -1) return json({ error: 'Member not found' }, 404);
            // Don't allow overwriting the name itself via update
            delete updates.action;
            members[idx] = { ...members[idx], ...updates };

        } else if (action === 'seed') {
            // One-time bulk import — only works if KV is empty
            if (raw && JSON.parse(raw).length > 0) {
                return json({ error: 'KV already has data. Remove members first or use force:true' }, 409);
            }
            const { members: seedMembers } = body;
            if (!Array.isArray(seedMembers)) return json({ error: 'members array required' }, 400);
            members = seedMembers;

        } else {
            return json({ error: `Unknown action: ${action}` }, 400);
        }

        await env.MEMBERS_KV.put('members', JSON.stringify(members));
        return json({ ok: true, count: members.length, members });
    }

    return new Response('Method not allowed', { status: 405, headers: CORS });
}
