// Shared header component for all pages
function createHeader(currentPage) {
    // Determine relative path prefix based on current page
    // If home, we are at root (./). If subpage, we are one level down (../)
    const prefix = currentPage === 'home' ? './' : '../';

    const homePath = prefix;
    const aboutPath = prefix + 'about/';
    const playersPath = prefix + 'players/';
    const galleryPath = prefix + 'gallery/';
    const resourcesPath = prefix + 'resources/';
    const assetsPath = prefix + 'assets/';

    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
        <nav class="navbar">
            <div class="nav-brand">
                <a href="${homePath}">
                    <img src="${assetsPath}minecraft_title(1).png" alt="TSNSMP Logo" class="nav-logo">
                    <span class="nav-title">TSNSMP</span>
                </a>
            </div>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span class="hamburger"></span>
            </button>
            <ul class="nav-links">
                <li><a href="${homePath}" class="${currentPage === 'home' ? 'active' : ''}" ${currentPage === 'home' ? 'aria-current="page"' : ''}>Home</a></li>
                <li><a href="${aboutPath}" class="${currentPage === 'about' ? 'active' : ''}" ${currentPage === 'about' ? 'aria-current="page"' : ''}>About</a></li>
                <li><a href="${playersPath}" class="${currentPage === 'players' ? 'active' : ''}" ${currentPage === 'players' ? 'aria-current="page"' : ''}>Players</a></li>
                <li><a href="${galleryPath}" class="${currentPage === 'gallery' ? 'active' : ''}" ${currentPage === 'gallery' ? 'aria-current="page"' : ''}>Gallery</a></li>
                <li><a href="${resourcesPath}" class="${currentPage === 'resources' ? 'active' : ''}" ${currentPage === 'resources' ? 'aria-current="page"' : ''}>Resources</a></li>
                <li><a href="https://bsky.app/profile/tsnsmp.online" target="_blank" rel="noopener" class="nav-icon" aria-label="Follow TSNSMP on Bluesky" title="Follow TSNSMP on Bluesky"><img src="${assetsPath}icons/bluesky.svg" alt="Bluesky" class="nav-icon-img"></a></li>
                <li><a href="${prefix}admin/" class="nav-admin-link ${currentPage === 'admin' ? 'active' : ''}" ${currentPage === 'admin' ? 'aria-current="page"' : ''}>⚙️ Admin</a></li>
            </ul>
            <button class="theme-toggle" aria-label="Toggle dark mode">
                <span class="theme-icon" aria-hidden="true">🌙</span>
            </button>
        </nav>
    `;

    // Insert skip link before header for keyboard users
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Insert at beginning of body (after skip link)
    document.body.insertBefore(header, skipLink.nextSibling);

    // Setup mobile toggle
    const toggle = header.querySelector('.nav-toggle');
    const navLinks = header.querySelector('.nav-links');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            const firstLink = navLinks.querySelector('a');
            if (firstLink) firstLink.focus();
        } else {
            toggle.focus();
        }
    });

    // Setup theme toggle
    const themeBtn = header.querySelector('.theme-toggle');
    const themeIcon = themeBtn.querySelector('.theme-icon');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeIcon.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.remove('dark-mode');
        themeIcon.textContent = '☀️';
    }

    // Initialize scroll check
    handleScroll();

    // Inject chalk SVG filter for heading text (animation managed by a11y.js)
    // Check reduce-motion preference before injecting so no wobbly frame
    // occurs even before a11y.js runs its requestAnimationFrame cleanup.
    const reduceMotionSaved = localStorage.getItem('reduceMotion');
    const reduceMotionOS    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skipAnimate       = reduceMotionSaved !== null ? reduceMotionSaved === 'true' : reduceMotionOS;

    const chalkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chalkSvg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    chalkSvg.setAttribute('aria-hidden', 'true');
    chalkSvg.innerHTML = `
        <defs>
            <filter id="chalkText">
                <feTurbulence type="turbulence" baseFrequency="0.015 0.022" numOctaves="3" seed="3" result="turb">${skipAnimate ? '' : `
                    <animate attributeName="seed" values="1;5;2;8;3;7;1" dur="4s" repeatCount="indefinite"/>`}
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="turb" scale="${skipAnimate ? '0' : '3'}" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
        </defs>`;
    document.body.appendChild(chalkSvg);
}

function handleScroll() {
    const header = document.querySelector('.site-header');
    if (header) {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

window.addEventListener('scroll', handleScroll);

// Back-to-top button
(function () {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.id = 'backToTop';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// Export for use in pages
window.createHeader = createHeader;