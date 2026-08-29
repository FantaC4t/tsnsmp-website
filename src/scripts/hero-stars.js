// Hero starfield canvas — a 2D port of the Godot canvas_item "stars" shader
// (sparse cells picked by hash < density, sampled from a texture). Here each
// star is a tiny matcha-white dot that drifts very slowly (the shader's
// stars_speed) and twinkles. The faintest of the hero's canvas layers, sitting
// right on top of the gradient mesh.
//
// Lifecycle (reduced-motion opt-out, off-screen pausing, HiDPI) lives in
// hero-canvas.js.

import { runHeroCanvas } from './hero-canvas.js';

const STAR_RGB = '220, 248, 230';         // pale matcha white
const DENSITY = 0.00014;                    // stars per CSS px² (~ stars_density)
const MAX_STARS = 160;
const DRIFT = { x: 2.4, y: 1.1 };          // px/s — barely perceptible

const rand = (min, max) => min + Math.random() * (max - min);

export function initHeroStars() {
    let width = 0;
    let height = 0;
    let stars = [];

    function build() {
        const count = Math.min(MAX_STARS, Math.round(width * height * DENSITY));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: rand(0.55, 1.9),
            base: rand(0.18, 0.55),
            twPhase: rand(0, Math.PI * 2),
            twSpeed: rand(0.4, 1.4),
        }));
    }

    runHeroCanvas('heroStars', {
        layout(w, h) {
            width = w;
            height = h;
            build();
        },

        frame(dt, elapsed, ctx) {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.x += DRIFT.x * dt;
                s.y += DRIFT.y * dt;
                if (s.x > width + 2) s.x -= width + 4;
                if (s.y > height + 2) s.y -= height + 4;

                const tw = 0.55 + 0.45 * Math.sin(elapsed * s.twSpeed + s.twPhase);
                const a = s.base * tw;
                ctx.fillStyle = `rgba(${STAR_RGB}, ${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
        },
    });
}
