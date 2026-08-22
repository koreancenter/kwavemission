(function () {
    'use strict';

    function isModalActuallyOpen() {
        var openModal = document.querySelector('.modal-root.modal-active, #news-modal:not(.hidden), #md-modal:not(.hidden), #legal-modal:not(.hidden), #contact-modal:not(.hidden)');
        if (openModal) return true;

        var drawer = document.getElementById('kwave-drawer');
        if (drawer && !drawer.classList.contains('-translate-x-full')) return true;

        return false;
    }

    function ensureNativeScrollState() {
        if (!isModalActuallyOpen()) {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (document.body.style.position === 'fixed') {
                document.body.style.position = '';
            }
            if (typeof window.unlockPageScroll === 'function') {
                window.unlockPageScroll(null);
            }
        }
    }

    function initApp() {
        ensureNativeScrollState();

        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (typeof window.setupMobileMenuToggle === 'function') {
            window.setupMobileMenuToggle();
        }

        if (typeof window.setupSmoothNavigation === 'function') {
            window.setupSmoothNavigation();
        }

        if (typeof window.bindScrollProgress === 'function') {
            window.bindScrollProgress();
        }

        if (typeof window.initializeRevealAnimations === 'function') {
            window.initializeRevealAnimations();
        }

        if (typeof window.initProgramSlider === 'function') {
            window.initProgramSlider();
        }

        if (typeof window.filterPrograms === 'function') {
            const defaultBtn = document.querySelector('.prog-filter-btn');
            window.filterPrograms('all', defaultBtn);
        }

        if (typeof window.initBackToTop === 'function') {
            window.initBackToTop();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    // Handle BFCache back/forward navigation and popstate history
    window.addEventListener('pageshow', function () {
        var drawer = document.getElementById('kwave-drawer');
        var backdrop = document.getElementById('kwave-drawer-backdrop');
        if (drawer && drawer.classList.contains('-translate-x-full')) {
            if (backdrop) {
                backdrop.classList.add('hidden');
                backdrop.classList.add('opacity-0');
            }
        }
        ensureNativeScrollState();
    });

    window.addEventListener('popstate', function () {
        ensureNativeScrollState();
    });

    window.addEventListener('pagehide', function () {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    });

    window.ensureNativeScrollState = ensureNativeScrollState;
})();
