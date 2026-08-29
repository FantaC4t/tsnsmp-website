/**
 * TSNSMP Accessibility Widget
 * Floating panel with: text size, high contrast, dyslexia font,
 * reduce motion, and highlight links toggles.
 * All preferences persisted in localStorage.
 */
(() => {
    'use strict';

    // ── Storage keys ──────────────────────────────────────────────────────
    const KEYS = {
        textSize:       'a11y-text-size',
        highContrast:   'a11y-high-contrast',
        dyslexia:       'a11y-dyslexia',
        reduceMotion:   'reduceMotion',   // shared with header.js
        highlightLinks: 'a11y-highlight-links',
        motionPrompt:   'a11y-motion-prompt-seen',
        motionExplicit: 'a11y-motion-explicit'   // set only by real user interaction, never by auto-mirroring
    };

    // ── Helpers ───────────────────────────────────────────────────────────
    const loadStr = (key, def) => {
        const v = localStorage.getItem(key);
        return v === null ? def : v;
    };

    const loadBool = (key, def) => {
        const v = localStorage.getItem(key);
        if (v === null) {
            if (key === KEYS.reduceMotion) {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
            return def;
        }
        return v === 'true';
    };

    // ── Apply helpers ─────────────────────────────────────────────────────
    const TEXT_SIZES = ['sm', 'lg', 'xl'];

    const applyTextSize = size => {
        TEXT_SIZES.forEach(s => document.documentElement.classList.remove(`a11y-text-${s}`));
        if (size !== 'default') {
            document.documentElement.classList.add(`a11y-text-${size}`);
        }
        localStorage.setItem(KEYS.textSize, size);
    };

    const applyBool = (key, cls, value) => {
        document.body.classList.toggle(cls, value);
        localStorage.setItem(key, String(value));
    };

    // `explicit` = true only when a real person clicked something (widget
    // switch, reset, or the first-visit prompt) — NOT when this is just
    // mirroring the OS preference on load or reacting to a live OS change.
    // maybeShowMotionPrompt() relies on that distinction to know whether the
    // user has ever actually made a choice, since KEYS.reduceMotion itself
    // gets written either way.
    const applyReduceMotion = (value, explicit = false) => {
        document.body.classList.toggle('reduce-motion', value);
        // Inverse companion class — lets base.css's blanket OS-level
        // `prefers-reduced-motion` catch-all be explicitly opted back out of
        // (see base.css), since that media query can't see this class's
        // absence vs. a11y.js simply not having run yet.
        document.body.classList.toggle('motion-enabled', !value);
        localStorage.setItem(KEYS.reduceMotion, String(value));
        if (explicit) localStorage.setItem(KEYS.motionExplicit, 'true');
        applyReduceMotionSvg(value);
    };

    // Separated so it can retry — createHeader() injects the chalk SVG in the
    // next inline script block, after a11y.js has already run applyAll().
    const applyReduceMotionSvg = value => {
        const turb = document.querySelector('#chalkText feTurbulence');
        if (!turb) {
            // SVG not injected yet — retry on the next animation frame
            if (value) {
                requestAnimationFrame(() => applyReduceMotionSvg(true));
            }
            return;
        }

        // Set displacement scale: 0 = no squiggle at all, 3 = normal
        const disp = document.querySelector('#chalkText feDisplacementMap');
        if (disp) disp.setAttribute('scale', value ? '0' : '3');

        const anim = turb.querySelector('animate');
        if (value) {
            if (anim) anim.parentNode.removeChild(anim);
        } else {
            if (!anim) {
                const NS = 'http://www.w3.org/2000/svg';
                const newAnim = document.createElementNS(NS, 'animate');
                newAnim.setAttribute('attributeName', 'seed');
                newAnim.setAttribute('values', '1;5;2;8;3;7;1');
                newAnim.setAttribute('dur', '4s');
                newAnim.setAttribute('repeatCount', 'indefinite');
                turb.appendChild(newAnim);
            }
        }
    };

    const applyDyslexia = value => {
        document.body.classList.toggle('a11y-dyslexia', value);
        localStorage.setItem(KEYS.dyslexia, String(value));
        if (value && !document.getElementById('a11y-dyslexia-font')) {
            const link = document.createElement('link');
            link.id = 'a11y-dyslexia-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
            document.head.appendChild(link);
        }
    };

    // ── Apply all saved preferences immediately (anti-FOUC) ───────────────
    const applyAll = () => {
        applyTextSize(loadStr(KEYS.textSize, 'default'));
        if (loadBool(KEYS.highContrast, false))   document.body.classList.add('a11y-high-contrast');
        if (loadBool(KEYS.dyslexia,     false))   applyDyslexia(true);
        if (loadBool(KEYS.reduceMotion, false))   applyReduceMotion(true);
        if (loadBool(KEYS.highlightLinks, false)) document.body.classList.add('a11y-highlight-links');
    };

    // ── Build widget HTML ─────────────────────────────────────────────────
    const makeSwitchRow = (label, pref) => `
        <div class="a11y-row">
          <span class="a11y-row-label">${label}</span>
          <button class="a11y-switch" data-pref="${pref}"
                  role="switch" aria-checked="false" aria-label="${label}">
            <span class="a11y-switch-track"><span class="a11y-switch-thumb"></span></span>
          </button>
        </div>`;

    const buildWidget = () => {
        const widget = document.createElement('div');
        widget.id = 'a11y-widget';

        widget.innerHTML = `
            <button id="a11y-trigger" aria-expanded="false" aria-controls="a11y-panel"
                    aria-label="Accessibility options" title="Accessibility options">
              <span class="a11y-trigger-icon">
                <img src="/assets/icons/a11y-symbol.png" alt="" aria-hidden="true" width="40" height="40">
              </span>
            </button>
            <div id="a11y-panel" role="dialog" aria-label="Accessibility settings" aria-modal="true" hidden>
              <div class="a11y-panel-header">
                <span class="a11y-panel-title">Accessibility</span>
                <button class="a11y-close" aria-label="Close accessibility panel">&#x2715;</button>
              </div>
              <div class="a11y-options">
                <div class="a11y-row">
                  <span class="a11y-row-label" id="a11y-ts-label">Text Size</span>
                  <div class="a11y-btn-group" role="group" aria-labelledby="a11y-ts-label">
                    <button class="a11y-size-btn" data-size="sm"      aria-pressed="false">A&#8722;</button>
                    <button class="a11y-size-btn" data-size="default" aria-pressed="false">A</button>
                    <button class="a11y-size-btn" data-size="lg"      aria-pressed="false">A+</button>
                    <button class="a11y-size-btn" data-size="xl"      aria-pressed="false">A++</button>
                  </div>
                </div>
                ${makeSwitchRow('High Contrast',          'high-contrast')}
                ${makeSwitchRow('Dyslexia-Friendly Font', 'dyslexia')}
                ${makeSwitchRow('Reduce Motion',          'reduce-motion')}
                ${makeSwitchRow('Highlight Links',        'highlight-links')}
              </div>
              <button class="a11y-reset-btn">&#x21BA; Reset All</button>
            </div>`;

        document.body.appendChild(widget);
        return widget;
    };

    // ── Sync UI to current body state ─────────────────────────────────────
    const syncUI = () => {
        const currentSize = loadStr(KEYS.textSize, 'default');
        document.querySelectorAll('.a11y-size-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', String(btn.dataset.size === currentSize));
        });

        const states = {
            'high-contrast':   loadBool(KEYS.highContrast,   false),
            'dyslexia':        loadBool(KEYS.dyslexia,       false),
            'reduce-motion':   loadBool(KEYS.reduceMotion,   false),
            'highlight-links': loadBool(KEYS.highlightLinks, false)
        };
        document.querySelectorAll('.a11y-switch').forEach(sw => {
            sw.setAttribute('aria-checked', String(states[sw.dataset.pref] || false));
        });
    };

    // ── Wire interactions ─────────────────────────────────────────────────
    const wireWidget = widget => {
        const trigger  = widget.querySelector('#a11y-trigger');
        const panel    = widget.querySelector('#a11y-panel');
        const closeBtn = widget.querySelector('.a11y-close');
        const resetBtn = widget.querySelector('.a11y-reset-btn');

        // Focus-trappable elements
        const getFocusable = () =>
            Array.from(panel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(el => !el.disabled && !el.hidden);

        const openPanel = () => {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            closeBtn.focus();
        };

        const closePanel = () => {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        };

        trigger.addEventListener('click', () => {
            panel.hidden ? openPanel() : closePanel();
        });

        closeBtn.addEventListener('click', closePanel);

        // ── Draggable widget (touch + mouse) ─────────────────────────────
        const POS_KEY = 'a11y-widget-pos';
        const DRAG_THRESHOLD = 6; // px before a press becomes a drag, not a tap

        const applyPos = (x, y) => {
            const w = widget.offsetWidth;
            const h = widget.offsetHeight;
            const cx = Math.max(6, Math.min(x, window.innerWidth  - w - 6));
            const cy = Math.max(6, Math.min(y, window.innerHeight - h - 6));
            widget.style.left = cx + 'px';
            widget.style.right = 'auto';
            widget.style.top = cy + 'px';
            widget.style.bottom = 'auto';
            widget.classList.toggle('a11y-anchor-right', cx + w / 2 > window.innerWidth / 2);
            widget.classList.toggle('a11y-anchor-top',   cy + h / 2 < window.innerHeight / 2);
            return { x: cx, y: cy };
        };

        // Restore a saved position (next frame, so offsetWidth is measured
        // post-layout) — without animating in from the default spot.
        try {
            const saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
            if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
                requestAnimationFrame(() => {
                    widget.style.transition = 'none';
                    applyPos(saved.x, saved.y);
                    void widget.offsetWidth;            // flush before re-enabling
                    widget.style.transition = '';
                });
            }
        } catch (e) { /* ignore */ }

        // Keep it on-screen through rotation / resize
        window.addEventListener('resize', () => {
            if (!widget.style.left) return;
            applyPos(parseFloat(widget.style.left), parseFloat(widget.style.top));
        });

        let dragging = false;
        let moved = false;
        let sx = 0, sy = 0, ox = 0, oy = 0;

        trigger.addEventListener('pointerdown', e => {
            if (typeof e.button === 'number' && e.button !== 0) return;
            dragging = true;
            moved = false;
            sx = e.clientX;
            sy = e.clientY;
            const r = widget.getBoundingClientRect();
            ox = r.left;
            oy = r.top;
            try { trigger.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        });

        trigger.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - sx;
            const dy = e.clientY - sy;
            if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            moved = true;
            widget.classList.add('a11y-dragging');
            if (!panel.hidden) closePanel();
            applyPos(ox + dx, oy + dy);
        });

        const endDrag = e => {
            if (!dragging) return;
            dragging = false;
            widget.classList.remove('a11y-dragging');
            try { trigger.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            if (moved) {
                // Snap to the nearer side edge (keep the vertical position) so it
                // always rests as a proper bookmark tab.
                const r = widget.getBoundingClientRect();
                const toRight = r.left + r.width / 2 > window.innerWidth / 2;
                const snapped = applyPos(toRight ? window.innerWidth : 0, r.top);
                try { localStorage.setItem(POS_KEY, JSON.stringify(snapped)); } catch (err) { /* ignore */ }
            }
        };
        trigger.addEventListener('pointerup', endDrag);
        trigger.addEventListener('pointercancel', endDrag);

        // Swallow the click that fires after a drag so the panel doesn't toggle
        trigger.addEventListener('click', e => {
            if (moved) {
                e.stopImmediatePropagation();
                e.preventDefault();
                moved = false;
            }
        }, true);

        // Keyboard: Escape closes; Tab traps focus inside panel
        widget.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !panel.hidden) {
                closePanel();
                return;
            }
            if (e.key === 'Tab' && !panel.hidden) {
                const focusable = getFocusable();
                if (!focusable.length) return;
                const first = focusable[0];
                const last  = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Click outside closes
        document.addEventListener('click', e => {
            if (!panel.hidden && !widget.contains(e.target)) closePanel();
        });

        // Text size
        widget.querySelectorAll('.a11y-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyTextSize(btn.dataset.size);
                syncUI();
            });
        });

        // Switches
        widget.querySelectorAll('.a11y-switch').forEach(sw => {
            sw.addEventListener('click', () => {
                const pref    = sw.dataset.pref;
                const current = sw.getAttribute('aria-checked') === 'true';
                const next    = !current;
                if      (pref === 'high-contrast')  applyBool(KEYS.highContrast,   'a11y-high-contrast',   next);
                else if (pref === 'dyslexia')        applyDyslexia(next);
                else if (pref === 'reduce-motion')   applyReduceMotion(next, true);
                else if (pref === 'highlight-links') applyBool(KEYS.highlightLinks, 'a11y-highlight-links', next);
                syncUI();
            });
        });

        // Reset
        resetBtn.addEventListener('click', () => {
            Object.values(KEYS).forEach(k => localStorage.removeItem(k));
            applyTextSize('default');
            document.body.classList.remove('a11y-high-contrast', 'a11y-dyslexia', 'a11y-highlight-links');
            // Restore OS motion preference
            const osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            applyReduceMotion(osReduceMotion);
            syncUI();
        });

        // Respect live OS motion preference changes when no manual override is saved
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
            if (localStorage.getItem(KEYS.reduceMotion) === null) {
                applyReduceMotion(e.matches);
                syncUI();
            }
        });
    };

    // ── First-visit motion prompt ───────────────────────────────────────────
    // Only shown when: the OS prefers reduced motion, the user has never
    // explicitly interacted with motion controls before (widget switch,
    // reset, or this prompt), and this prompt hasn't already been dismissed.
    const maybeShowMotionPrompt = () => {
        const osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!osReduceMotion) return;
        if (localStorage.getItem(KEYS.motionExplicit) !== null) return;
        if (localStorage.getItem(KEYS.motionPrompt) !== null) return;

        const banner = document.createElement('div');
        banner.id = 'motion-prompt';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Motion preference');
        banner.innerHTML = `
            <p>Your system prefers reduced motion. This site has a few small
               decorative animations — want to see them anyway?</p>
            <div class="motion-prompt-actions">
                <button type="button" class="motion-prompt-btn motion-prompt-btn--primary">Show animations</button>
                <button type="button" class="motion-prompt-btn">Keep reduced</button>
            </div>`;
        document.body.appendChild(banner);

        const dismiss = () => {
            localStorage.setItem(KEYS.motionPrompt, 'true');
            banner.remove();
        };

        banner.querySelector('.motion-prompt-btn--primary').addEventListener('click', () => {
            applyReduceMotion(false, true);
            syncUI();
            dismiss();
        });
        banner.querySelectorAll('.motion-prompt-btn:not(.motion-prompt-btn--primary)').forEach(btn => {
            btn.addEventListener('click', dismiss);
        });
    };

    // ── Init ──────────────────────────────────────────────────────────────
    // Apply preferences as early as possible to minimise flash
    applyAll();

    const init = () => {
        const widget = buildWidget();
        syncUI();
        wireWidget(widget);
        maybeShowMotionPrompt();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
