// Hero drifting-leaves canvas — a lightweight 2D port of the Godot "leaves in
// a vortex" particle shader. Leaves spawn in a band above the hero, fall under
// gravity, get pushed by a slow time-varying wind, swirl (each leaf orbits its
// own pivot, and the pivots creep toward centre — the "vortex" inward pull),
// and tumble as they go. Alpha fades in on spawn and out near end-of-life, same
// as the shader's smoothstep(fade_from, 1.0) tail.
//
// Deliberately subtle: few leaves, low opacity, matcha-palette colours.
// Lifecycle (reduced-motion opt-out, off-screen pausing, HiDPI) lives in
// hero-canvas.js.

import { runHeroCanvas } from './hero-canvas.js';

const LEAF_COLORS = [
    'rgba(36, 204, 70, ALPHA)',   // --s3-green
    'rgba(62, 214, 118, ALPHA)',  // lighter matcha
    'rgba(43, 199, 219, ALPHA)',  // --s3-teal
    'rgba(120, 208, 160, ALPHA)', // muted sage
    'rgba(26, 158, 87, ALPHA)',   // deep leaf
];

function smoothstep(edge0, edge1, v) {
    const x = Math.max(0, Math.min(1, (v - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
}

export function initHeroParticles() {
    let width = 0;
    let height = 0;
    let leaves = [];

    const rand = (min, max) => min + Math.random() * (max - min);

    // ~1 leaf per 24k CSS px², clamped — a whisper, not a storm. Light mode
    // (bright cream hero, greener "Matcha Season" mood) gets a heavier fall.
    function targetCount() {
        const lightBoost = document.body.classList.contains('dark-mode') ? 1 : 1.8;
        const base = Math.round((width * height) / 24000 * lightBoost);
        const cap = Math.round((width < 640 ? 13 : 32) * lightBoost);
        return Math.max(7, Math.min(base, cap));
    }

    function syncCount() {
        if (!width) return;
        const want = targetCount();
        if (want > leaves.length) {
            while (leaves.length < want) leaves.push(makeLeaf(true));
        } else if (want < leaves.length) {
            leaves.length = want;
        }
    }

    function makeLeaf(seeded) {
        const size = rand(4.5, 11);
        return {
            pivotX: rand(-0.05, 1.05) * width,
            y: seeded ? rand(-height * 0.15, height * 1.05) : rand(-height * 0.3, -20),
            size,
            // orbit around the pivot = the leaf's local swirl
            angle: rand(0, Math.PI * 2),
            angularSpeed: rand(0.25, 0.75) * (Math.random() < 0.5 ? -1 : 1),
            swayRadius: rand(10, 42),
            fallSpeed: rand(16, 46) + size * 1.4,
            rot: rand(0, Math.PI * 2),
            rotSpeed: rand(0.4, 1.6) * (Math.random() < 0.5 ? -1 : 1),
            life: rand(11, 22),
            age: seeded ? rand(0, 6) : 0,
            baseAlpha: rand(0.2, 0.5),
            color: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
        };
    }

    runHeroCanvas('heroParticles', {
        layout(w, h) {
            width = w;
            height = h;
            if (!leaves.length) {
                leaves = Array.from({ length: targetCount() }, () => makeLeaf(true));
            } else {
                syncCount();
            }
        },

        frame(dt, elapsed, ctx) {
            // Slow, wandering wind — same shape as the shader's wind_change term.
            const windX = Math.sin(elapsed * 0.13) * Math.sin(elapsed * 0.37) * 24;
            const centre = width * 0.5;

            for (let i = 0; i < leaves.length; i++) {
                const leaf = leaves[i];
                leaf.age += dt;
                leaf.angle += leaf.angularSpeed * dt;
                leaf.rot += leaf.rotSpeed * dt;
                leaf.y += leaf.fallSpeed * dt;
                // vortex inward pull: pivots drift gently toward the centre column
                leaf.pivotX += (centre - leaf.pivotX) * 0.05 * dt;
                if (dt > 0 && (leaf.age >= leaf.life || leaf.y > height + 40)) {
                    Object.assign(leaf, makeLeaf(false));
                }
            }

            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < leaves.length; i++) {
                const leaf = leaves[i];
                const swirl = Math.sin(leaf.angle) * leaf.swayRadius;
                const depth = Math.cos(leaf.angle); // -1 far, +1 near
                const scale = 0.78 + 0.22 * depth;
                const x = leaf.pivotX + swirl + windX;
                const y = leaf.y;

                const t = leaf.age / leaf.life;
                const fadeIn = Math.min(1, leaf.age / 1.6);
                const fadeOut = 1 - smoothstep(0.82, 1, t);
                const alpha = leaf.baseAlpha * fadeIn * fadeOut * (0.62 + 0.38 * (depth * 0.5 + 0.5));
                if (alpha <= 0.003) continue;

                const s = leaf.size;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(leaf.rot);
                ctx.scale(scale, scale);
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.quadraticCurveTo(s * 0.92, -s * 0.15, 0, s);
                ctx.quadraticCurveTo(-s * 0.92, -s * 0.15, 0, -s);
                ctx.closePath();
                ctx.fillStyle = leaf.color.replace('ALPHA', alpha.toFixed(3));
                ctx.fill();
                ctx.restore();
            }
        },
    });

    // Theme toggle changes the target leaf count — re-sync when body.dark-mode flips.
    let wasDark = document.body.classList.contains('dark-mode');
    new MutationObserver(() => {
        const nowDark = document.body.classList.contains('dark-mode');
        if (nowDark !== wasDark) {
            wasDark = nowDark;
            syncCount();
        }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
