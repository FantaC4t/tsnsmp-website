// Shared footer component for all pages
function createFooter(currentPage) {
    const prefix = currentPage === 'home' ? './' : '../';

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
        <div class="footer-inner">
            <nav class="footer-nav" aria-label="Footer">
                <a href="${prefix}" data-no-transition>Home</a>
                <a href="${prefix}about/" data-no-transition>About</a>
                <a href="${prefix}players/" data-no-transition>Players</a>
                <a href="${prefix}gallery/" data-no-transition>Gallery</a>
                <a href="${prefix}resources/" data-no-transition>Resources</a>
            </nav>
            <div class="footer-social">
                <a href="https://discord.gg/5MhJyzMAk5" target="_blank" rel="noopener" class="footer-icon" aria-label="Discord">
                    <img src="${prefix}assets/icons/discord.svg" alt="Discord">
                </a>
                <a href="https://bsky.app/profile/tsnsmp.online" target="_blank" rel="noopener" class="footer-icon" aria-label="Bluesky">
                    <img src="${prefix}assets/icons/bluesky.svg" alt="Bluesky">
                </a>
            </div>
            <p class="footer-copy">&copy; ${new Date().getFullYear()} TSNSMP &middot; Not affiliated with Mojang Studios.</p>
        </div>
    `;

    document.body.appendChild(footer);
}

window.createFooter = createFooter;
