// Shared footer component for all pages
function createFooter(currentPage) {
    const prefix = currentPage === 'home' ? './' : '../';

    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div class="container">
            <div class="footer-content">
                <div class="footer-logo">
                    <img src="${prefix}assets/big_logo.png" alt="TSNSMP Logo">
                    <p>A cozy, whitelisted Minecraft SMP.</p>
                </div>
                <div class="footer-links">
                    <h4>Pages</h4>
                    <ul>
                        <li><a href="${prefix}">Home</a></li>
                        <li><a href="${prefix}about/">About</a></li>
                        <li><a href="${prefix}players/">Players</a></li>
                        <li><a href="${prefix}gallery/">Gallery</a></li>
                        <li><a href="${prefix}resources/">Resources</a></li>
                    </ul>
                </div>
                <div class="footer-social">
                    <h4>Community</h4>
                    <div class="social-links">
                        <a href="https://discord.gg/pySpekTJ7E" target="_blank" rel="noopener" class="social-link">Discord</a>
                        <a href="https://bsky.app/profile/tsnsmp.online" target="_blank" rel="noopener" class="social-link">Bluesky</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} TSNSMP. Not affiliated with Mojang Studios.</p>
            </div>
        </div>
    `;

    document.body.appendChild(footer);
}

window.createFooter = createFooter;
