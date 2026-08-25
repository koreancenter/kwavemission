(function () {
    'use strict';

    const isMobileMotion = window.matchMedia('(max-width: 640px)').matches;
    const MODAL_EXIT_MS = isMobileMotion ? 180 : 220;
    const scrollProgressBar = document.getElementById('scroll-progress-bar');
    const scrollLockOwners = new Set();
    let bodyOverflowBeforeLock = '';

    function isModalElement(el) {
        if (!el || !(el instanceof HTMLElement)) return false;
        if (['SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'NAV', 'BODY', 'HTML'].includes(el.tagName)) {
            return false;
        }
        return el.classList.contains('modal-root') ||
               el.classList.contains('modal') ||
               el.id.endsWith('-modal') ||
               el.id.endsWith('Modal') ||
               el.id === 'kwave-drawer';
    }

    function lockPageScroll(owner) {
        if (!owner || !isModalElement(owner) || scrollLockOwners.has(owner)) return;
        if (scrollLockOwners.size === 0) {
            bodyOverflowBeforeLock = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        scrollLockOwners.add(owner);
    }

    function unlockPageScroll(owner) {
        if (!owner) {
            scrollLockOwners.clear();
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            bodyOverflowBeforeLock = '';
            return;
        }
        scrollLockOwners.delete(owner);
        if (scrollLockOwners.size === 0) {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            bodyOverflowBeforeLock = '';
        }
    }

    function activateModal(modal) {
        if (!modal || !isModalElement(modal)) return;
        lockPageScroll(modal);
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
            unlockPageScroll(modal);
            if (typeof onClosed === 'function') onClosed();
        }, MODAL_EXIT_MS);
    }

    let scrollTicking = false;
    function updateScrollProgress() {
        if (!scrollProgressBar || scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(function () {
            const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScrollable > 0 ? window.scrollY / maxScrollable : 0;
            scrollProgressBar.style.transform = 'scaleX(' + Math.min(Math.max(progress, 0), 1) + ')';
            scrollTicking = false;
        });
    }

    function bindScrollProgress() {
        updateScrollProgress();
        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        window.addEventListener('resize', updateScrollProgress, { passive: true });
    }

    function smoothScrollToElement(targetIdOrElement) {
        if (!targetIdOrElement) return;
        const target = typeof targetIdOrElement === 'string'
            ? document.getElementById(targetIdOrElement.replace(/^#/, ''))
            : targetIdOrElement;

        if (!target) return;

        const header = document.querySelector('header') || document.querySelector('.glass-nav') || document.querySelector('nav');
        const headerHeight = header ? header.offsetHeight : 80;
        const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        const offsetPosition = Math.max(0, targetTop);

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    function setupSmoothNavigation() {
        document.addEventListener('click', function (e) {
            const link = e.target.closest('a[href*="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;

            // Check if link points to a hash on the current page
            const hashIndex = href.indexOf('#');
            if (hashIndex === -1) return;

            const path = href.substring(0, hashIndex);
            const hash = href.substring(hashIndex + 1);

            const isCurrentPage = !path ||
                path === '.' ||
                path === './' ||
                path === window.location.pathname ||
                path === window.location.pathname.split('/').pop() ||
                (window.location.pathname.endsWith('index.html') && (path === '' || path === './index.html' || path === 'index.html'));

            if (!isCurrentPage || !hash) return;

            const targetSection = document.getElementById(hash);
            if (!targetSection) return;

            e.preventDefault();

            const completeScroll = function () {
                smoothScrollToElement(targetSection);
                if (window.history.pushState) {
                    window.history.pushState(null, '', '#' + hash);
                }
            };

            const openModal = document.querySelector('.modal-root:not(.hidden), #news-modal:not(.hidden), #md-modal:not(.hidden), #legal-modal:not(.hidden)');
            if (openModal && typeof window.deactivateModal === 'function') {
                window.deactivateModal(openModal, completeScroll);
            } else {
                completeScroll();
            }
        });

        // Handle initial hash on page load smoothly
        if (window.location.hash) {
            const initialHash = window.location.hash.substring(1);
            const initialTarget = document.getElementById(initialHash);
            if (initialTarget) {
                setTimeout(function () {
                    smoothScrollToElement(initialTarget);
                }, 100);
            }
        }
    }

    function toggleMobileMenu(event) {
        if (event) {
            if (typeof event.preventDefault === 'function') event.preventDefault();
            if (typeof event.stopPropagation === 'function') event.stopPropagation();
        }
        const mobileMenu = document.getElementById('mobile-menu');
        const menuToggle = document.getElementById('menu-toggle');
        if (!mobileMenu) return;

        const isOpening = mobileMenu.classList.contains('hidden');
        if (isOpening) {
            mobileMenu.classList.remove('hidden');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'true');
                menuToggle.setAttribute('aria-label', '메뉴 닫기');
            }
        } else {
            mobileMenu.classList.add('hidden');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.setAttribute('aria-label', '메뉴 열기');
            }
        }
    }

    function setupMobileMenuToggle() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (!menuToggle || !mobileMenu) return;

        if (menuToggle.dataset.menuBound === 'true') return;
        menuToggle.dataset.menuBound = 'true';

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileMenu.classList.contains('hidden')) {
                if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.setAttribute('aria-label', '메뉴 열기');
                }
            }
        });

        // Close mobile menu when clicking any menu link
        const menuLinks = mobileMenu.querySelectorAll('a, button');
        menuLinks.forEach(function (item) {
            item.addEventListener('click', function () {
                mobileMenu.classList.add('hidden');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.setAttribute('aria-label', '메뉴 열기');
            });
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

        window.requestAnimationFrame(function () {
            cards.forEach(function (card) {
                card.style.display = (type === 'all' || card.classList.contains(type)) ? 'flex' : 'none';
            });
            if (slider) slider.scrollTo({ left: 0, behavior: 'smooth' });
        });
    }

    function initProgramSlider() {
        const slider = document.getElementById('prog-slider');
        if (!slider) return;

        const getCardWidth = function () {
            const card = slider.querySelector('.prog-card:not([style*="display: none"])') || slider.querySelector('.prog-card');
            return (card ? card.clientWidth : 356) + 24;
        };

        const prevBtn = document.getElementById('prog-prev');
        const nextBtn = document.getElementById('prog-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                window.requestAnimationFrame(function () {
                    slider.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
                });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                window.requestAnimationFrame(function () {
                    slider.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
                });
            });
        }
    }

    function initBackToTop() {
        let btn = document.getElementById('back-to-top-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'back-to-top-btn';
            btn.type = 'button';
            btn.setAttribute('aria-label', '맨 위로 이동');
            btn.className = 'fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-slate-900/90 text-slate-200 border border-slate-700/60 shadow-xl backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';
            document.body.appendChild(btn);
        }

        let isVisible = false;
        let ticking = false;

        function updateVisibility() {
            const shouldBeVisible = window.scrollY > 300;
            if (shouldBeVisible !== isVisible) {
                isVisible = shouldBeVisible;
                if (isVisible) {
                    btn.classList.remove('opacity-0', 'pointer-events-none');
                    btn.classList.add('opacity-100', 'pointer-events-auto');
                } else {
                    btn.classList.remove('opacity-100', 'pointer-events-auto');
                    btn.classList.add('opacity-0', 'pointer-events-none');
                }
            }
            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateVisibility);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        updateVisibility();
    }

    let lazyImageObserver = null;

    function observeLazyImages(targetContainer) {
        const root = targetContainer || document;
        const lazyImages = root.querySelectorAll('img[data-lazy-src], img[data-src]');
        if (lazyImages.length === 0) return;

        if ('IntersectionObserver' in window) {
            if (!lazyImageObserver) {
                lazyImageObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.getAttribute('data-lazy-src') || img.getAttribute('data-src');
                            if (src) {
                                img.src = src;
                                img.removeAttribute('data-lazy-src');
                                img.removeAttribute('data-src');
                                window.requestAnimationFrame(function () {
                                    img.classList.remove('opacity-0');
                                    img.classList.add('is-loaded', 'opacity-100');
                                });
                            }
                            observer.unobserve(img);
                        }
                    });
                }, { rootMargin: '160px 0px', threshold: 0.01 });
            }

            lazyImages.forEach(function (img) {
                lazyImageObserver.observe(img);
            });
        } else {
            // Fallback for non-supporting environments
            lazyImages.forEach(function (img) {
                const src = img.getAttribute('data-lazy-src') || img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-lazy-src');
                    img.removeAttribute('data-src');
                    img.classList.remove('opacity-0');
                    img.classList.add('is-loaded', 'opacity-100');
                }
            });
        }
    }

    window.observeLazyImages = observeLazyImages;
    window.activateModal = activateModal;
    window.deactivateModal = deactivateModal;
    window.lockPageScroll = lockPageScroll;
    window.unlockPageScroll = unlockPageScroll;
    window.showShareToast = showShareToast;
    window.filterPrograms = filterPrograms;
    window.toggleMobileMenu = toggleMobileMenu;
    window.setupMobileMenuToggle = setupMobileMenuToggle;
    window.bindScrollProgress = bindScrollProgress;
    window.initProgramSlider = initProgramSlider;
    window.initBackToTop = initBackToTop;
    window.smoothScrollToElement = smoothScrollToElement;
    window.setupSmoothNavigation = setupSmoothNavigation;
})();
