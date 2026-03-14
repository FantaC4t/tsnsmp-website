#!/usr/bin/env node
/**
 * sync-players.js
 *
 * Pulls three files from the game server via SFTP, merges them, and writes
 * the combined member list to Firebase Realtime Database.
 *
 *   whitelist.json                        → name + UUID (authoritative list)
 *   ops.json                              → role: ops → "owner", others → "member"
 *   config/playerstatus/player_data.json  → color + twitch link  (keyed by UUID)
 *   world/playerdata/pronouns.dat         → pronouns             (keyed by UUID)
 *
 * player_extras.json (committed to this repo) only needs name.
 * Role is auto-determined from ops.json; all other fields come from the live
 * server data automatically.
 *
 * Required GitHub Actions secrets:
 *   SFTP_HOST                – game server SFTP hostname / IP
 *   SFTP_PORT                – SFTP port (default 22)
 *   SFTP_USER                – SFTP username
 *   SFTP_PASS                – SFTP password
 *   SFTP_WHITELIST_PATH      – path to whitelist.json         (default /whitelist.json)
 *   SFTP_OPS_PATH            – path to ops.json               (default /ops.json)
 *   SFTP_PLAYERDATA_PATH     – path to player_data.json       (default /config/playerstatus/player_data.json)
 *   SFTP_PRONOUNS_PATH       – path to pronouns.dat           (default /world/playerdata/pronouns.dat)
 *   FIREBASE_SERVICE_ACCOUNT – Firebase service account JSON (full JSON string)
 */

const SftpClient = require('ssh2-sftp-client');
const admin      = require('firebase-admin');
const path       = require('path');
const os         = require('os');
const fs         = require('fs');

const DB_URL = 'https://tsnplayerlist-default-rtdb.europe-west1.firebasedatabase.app';

function stripNulls(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
}

