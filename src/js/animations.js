// This file contains JavaScript functions for animations and transitions on the website. 

document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.animate');

    elements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = 1;
            element.style.transform = 'translateY(0)';
        }, 100);
    });
});

function fadeIn(element, duration = 500) {
    element.style.opacity = 0;
    element.style.display = 'block';

    let start = null;

    function animation(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        element.style.opacity = Math.min(progress / duration, 1);
        if (progress < duration) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

function fadeOut(element, duration = 500) {
    element.style.opacity = 1;

    let start = null;

    function animation(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        element.style.opacity = Math.max(1 - progress / duration, 0);
        if (progress < duration) {
            requestAnimationFrame(animation);
        } else {
            element.style.display = 'none';
        }
    }

    requestAnimationFrame(animation);
}