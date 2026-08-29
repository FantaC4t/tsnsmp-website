// Hero light-rays canvas — a lightweight 2D port of the Godot "sun god-rays"
// shader. A soft glow sits just off the top-right of the hero and fans
// additive light rays down into it; each ray shimmers on layered sine "noise"
// (the shader samples a scrolling noise texture — we fake it, no asset needed),
// its length and width breathing over time. A faint rainbow is mixed in the
// same way the shader's spectrum() term does, kept mostly matcha so it sits in
// the palette.
//
// Lifecycle (reduced-motion opt-out, off-screen pausing, HiDPI) lives in
// hero-canvas.js.

import { runHeroCanvas } from './hero-canvas.js';

const TAU = Math.PI * 2;

// Base ray tint — the rainbow is mixed toward this.
//  · dark mode:  pale matcha green-white, blended additively onto the dark hero
//  · light mode: warm amber-orange, painted normally so it reads on white
const BASE_DARK = [172, 238, 196];
const BASE_LIGHT = [255, 158, 38];

const RAY_COUNT = 16;
const RAY_RAINBOW = 0.28;   // 0 = no rainbow, 1 = full spectrum
const RAINBOW_SCALE = 1.6;
const GLOW_RAINBOW = 0.18;

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function smoothstep(edge0, edge1, v) {
    const x = clamp01((v - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
}

// Godot's spectrum(): a smooth rainbow sweep for t in 0..1.
function spectrum(t) {
    t = t - Math.floor(t);
    return [
        clamp01(Math.abs(((t * 6) % 6) - 3) - 1),
        clamp01(Math.abs(((t * 6 + 4) % 6) - 3) - 1),
        clamp01(Math.abs(((t * 6 + 2) % 6) - 3) - 1),
    ];
}

// Mix base rgb (0..255) toward a spectrum triplet (0..1) by amount m.
function mixColor(base, spec, m) {
    return [
        base[0] + (spec[0] * 255 - base[0]) * m,
        base[1] + (spec[1] * 255 - base[1]) * m,
        base[2] + (spec[2] * 255 - base[2]) * m,
    ];
}

function rgba(c, a) {
    return `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a.toFixed(3)})`;
}

export function initHeroRays() {
    let width = 0;
    let height = 0;
    let narrow = false;

    runHeroCanvas('heroRays', {
        layout(w, h) {
            width = w;
            height = h;
            narrow = w < 720;
        },

        frame(dt, elapsed, ctx) {
            ctx.clearRect(0, 0, width, height);
            if (!width || !height) return;

            // dt === 0 is the frozen frame drawn when "Reduce Motion" is on —
            // render a calm, evenly-lit sunburst rather than a random snapshot.
            const stillFrame = dt === 0;

            // Theme-aware: warm + opaque on white, cool + additive on dark.
            const light = !document.body.classList.contains('dark-mode');
            const BASE = light ? BASE_LIGHT : BASE_DARK;
            const rayRainbow = light ? 0.13 : RAY_RAINBOW;
            const glowRainbow = light ? 0.09 : GLOW_RAINBOW;
            const aScale = light ? 1.9 : 1.0;   // normal compositing needs punchier alpha
            const glowA = light ? 0.5 : 0.32;

            // Sun sits off the top-right corner so rays fan down-left, over the
            // hero's visual side and away from the headline copy. Its origin is
            // tucked up behind the fixed site header (~70px tall) so the bright
            // core stays hidden and only the rays themselves spill into view.
            const sx = width * (narrow ? 0.72 : 0.82);
            const sy = height * (narrow ? -0.14 : -0.09);
            const maxLen = Math.hypot(width, height) * 0.95;

            ctx.save();
            ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

            // Soft sun glow
            const glowR = Math.min(width, height) * (narrow ? 0.3 : 0.24);
            const glowCol = mixColor(BASE, spectrum(elapsed * 0.02), glowRainbow);
            const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
            gg.addColorStop(0, rgba(glowCol, glowA));
            gg.addColorStop(0.5, rgba(glowCol, glowA * 0.32));
            gg.addColorStop(1, rgba(glowCol, 0));
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(sx, sy, glowR, 0, TAU);
            ctx.fill();

            // Rays
            const baseAngle = Math.PI * 0.62;   // down and a touch left
            const spread = Math.PI * 0.66;
            const sway = Math.sin(elapsed * 0.05) * 0.05;

            for (let i = 0; i < RAY_COUNT; i++) {
                const f = i / (RAY_COUNT - 1);
                const ang = baseAngle - spread / 2 + spread * f + sway;

                // Fake scrolling-noise shimmer: two detuned sine bands multiplied.
                const n1 = stillFrame ? 0.62 : 0.5 + 0.5 * Math.sin(f * 9.0 + elapsed * 0.85);
                const n2 = stillFrame ? 0.55 : 0.5 + 0.5 * Math.sin(f * 17.0 - elapsed * 0.55 + 1.3);
                const flick = n1 * n2;

                const intensity = (0.08 + 0.46 * smoothstep(0.12, 1.0, flick)) * (stillFrame ? 0.8 : 1);
                if (intensity < 0.02) continue;

                const len = maxLen * (0.5 + 0.5 * n1);
                const halfW = 9 + 22 * n2;
                const col = mixColor(BASE, spectrum(f * RAINBOW_SCALE + elapsed * 0.015), rayRainbow);

                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(ang);
                const lg = ctx.createLinearGradient(0, 0, len, 0);
                lg.addColorStop(0, rgba(col, Math.min(0.82, intensity * 0.8 * aScale)));
                lg.addColorStop(0.35, rgba(col, Math.min(0.5, intensity * 0.3 * aScale)));
                lg.addColorStop(1, rgba(col, 0));
                ctx.fillStyle = lg;
                ctx.beginPath();
                ctx.moveTo(0, -halfW * 0.2);
                ctx.lineTo(len, -halfW);
                ctx.lineTo(len, halfW);
                ctx.lineTo(0, halfW * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            ctx.restore();
        },
    });
}
