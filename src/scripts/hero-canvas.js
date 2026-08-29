// Shared lifecycle for the hero's decorative <canvas> layers (drifting leaves,
// light rays). One place for: the motion opt-out, HiDPI sizing, debounced
// resize, pausing when the hero is off-screen or the tab is hidden, and —
// when motion is off — painting a single frozen frame instead of running a
// loop.
//
// "Motion off" tracks the same signals the a11y widget uses (scripts/a11y.js),
// so toggling "Reduce Motion" in that widget stops these immediately, no reload:
//   body.reduce-motion   → user explicitly turned animations off  → frozen frame
//   body.motion-enabled  → user explicitly turned them on          → animate
//   neither              → follow the OS prefers-reduced-motion flag
//
// hooks:
//   layout(width, height)             — (re)build state for a new canvas size
//   frame(dt, elapsed, ctx, w, h)     — draw one frame; dt is 0 for the frozen
//                                       frame, elapsed is seconds since start

export function runHeroCanvas(canvasId, hooks) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const hero = canvas.closest('.hero, .page-hero') || canvas.parentElement;
    if (!hero) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const osReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function motionAllowed() {
        const b = document.body.classList;
        if (b.contains('reduce-motion')) return false;
        if (b.contains('motion-enabled')) return true;
        return !osReduce.matches;
    }

    let width = 0;
    let height = 0;
    let running = false;
    let rafId = 0;
    let lastTs = 0;
    let elapsed = 0;

    function paintOnce() {
        hooks.frame(0, elapsed, ctx, width, height);
    }

    function resize() {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        hooks.layout(width, height);
        if (!running) paintOnce();
    }

    function loop(ts) {
        if (!running) return;
        if (!lastTs) lastTs = ts;
        let dt = (ts - lastTs) / 1000;
        lastTs = ts;
        if (dt > 0.05) dt = 0.05; // clamp after a tab-switch / jank
        elapsed += dt;
        hooks.frame(dt, elapsed, ctx, width, height);
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (running) return;
        if (!motionAllowed()) { paintOnce(); return; }
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(loop);
    }

    function stop(freeze) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (freeze) paintOnce();
    }

    resize();

    let heroVisible = true;
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (heroVisible) start();
    });

    new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !document.hidden) start();
        else stop();
    }, { threshold: 0 }).observe(hero);

    function onMotionPrefChange() {
        if (motionAllowed()) {
            if (heroVisible && !document.hidden) start();
        } else {
            stop(true); // settle on a frozen frame
        }
    }
    if (typeof osReduce.addEventListener === 'function') {
        osReduce.addEventListener('change', onMotionPrefChange);
    }
    // The a11y widget toggles body.reduce-motion / body.motion-enabled live.
    new MutationObserver(onMotionPrefChange).observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });

    start();
}
