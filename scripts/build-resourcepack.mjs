// Bundles ./resourcepack/ into ./public/resourcepack.zip so Astro copies it
// into the build output and it ends up served at https://tsnsmp.com/resourcepack.zip.
//
// Runs automatically before `astro build` via the "prebuild" npm script, so
// Cloudflare's deploy (which just runs `npm run build`) always ships a fresh
// zip built from source -- no committed binary, no manual zipping.
//
// The zip is built deterministically (sorted entries, fixed mtime and mode,
// no extra timestamp fields) so the SHA-1 only changes when the pack contents
// actually change. That hash is what goes in the Minecraft server's
// `resource-pack-sha1`.

import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import yazl from 'yazl';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'resourcepack');
const outDir = path.join(root, 'public');
const outFile = path.join(outDir, 'resourcepack.zip');

// Any constant works; it just has to be fixed so the hash stays stable.
const FIXED_MTIME = new Date('2000-01-01T00:00:00Z');

async function collectFiles(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...(await collectFiles(full)));
        } else if (entry.isFile()) {
            out.push(full);
        }
    }
    return out;
}

async function main() {
    try {
        await stat(path.join(srcDir, 'pack.mcmeta'));
    } catch {
        console.error(`[resourcepack] no pack.mcmeta in ${srcDir} -- is the source there?`);
        process.exit(1);
    }

    const files = (await collectFiles(srcDir))
        .map((f) => ({ full: f, name: path.relative(srcDir, f).split(path.sep).join('/') }))
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    await mkdir(outDir, { recursive: true });
    await rm(outFile, { force: true });

    await new Promise((resolve, reject) => {
        const zip = new yazl.ZipFile();
        const stream = createWriteStream(outFile);
        stream.on('close', resolve);
        stream.on('error', reject);
        zip.outputStream.on('error', reject);
        zip.outputStream.pipe(stream);
        for (const { full, name } of files) {
            zip.addFile(full, name, { mtime: FIXED_MTIME, mode: 0o100644, compress: true });
        }
        zip.end();
    });

    const buf = await readFile(outFile);
    const sha1 = createHash('sha1').update(buf).digest('hex');
    const mb = (buf.length / 1024 / 1024).toFixed(2);
    console.log(`[resourcepack] wrote public/resourcepack.zip  (${files.length} files, ${mb} MB)`);
    console.log(`[resourcepack] sha1 = ${sha1}`);
}

main();
