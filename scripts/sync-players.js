#!/usr/bin/env node
/**
 * sync-players.js
 *
 * 1. SFTPs into the game server and downloads whitelist.json
 * 2. Merges it with player_extras.json (stored in this repo)
 * 3. Writes the combined member list to Firebase Realtime Database
 *
 * Required GitHub Actions secrets:
 *   SFTP_HOST                – game server SFTP hostname / IP
 *   SFTP_PORT                – SFTP port (default 22)
 *   SFTP_USER                – SFTP username
 *   SFTP_PASS                – SFTP password
 *   SFTP_REMOTE_PATH         – path to whitelist.json on the server (default /whitelist.json)
 *   FIREBASE_SERVICE_ACCOUNT – Firebase service account JSON (stringified, from Firebase console)
 */

const SftpClient = require('ssh2-sftp-client');
const admin      = require('firebase-admin');
const path       = require('path');
const os         = require('os');
const fs         = require('fs');

// Hardcoded — already public in firebase-config.js
const DB_URL = 'https://tsnplayerlist-default-rtdb.europe-west1.firebasedatabase.app';

/** Remove null / undefined / empty-string fields so Firebase stays clean */
function stripNulls(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
}

/** Firebase keys cannot contain  . # $ [ ]  */
function safeKey(name) {
    return name.toLowerCase().replace(/[.#$[\]]/g, '_');
}

async function main() {
    // ── 1. Load player_extras.json (committed to repo) ──────────────────────
    const extrasPath = path.join(__dirname, 'player_extras.json');
    const extras     = JSON.parse(fs.readFileSync(extrasPath, 'utf8'));
    const extrasMap  = new Map(extras.map(e => [e.name.toLowerCase(), e]));
    console.log(`[Extras]   loaded ${extras.length} player extras`);

    // ── 2. SFTP — pull whitelist.json from the game server ──────────────────
    let whitelist = [];
    const sftp = new SftpClient();
    try {
        await sftp.connect({
            host:         process.env.SFTP_HOST,
            port:         parseInt(process.env.SFTP_PORT || '22', 10),
            username:     process.env.SFTP_USER,
            password:     process.env.SFTP_PASS,
            readyTimeout: 12000,
        });
        const remotePath = process.env.SFTP_REMOTE_PATH || '/whitelist.json';
        const tmpPath    = path.join(os.tmpdir(), 'tsnsmp_whitelist.json');
        await sftp.fastGet(remotePath, tmpPath);
        whitelist = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
        console.log(`[SFTP]     fetched whitelist — ${whitelist.length} entries`);
    } catch (err) {
        // Don't abort the sync — extras-only run still updates colours etc.
        console.warn(`[SFTP]     could not fetch whitelist: ${err.message}`);
        console.warn('[SFTP]     continuing with player_extras.json only');
    } finally {
        await sftp.end().catch(() => {});
    }

    // ── 3. Merge ─────────────────────────────────────────────────────────────
    const seen    = new Set();
    const members = {};

    // Whitelist is authoritative for name + uuid
    for (const entry of whitelist) {
        if (!entry.name) continue;
        const key   = safeKey(entry.name);
        const extra = extrasMap.get(entry.name.toLowerCase()) || {};
        members[key] = stripNulls({
            name:      entry.name,
            uuid:      entry.uuid     || null,
            role:      extra.role     || 'member',
            color:     extra.color    || null,
            pronouns:  extra.pronouns || null,
            twitch:    extra.twitch   || null,
            syncedAt:  Date.now(),
        });
        seen.add(entry.name.toLowerCase());
    }

    // Players in extras but NOT on the whitelist (owners, mods, offline-mode, etc.)
    for (const extra of extras) {
        if (seen.has(extra.name.toLowerCase())) continue;
        const key = safeKey(extra.name);
        members[key] = stripNulls({
            name:      extra.name,
            role:      extra.role     || 'member',
            color:     extra.color    || null,
            pronouns:  extra.pronouns || null,
            twitch:    extra.twitch   || null,
            syncedAt:  Date.now(),
        });
    }

    const total = Object.keys(members).length;
    console.log(`[Merge]    ${total} members ready to write`);

    // Safety guard — never wipe the database with an empty result
    if (total === 0) {
        console.error('[Merge]    result is empty — refusing to overwrite Firebase.');
        process.exit(1);
    }

    // ── 4. Write to Firebase ─────────────────────────────────────────────────
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential:  admin.credential.cert(serviceAccount),
        databaseURL: DB_URL,
    });

    const db = admin.database();
    await db.ref('members').set(members);
    console.log(`[Firebase] /members updated — ${total} entries written`);

    await admin.app().delete();
    console.log('[Done]');
}

main().catch(err => {
    console.error('[Fatal]', err.message || err);
    process.exit(1);
});
