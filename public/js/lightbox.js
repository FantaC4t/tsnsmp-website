// Shared lightbox — used by the home page's carousel and the gallery grid.
// Both pages have identical #lightbox markup (see Layout-independent pages
// index.astro / gallery/index.astro), so this one module drives both instead
// of each page carrying its own copy of the same open/close/nav logic.
(function () {
    let items = [];
    let index = 0;
    let openTime = 0;  // guards against mobile ghost clicks right after opening
    let trigger = null; // element to return focus to on close

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function setItems(newItems) {
        items = newItems;
    }

    function open(i) {
        if (i < 0 || i >= items.length) return;
        index = i;
        const item = items[i];
        if (!item) return;
        trigger = document.activeElement;
        document.getElementById('lightbox-img').src = item.url;
        document.getElementById('lightbox-img').alt = item.title || 'Gallery image';
        document.getElementById('lightbox-title').textContent = item.title || '';
        document.getElementById('lightbox-desc').textContent = item.description || '';
        const lb = document.getElementById('lightbox');
        lb.classList.add('active');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        openTime = Date.now();
        document.getElementById('lightbox-close-btn').focus();
    }

    function close() {
        // Ignore ghost/synthetic clicks that fire within 350ms of opening
        if (Date.now() - openTime < 350) return;
        const lb = document.getElementById('lightbox');
        lb.classList.remove('active');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Resume the home page's carousel animation, if present
        const track = document.getElementById('carouselTrack');
        if (track) track.style.animationPlayState = '';
        if (trigger && trigger.focus) { trigger.focus(); trigger = null; }
    }

    function shift(dir) {
        if (!items.length) return;
        openTime = Date.now(); // reset guard for nav
        open((index + dir + items.length) % items.length);
    }

    function wire() {
        const lb = document.getElementById('lightbox');
        if (!lb) return; // page has no lightbox (e.g. not home/gallery) — no-op

        lb.addEventListener('click', function (e) {
            if (e.target === this) close();
        });
        document.getElementById('lightbox-close-btn').addEventListener('click', close);
        document.getElementById('lightbox-prev-btn').addEventListener('click', function (e) {
            e.stopPropagation(); shift(-1);
        });
        document.getElementById('lightbox-next-btn').addEventListener('click', function (e) {
            e.stopPropagation(); shift(1);
        });
        document.getElementById('lightbox-inner').addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.addEventListener('keydown', function (e) {
            if (!lb.classList.contains('active')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') shift(-1);
            if (e.key === 'ArrowRight') shift(1);
        });

        // Swipe navigation for mobile
        let touchStartX = 0, touchStartY = 0;
        lb.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });
        lb.addEventListener('touchend', function (e) {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx < 0) shift(1);  // swipe left -> next
                else        shift(-1); // swipe right -> prev
            }
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
    } else {
        wire();
    }

    window.Lightbox = { open, close, shift, setItems, esc };
})();
