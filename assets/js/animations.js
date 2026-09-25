(function () {
    'use strict';

    const isMobileMotion = window.matchMedia('(max-width: 640px)').matches;

    const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const target = entry.target;
            target.classList.add('is-visible');
            target.addEventListener('transitionend', function onEnd(e) {
                if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                    target.style.willChange = 'auto';
                    target.removeEventListener('transitionend', onEnd);
                }
            });
            observer.unobserve(target);
        });
    }, {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px'
    });

    function applyStaggerReveal(containerSelector, stepMs, maxDelay) {
        const limitDelay = typeof maxDelay === 'number' ? maxDelay : 420;
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(function (container) {
            const children = Array.from(container.children);
            children.forEach(function (child, index) {
                if (child.dataset.revealBound === 'true') return;
                child.dataset.revealBound = 'true';
                child.classList.add('reveal-item');
                child.style.setProperty('--reveal-delay', Math.min(index * stepMs, limitDelay) + 'ms');
                revealObserver.observe(child);
            });
        });
    }

    function initializeRevealAnimations() {
        const staggerStep = isMobileMotion ? 44 : 72;
        const newsStaggerStep = isMobileMotion ? 36 : 62;
        const partnerStaggerStep = isMobileMotion ? 60 : 80;
        applyStaggerReveal('#about .grid', staggerStep);
        applyStaggerReveal('#programs #prog-slider', staggerStep);
        applyStaggerReveal('#news-container', newsStaggerStep);
        applyStaggerReveal('#partners .partner-grid', partnerStaggerStep, 500);
    }

    window.initializeRevealAnimations = initializeRevealAnimations;
    window.addEventListener('news:rendered', function () {
        applyStaggerReveal('#news-container', isMobileMotion ? 36 : 62);
    });
})();