function safeKey(name) {
    return name.toLowerCase().replace(/[.#$[\]]/g, '_');
}

/** Download a remote file to a temp path. Returns parsed JSON or null on failure. */
async function fetchJson(sftp, remotePath, label) {
    const tmpPath = path.join(os.tmpdir(), `tsnsmp_${label}.json`);
    try {
        await sftp.fastGet(remotePath, tmpPath);
        const parsed = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
        console.log(`[SFTP]     fetched ${label} from ${remotePath}`);
        return parsed;
    } catch (err) {
        console.warn(`[SFTP]     could not fetch ${label} (${remotePath}): ${err.message}`);
        return null;
    }
}

async function main() {
    // ── 1. Load player_extras.json (name only) ─────────────────────────────
    const extrasPath = path.join(__dirname, 'player_extras.json');
    const extras     = JSON.parse(fs.readFileSync(extrasPath, 'utf8'));
    // Map lowercase name → extra data
    const extrasMap  = new Map(extras.map(e => [e.name.toLowerCase(), e]));
    console.log(`[Extras]   loaded ${extras.length} entries`);

    // ── 2. SFTP ───────────────────────────────────────────────────────────────
    const sftp = new SftpClient();
    let whitelist   = [];
    let ops         = [];   // [{ uuid, name, level, bypassesPlayerLimit }]
    let playerData  = {};   // UUID → { color, link, isLive, persist, role }
    let pronounsRaw = {};   // UUID → pronouns string

    try {
        await sftp.connect({
            host:         process.env.SFTP_HOST,
            port:         parseInt(process.env.SFTP_PORT || '22', 10),
            username:     process.env.SFTP_USER,
            password:     process.env.SFTP_PASS,
            readyTimeout: 12000,
        });
        console.log('[SFTP]     connected');

        const whitelistPath  = process.env.SFTP_WHITELIST_PATH   || '/whitelist.json';
        const opsPath        = process.env.SFTP_OPS_PATH         || '/ops.json';
        const playerDataPath = process.env.SFTP_PLAYERDATA_PATH  || '/config/playerstatus/player_data.json';
        const pronounsPath   = process.env.SFTP_PRONOUNS_PATH    || '/world/playerdata/pronouns.dat';

        const wl = await fetchJson(sftp, whitelistPath,  'whitelist');
        if (wl) whitelist = wl;

        const op = await fetchJson(sftp, opsPath,        'ops');
        if (op) ops = op;          // [{ uuid, name, level, bypassesPlayerLimit }]

        const pd = await fetchJson(sftp, playerDataPath, 'player_data');
        if (pd) playerData = pd;   // { "uuid": { color, link, ... } }

        const pn = await fetchJson(sftp, pronounsPath,   'pronouns');
        if (pn) pronounsRaw = pn;  // { "uuid": "they/them" } or { "uuid": { pronouns: "..." } }

    } catch (err) {
        console.warn(`[SFTP]     connection error: ${err.message}`);
        console.warn('[SFTP]     continuing with player_extras.json only');
    } finally {
        await sftp.end().catch(() => {});
    }

    // Normalise pronouns — handle both { uuid: "str" } and { uuid: { pronouns: "str" } }
    const pronounsMap = new Map();
    for (const [uuid, val] of Object.entries(pronounsRaw)) {
        if (typeof val === 'string') pronounsMap.set(uuid, val);
        else if (val && typeof val.pronouns === 'string') pronounsMap.set(uuid, val.pronouns);
    }

    // Build ops set — UUIDs present in ops.json become "owner", everyone else is "member"
    const opsSet = new Set(ops.map(o => o.uuid).filter(Boolean));
    console.log(`[Ops]      ${opsSet.size} operator(s) → role "owner"`);

    // ── 3. Merge ──────────────────────────────────────────────────────────────
    const seen    = new Set();
    const members = {};

    for (const entry of whitelist) {
        if (!entry.name) continue;
        const uuid   = entry.uuid || '';
        const extra  = extrasMap.get(entry.name.toLowerCase()) || {};
        const pd     = (uuid && playerData[uuid]) ? playerData[uuid] : {};

        // Twitch: stored as link in player_data.json, override possible in extras
        const twitch = extra.twitch
            || (pd.link && pd.link.startsWith('https://') ? pd.link : null)
            || null;

        // Color: from player_data.json, override possible in extras
        const color = extra.color
            || (pd.color && /^#[0-9a-fA-F]{3,8}$/.test(pd.color) ? pd.color : null)
            || null;

        // Pronouns: from pronouns.dat, override possible in extras
        const pronouns = extra.pronouns || pronounsMap.get(uuid) || null;

        const key = safeKey(entry.name);
        members[key] = stripNulls({
            name:      entry.name,
            uuid,
            role:      opsSet.has(uuid) ? 'owner' : 'member',
            color,
            pronouns,
            twitch,
            syncedAt:  Date.now(),
        });
        seen.add(entry.name.toLowerCase());
    }

    // Players in extras but not on whitelist (offline-mode players, etc.)
    for (const extra of extras) {
        if (seen.has(extra.name.toLowerCase())) continue;
        const key = safeKey(extra.name);
        members[key] = stripNulls({
            name:     extra.name,
            role:     'member',
            color:    extra.color    || null,
            pronouns: extra.pronouns || null,
            twitch:   extra.twitch   || null,
            syncedAt: Date.now(),
        });
    }

    const total = Object.keys(members).length;
    console.log(`[Merge]    ${total} members ready`);
    if (total === 0) {
        console.error('[Merge]    result is empty — refusing to overwrite Firebase.');
        process.exit(1);
    }

    // ── 4. Write to Firebase ──────────────────────────────────────────────────
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: DB_URL });
    await admin.database().ref('members').set(members);
    console.log(`[Firebase] /members updated — ${total} entries`);
    await admin.app().delete();
    console.log('[Done]');
}

main().catch(err => { console.error('[Fatal]', err.message || err); process.exit(1); });
