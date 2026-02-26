document.addEventListener('DOMContentLoaded', function() {
    const themeBtn = document.getElementById('theme-btn');
    const body = document.body;
    
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        if (savedTheme === 'light') {
            body.classList.remove('dark-mode');
        } else {
            body.classList.add('dark-mode');
        }
    } else {
        // Default to dark mode
        body.classList.add('dark-mode');
    }
    
    // Theme toggle button event listener
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            
            // Save theme preference
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Smooth scrolling for application button
function scrollToApplication() {
    const applicationSection = document.getElementById('application');
    if (applicationSection) {
        applicationSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.feature-card, .stat-card, .custom-feature, .story-card, .player-showcase-item');
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Add floating animation to flowers
document.addEventListener('DOMContentLoaded', function() {
    const flowers = document.querySelectorAll('.flower');
    
    flowers.forEach((flower, index) => {
        flower.style.animationDelay = `${index * 0.5}s`;
    });
});

// Page exit transition
document.addEventListener('DOMContentLoaded', () => {
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
                if (main) {
                    main.style.animation = 'pageExit 0.25s ease forwards';
                }
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

// Mobile menu handling (if needed in future)
function toggleMobileMenu() {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.classList.toggle('mobile-open');
    }
}

// Prevent right-click on images (optional protection)
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        img.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    });
});