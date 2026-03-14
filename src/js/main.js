// Scroll animations — observer declared at module scope so it's ready before DOMContentLoaded
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target); // stop watching once animated
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;

    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
    } else {
        body.classList.add('dark-mode');
    }

    // Theme toggle button (legacy fallback — header.js handles the main toggle)
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Observe elements for scroll-in animation
    document.querySelectorAll('.feature-card, .stat-card, .custom-feature, .story-card, .player-showcase-item').forEach(el => {
        observer.observe(el);
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
head over to our Discord! 💚

Built with love by the TSNSMP team ✨
`);

// Error handling for missing elements
window.addEventListener('error', function(e) {
    console.log('Non-critical error caught:', e.message);
});

