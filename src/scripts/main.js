// Scroll animations — observer declared at module scope so it's ready before DOMContentLoaded
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target); // stop watching once animated
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// Pause CSS animations in sections that are off-screen to save GPU/CPU
const pauseObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = '';
            entry.target.classList.remove('paused-offscreen');
        } else {
            entry.target.style.animationPlayState = 'paused';
            entry.target.classList.add('paused-offscreen');
        }
    });
}, { rootMargin: '100px 0px' });

document.addEventListener('DOMContentLoaded', function() {
    // Observe elements for scroll-in animation
    document.querySelectorAll('.feature-card, .stat-card, .custom-feature, .story-card, .player-showcase-item').forEach(el => {
        observer.observe(el);
    });

    // Pause animations in off-screen sections to reduce GPU load
    document.querySelectorAll('.hero, .player-showcase, .features, .customization-showcase, .application-section, .events-section').forEach(el => {
        pauseObserver.observe(el);
    });

    // Stagger floating animation on flower elements
    document.querySelectorAll('.flower').forEach((flower, index) => {
        flower.style.animationDelay = `${index * 0.5}s`;
    });

    // Page exit transition
    const main = document.querySelector('main');
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (
            href &&
            !href.startsWith('#') &&
            !href.startsWith('http') &&
            !href.startsWith('mailto') &&
            !href.startsWith('javascript') &&
            !link.hasAttribute('target') &&
            !link.dataset.noTransition
        ) {
            link.addEventListener('click', e => {
                e.preventDefault();
                if (main) main.style.animation = 'pageExit 0.25s ease forwards';
                setTimeout(() => { window.location.href = href; }, 230);
            });
        }
    });
});

// Console easter egg
console.log(`
🌸 Welcome to TSNSMP! 🌸
Thanks for checking out our code!
If you're interested in joining our community,
check out our website! 💚

Built with love by the TSNSMP team ✨
`);

// Error handling for missing elements
window.addEventListener('error', function(e) {
    console.error('Non-critical error caught:', e.message);
});
