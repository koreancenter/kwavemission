(function () {
    'use strict';

    const isMobileMotion = window.matchMedia('(max-width: 640px)').matches;

    const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px'
    });

    function applyStaggerReveal(containerSelector, stepMs) {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(function (container) {
            const children = Array.from(container.children);
            children.forEach(function (child, index) {
                if (child.dataset.revealBound === 'true') return;
                child.dataset.revealBound = 'true';
                child.classList.add('reveal-item');
                child.style.setProperty('--reveal-delay', Math.min(index * stepMs, 420) + 'ms');
                revealObserver.observe(child);
            });
        });
    }

    function initializeRevealAnimations() {
        const staggerStep = isMobileMotion ? 44 : 72;
        const newsStaggerStep = isMobileMotion ? 36 : 62;
        applyStaggerReveal('#about .grid', staggerStep);
        applyStaggerReveal('#programs #prog-slider', staggerStep);
        applyStaggerReveal('#news-container', newsStaggerStep);
    }

    window.initializeRevealAnimations = initializeRevealAnimations;
    window.addEventListener('news:rendered', function () {
        applyStaggerReveal('#news-container', isMobileMotion ? 36 : 62);
    });
})();
