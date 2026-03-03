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
                <li><a href="${homePath}" class="${currentPage === 'home' ? 'active' : ''}">Home</a></li>
                <li><a href="${aboutPath}" class="${currentPage === 'about' ? 'active' : ''}">About</a></li>
                <li><a href="${playersPath}" class="${currentPage === 'players' ? 'active' : ''}">Players</a></li>
                <li><a href="${galleryPath}" class="${currentPage === 'gallery' ? 'active' : ''}">Gallery</a></li>
                <li><a href="${resourcesPath}" class="${currentPage === 'resources' ? 'active' : ''}">Resources</a></li>
                <li><a href="https://bsky.app/profile/tsnsmp.online" target="_blank" rel="noopener" class="nav-icon" aria-label="Follow TSNSMP on Bluesky" title="Follow TSNSMP on Bluesky"><img src="${assetsPath}icons/bluesky.svg" alt="Bluesky" class="nav-icon-img"></a></li>
                <li><a href="https://discord.gg/pySpekTJ7E" target="_blank" rel="noopener" class="nav-icon" aria-label="Join TSNSMP on Discord" title="Join TSNSMP on Discord"><img src="${assetsPath}icons/discord.svg" alt="Discord" class="nav-icon-img"></a></li>
                <li><a href="${prefix}admin/" class="${currentPage === 'admin' ? 'active' : ''}" style="color: var(--s3-teal); font-weight: 700;">⚙️ Admin</a></li>
            </ul>
            <button class="theme-toggle" aria-label="Toggle dark mode">
                <span class="theme-icon">🌙</span>
            </button>
        </nav>
    `;

    // Insert at beginning of body
    document.body.insertBefore(header, document.body.firstChild);

    // Setup mobile toggle
    const toggle = header.querySelector('.nav-toggle');
    const navLinks = header.querySelector('.nav-links');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', String(isOpen));
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

// Export for use in pages
window.createHeader = createHeader;