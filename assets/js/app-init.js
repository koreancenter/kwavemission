(function () {
    'use strict';

    function initApp() {
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (typeof window.setupMobileMenuToggle === 'function') {
            window.setupMobileMenuToggle();
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
    }

    document.addEventListener('DOMContentLoaded', initApp);
})();
