/**
 * TSNSMP Accessibility Widget
 * Floating panel with: text size, high contrast, dyslexia font,
 * reduce motion, and highlight links toggles.
 * All preferences persisted in localStorage.
 */
(function () {
    'use strict';

    // ── Storage keys ──────────────────────────────────────────────────────
    var KEYS = {
        textSize:       'a11y-text-size',
        highContrast:   'a11y-high-contrast',
        dyslexia:       'a11y-dyslexia',
        reduceMotion:   'reduceMotion',   // shared with header.js
        highlightLinks: 'a11y-highlight-links'
    };

    // ── Helpers ───────────────────────────────────────────────────────────
    function loadStr(key, def) {
        var v = localStorage.getItem(key);
        return v === null ? def : v;
    }

    function loadBool(key, def) {
        var v = localStorage.getItem(key);
        if (v === null) {
            if (key === KEYS.reduceMotion) {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
            return def;
        }
        return v === 'true';
    }

    // ── Apply helpers ─────────────────────────────────────────────────────
    var TEXT_SIZES = ['sm', 'lg', 'xl'];

    function applyTextSize(size) {
        TEXT_SIZES.forEach(function (s) {
            document.documentElement.classList.remove('a11y-text-' + s);
        });
        if (size !== 'default') {
            document.documentElement.classList.add('a11y-text-' + size);
        }
        localStorage.setItem(KEYS.textSize, size);
    }

    function applyBool(key, cls, value) {
        document.body.classList.toggle(cls, value);
        localStorage.setItem(key, String(value));
    }

    function applyReduceMotion(value) {
        document.body.classList.toggle('reduce-motion', value);
        localStorage.setItem(KEYS.reduceMotion, String(value));
        applyReduceMotionSvg(value);
    }

    // Separated so it can retry — createHeader() injects the chalk SVG in the
    // next inline script block, after a11y.js has already run applyAll().
    function applyReduceMotionSvg(value) {
        var turb = document.querySelector('#chalkText feTurbulence');
        if (!turb) {
            // SVG not injected yet — retry on the next animation frame
            if (value) {
                requestAnimationFrame(function () { applyReduceMotionSvg(true); });
            }
            return;
        }

        // Set displacement scale: 0 = no squiggle at all, 3 = normal
        var disp = document.querySelector('#chalkText feDisplacementMap');
        if (disp) disp.setAttribute('scale', value ? '0' : '3');

        var anim = turb.querySelector('animate');
        if (value) {
            if (anim) anim.parentNode.removeChild(anim);
        } else {
            if (!anim) {
                var NS = 'http://www.w3.org/2000/svg';
                var newAnim = document.createElementNS(NS, 'animate');
                newAnim.setAttribute('attributeName', 'seed');
                newAnim.setAttribute('values', '1;5;2;8;3;7;1');
                newAnim.setAttribute('dur', '4s');
                newAnim.setAttribute('repeatCount', 'indefinite');
                turb.appendChild(newAnim);
            }
        }
    }

    function applyDyslexia(value) {
        document.body.classList.toggle('a11y-dyslexia', value);
        localStorage.setItem(KEYS.dyslexia, String(value));
        if (value && !document.getElementById('a11y-dyslexia-font')) {
            var link = document.createElement('link');
            link.id = 'a11y-dyslexia-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
            document.head.appendChild(link);
        }
    }

    // ── Apply all saved preferences immediately (anti-FOUC) ───────────────
    function applyAll() {
        applyTextSize(loadStr(KEYS.textSize, 'default'));
        if (loadBool(KEYS.highContrast, false))   document.body.classList.add('a11y-high-contrast');
        if (loadBool(KEYS.dyslexia,     false))   applyDyslexia(true);
        if (loadBool(KEYS.reduceMotion, false))   applyReduceMotion(true);
        if (loadBool(KEYS.highlightLinks, false)) document.body.classList.add('a11y-highlight-links');
    }

    // ── Build widget HTML ─────────────────────────────────────────────────
    function buildWidget() {
        var widget = document.createElement('div');
        widget.id = 'a11y-widget';

        widget.innerHTML = [
            '<button id="a11y-trigger" aria-expanded="false" aria-controls="a11y-panel"',
            '        aria-label="Accessibility options" title="Accessibility options">',
            '  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"',
            '       xmlns="http://www.w3.org/2000/svg" width="28" height="28">',
            '    <circle cx="12" cy="4.5" r="1.75" fill="currentColor"/>',
            '    <path d="M8 9h8M12 9v4.5M9.5 21l1-3 1.5 1.5 1.5-1.5 1 3"',
            '          stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
            '    <path d="M9.5 13.5L8 21M14.5 13.5L16 21"',
            '          stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
            '  </svg>',
            '</button>',
            '<div id="a11y-panel" role="dialog" aria-label="Accessibility settings" aria-modal="true" hidden>',
            '  <div class="a11y-panel-header">',
            '    <span class="a11y-panel-title">Accessibility</span>',
            '    <button class="a11y-close" aria-label="Close accessibility panel">&#x2715;</button>',
            '  </div>',
            '  <div class="a11y-options">',

            '    <div class="a11y-row">',
            '      <span class="a11y-row-label" id="a11y-ts-label">Text Size</span>',
            '      <div class="a11y-btn-group" role="group" aria-labelledby="a11y-ts-label">',
            '        <button class="a11y-size-btn" data-size="sm"      aria-pressed="false">A&#8722;</button>',
            '        <button class="a11y-size-btn" data-size="default" aria-pressed="false">A</button>',
            '        <button class="a11y-size-btn" data-size="lg"      aria-pressed="false">A+</button>',
            '        <button class="a11y-size-btn" data-size="xl"      aria-pressed="false">A++</button>',
            '      </div>',
            '    </div>',

            makeSwitchRow('High Contrast',           'high-contrast'),
            makeSwitchRow('Dyslexia-Friendly Font',  'dyslexia'),
            makeSwitchRow('Reduce Motion',           'reduce-motion'),
            makeSwitchRow('Highlight Links',         'highlight-links'),

            '  </div>',
            '  <button class="a11y-reset-btn">&#x21BA; Reset All</button>',
            '</div>'
        ].join('\n');

        document.body.appendChild(widget);
        return widget;
    }

    function makeSwitchRow(label, pref) {
        return [
            '<div class="a11y-row">',
            '  <span class="a11y-row-label">' + label + '</span>',
            '  <button class="a11y-switch" data-pref="' + pref + '"',
            '          role="switch" aria-checked="false" aria-label="' + label + '">',
            '    <span class="a11y-switch-track"><span class="a11y-switch-thumb"></span></span>',
            '  </button>',
            '</div>'
        ].join('\n');
    }

    // ── Sync UI to current body state ─────────────────────────────────────
    function syncUI() {
        var currentSize = loadStr(KEYS.textSize, 'default');
        document.querySelectorAll('.a11y-size-btn').forEach(function (btn) {
            btn.setAttribute('aria-pressed', String(btn.dataset.size === currentSize));
        });

        var states = {
            'high-contrast':  loadBool(KEYS.highContrast,   false),
            'dyslexia':       loadBool(KEYS.dyslexia,       false),
            'reduce-motion':  loadBool(KEYS.reduceMotion,   false),
            'highlight-links': loadBool(KEYS.highlightLinks, false)
        };
        document.querySelectorAll('.a11y-switch').forEach(function (sw) {
            sw.setAttribute('aria-checked', String(states[sw.dataset.pref] || false));
        });
    }

    // ── Wire interactions ─────────────────────────────────────────────────
    function wireWidget(widget) {
        var trigger  = widget.querySelector('#a11y-trigger');
        var panel    = widget.querySelector('#a11y-panel');
        var closeBtn = widget.querySelector('.a11y-close');
        var resetBtn = widget.querySelector('.a11y-reset-btn');

        // Focus-trappable elements
        function getFocusable() {
            return Array.from(panel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(function (el) { return !el.disabled && !el.hidden; });
        }

        function openPanel() {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            closeBtn.focus();
        }

        function closePanel() {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        }

        trigger.addEventListener('click', function () {
            panel.hidden ? openPanel() : closePanel();
        });

        closeBtn.addEventListener('click', closePanel);

        // Keyboard: Escape closes; Tab traps focus inside panel
        widget.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) {
                closePanel();
                return;
            }
            if (e.key === 'Tab' && !panel.hidden) {
                var focusable = getFocusable();
                if (!focusable.length) return;
                var first = focusable[0];
                var last  = focusable[focusable.length - 1];
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
        document.addEventListener('click', function (e) {
            if (!panel.hidden && !widget.contains(e.target)) closePanel();
        });

        // Text size
        widget.querySelectorAll('.a11y-size-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                applyTextSize(btn.dataset.size);
                syncUI();
            });
        });

        // Switches
        widget.querySelectorAll('.a11y-switch').forEach(function (sw) {
            sw.addEventListener('click', function () {
                var pref    = sw.dataset.pref;
                var current = sw.getAttribute('aria-checked') === 'true';
                var next    = !current;
                if      (pref === 'high-contrast')  applyBool(KEYS.highContrast,   'a11y-high-contrast',   next);
                else if (pref === 'dyslexia')        applyDyslexia(next);
                else if (pref === 'reduce-motion')   applyReduceMotion(next);
                else if (pref === 'highlight-links') applyBool(KEYS.highlightLinks, 'a11y-highlight-links', next);
                syncUI();
            });
        });

        // Reset
        resetBtn.addEventListener('click', function () {
            Object.values(KEYS).forEach(function (k) { localStorage.removeItem(k); });
            applyTextSize('default');
            document.body.classList.remove('a11y-high-contrast', 'a11y-dyslexia', 'a11y-highlight-links');
            // Restore OS motion preference
            var osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            applyReduceMotion(osReduceMotion);
            syncUI();
        });

        // Respect live OS motion preference changes when no manual override is saved
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
            if (localStorage.getItem(KEYS.reduceMotion) === null) {
                applyReduceMotion(e.matches);
                syncUI();
            }
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────
    // Apply preferences as early as possible to minimise flash
    applyAll();

    function init() {
        var widget = buildWidget();
        syncUI();
        wireWidget(widget);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
