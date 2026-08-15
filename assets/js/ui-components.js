(function () {
    'use strict';

    const isMobileMotion = window.matchMedia('(max-width: 640px)').matches;
    const MODAL_EXIT_MS = isMobileMotion ? 180 : 220;
    const scrollProgressBar = document.getElementById('scroll-progress-bar');

    function activateModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        requestAnimationFrame(function () {
            modal.classList.add('modal-active');
        });
    }

    function deactivateModal(modal, onClosed) {
        if (!modal) return;
        modal.classList.remove('modal-active');
        setTimeout(function () {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (typeof onClosed === 'function') onClosed();
        }, MODAL_EXIT_MS);
    }

    function updateScrollProgress() {
        if (!scrollProgressBar) return;
        const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScrollable > 0 ? window.scrollY / maxScrollable : 0;
        scrollProgressBar.style.transform = 'scaleX(' + Math.min(Math.max(progress, 0), 1) + ')';
    }

    function bindScrollProgress() {
        updateScrollProgress();
        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        window.addEventListener('resize', updateScrollProgress);
    }

    function setupMobileMenuToggle() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (!menuToggle || !mobileMenu) return;
        menuToggle.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    function showShareToast(message) {
        let toast = document.getElementById('share-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'share-toast';
            toast.className = 'fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl opacity-0 pointer-events-none transition-opacity duration-200';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.remove('opacity-0');
        toast.classList.add('opacity-100');
        clearTimeout(showShareToast._timer);
        showShareToast._timer = setTimeout(function () {
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0');
        }, 1800);
    }

    function filterPrograms(type, btnElement) {
        const btns = document.querySelectorAll('.prog-filter-btn');
        btns.forEach(function (btn) {
            btn.classList.remove('active');
        });

        const activeBtn = btnElement || document.querySelector('.prog-filter-btn[onclick*="\'' + type + '\'"]') || document.querySelector('.prog-filter-btn');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        const slider = document.getElementById('prog-slider');
        const cards = document.querySelectorAll('.prog-card');

        cards.forEach(function (card) {
            card.style.display = (type === 'all' || card.classList.contains(type)) ? 'flex' : 'none';
        });

        if (slider) slider.scrollTo({ left: 0, behavior: 'smooth' });
    }

    function initProgramSlider() {
        const slider = document.getElementById('prog-slider');
        if (!slider) return;

        const getCardWidth = function () {
            const card = slider.querySelector('.prog-card[style*="display: none"]') ? slider.querySelector('.prog-card:not([style*="display: none"])') : slider.querySelector('.prog-card');
            return (card ? card.offsetWidth : 356) + 24;
        };

        const prevBtn = document.getElementById('prog-prev');
        const nextBtn = document.getElementById('prog-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                slider.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                slider.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
            });
        }
    }

    window.activateModal = activateModal;
    window.deactivateModal = deactivateModal;
    window.showShareToast = showShareToast;
    window.filterPrograms = filterPrograms;
    window.setupMobileMenuToggle = setupMobileMenuToggle;
    window.bindScrollProgress = bindScrollProgress;
    window.initProgramSlider = initProgramSlider;
})();
