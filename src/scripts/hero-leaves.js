// Drifting matcha leaves on every page's hero. Loaded once from Layout.astro.
//
// It finds the page's hero (the home `.hero` or an inner-page `.page-hero`),
// makes sure a `#heroParticles` canvas exists inside it, and starts the leaf
// animation. The home hero already has the canvas in its markup (alongside its
// stars + rays canvases) — here we just create one where it's missing.

import { initHeroParticles } from './hero-particles.js';

const hero = document.querySelector('.hero, .page-hero');

if (hero) {
    if (!hero.querySelector('#heroParticles')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'heroParticles';
        canvas.className = 'hero-particles';
        canvas.setAttribute('aria-hidden', 'true');
        hero.insertBefore(canvas, hero.firstChild);
    }
    initHeroParticles();
}
