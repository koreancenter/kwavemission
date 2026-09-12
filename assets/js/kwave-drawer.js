/**
 * K-WAVE Brand DNA Drawer & Partner Connect Controller
 * Enhanced with Edge-Swipe Open gesture, smooth spring physics, and high-performance RAF gestures
 */
(function () {
    'use strict';

    window._kwaveLoaded = true;
    const DRAWER_OPEN_MS = 380;
    const DRAWER_CLOSE_MS = 320;
    const SWIPE_TRANSITION_MS = 280;
    const EASING_LUXURY_OPEN = 'cubic-bezier(0.25, 1, 0.33, 1)';
    const EASING_LUXURY_CLOSE = 'cubic-bezier(0.32, 0, 0.2, 1)';
    let closeTimer;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isHorizontalSwipe = false;
    let isEdgeSwipeOpen = false;
    let rafSwipeId = null;
    let previouslyFocusedElement = null;

    function renderDrawer() {
        if (document.getElementById('k-drawer') || document.getElementById('kwave-drawer')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div id="kwave-drawer-backdrop" class="fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-sm opacity-0 will-change-[opacity]" aria-hidden="true"></div>
            <div id="k-drawer" role="dialog" aria-modal="true" aria-label="Brand DNA 서랍" aria-hidden="true" class="fixed left-0 top-1/2 z-50 -translate-x-full will-change-transform pointer-events-none w-[79vw] min-w-[262px] max-w-[298px] sm:w-[298px] sm:max-w-[308px]">
                <button id="kwave-tab-btn" type="button" data-kwave-drawer-toggle aria-label="Brand DNA 북마크 열기/닫기" aria-expanded="false" class="absolute left-full top-8 -translate-x-px z-50 bg-[#F6F4EF] text-slate-800 border-none px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-none shadow-md transition-all duration-300 flex items-center justify-center cursor-pointer pointer-events-auto select-none hover:bg-stone-100">
                    <span class="font-serif font-bold text-slate-800 text-xs sm:text-sm leading-none">K</span>
                </button>
                
                <div class="k-drawer-panel pointer-events-auto w-full bg-[#F6F4EF] border-none rounded-none shadow-2xl overflow-y-auto overflow-x-hidden">
                    <div class="k-drawer-header">
                        <span class="text-[10px] font-semibold tracking-widest uppercase text-stone-500 block leading-tight mb-1.5">BRAND DNA</span>
                        <p class="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight leading-tight mt-0.5">우리의 K-Wave</p>
                    </div>

                    <div class="k-drawer-body">
                        <div id="k-drawer-spine" class="k-drawer-spine" aria-hidden="true"></div>
                        <div class="k-drawer-group">
                            <span class="k-drawer-num">01</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-blue font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">SPIRITUAL IDENTITY</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">King's <span class="text-stone-500 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">예수 그리스도의 왕 되심을 선포하며</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num">02</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-green font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">KINGDOM EXPANSION</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">Kingdom's <span class="text-stone-500 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">하나님의 나라 확장에 헌신합니다.</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num">03</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-rose font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">MISSIONAL BRIDGE</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">Korean <span class="text-stone-500 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">이 일을 위해 대한민국을 부르십니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="k-drawer-divider" aria-hidden="true"></div>

                    <div class="k-drawer-footer text-center">
                        <div class="text-center text-[11px] sm:text-xs font-semibold tracking-wider text-stone-500 leading-none mb-2">
                            <span>하박국 2:14</span>
                        </div>
                        <p class="text-xs sm:text-[13px] font-serif italic text-slate-800 leading-relaxed break-keep px-0.5">
                            “이는 물이 바다를 덮음 같이<br>여호와의 영광을 인정하는 것이<br>세상에 가득함이니라”
                        </p>
                    </div>
                </div>
            </div>`);

        document.querySelector('[data-kwave-drawer-toggle]').addEventListener('click', window.toggleKWaveDrawer);
        const closeBtn = document.querySelector('[data-kwave-drawer-close]');
        if (closeBtn) closeBtn.addEventListener('click', window.closeKWaveDrawer);
        if (window.lucide) window.lucide.createIcons();

        if (window.ResizeObserver) {
            const drawerEl = getDrawerElement();
            if (drawerEl) {
                const observer = new ResizeObserver(function () {
                    updateDrawerSpine();
                });
                observer.observe(drawerEl);
            }
        }
        window.addEventListener('resize', updateDrawerSpine);
        requestAnimationFrame(updateDrawerSpine);
    }

    // Aligns the vertical spine strictly from the top of '01' to the bottom of '03'
    function updateDrawerSpine() {
        const body = document.querySelector('.k-drawer-body');
        const spine = document.getElementById('k-drawer-spine');
        const nums = document.querySelectorAll('.k-drawer-num');
        if (!body || !spine || nums.length < 3) return;

        const bodyRect = body.getBoundingClientRect();
        const num1Rect = nums[0].getBoundingClientRect();
        const num3Rect = nums[2].getBoundingClientRect();

        if (bodyRect.height === 0 || num1Rect.height === 0) return;

        const top = Math.round(num1Rect.top - bodyRect.top);
        const bottom = Math.round(num3Rect.bottom - bodyRect.top);
        const height = Math.max(0, bottom - top);

        spine.style.top = top + 'px';
        spine.style.height = height + 'px';
    }

    // Helper to get drawer element by either #k-drawer or #kwave-drawer
    function getDrawerElement() {
        return document.getElementById('k-drawer') || document.getElementById('kwave-drawer');
    }

    // Helper to confirm the drawer exists in DOM using requestAnimationFrame fallback before attempting toggle
    function ensureDrawerElement(callback) {
        let drawer = getDrawerElement();
        if (drawer) {
            callback(drawer);
            return;
        }

        // Drawer not found yet, try rendering it
        renderDrawer();
        drawer = getDrawerElement();
        if (drawer) {
            callback(drawer);
            return;
        }

        // Wait for next animation frame to confirm drawer is mounted in DOM
        requestAnimationFrame(function () {
            let mountedDrawer = getDrawerElement();
            if (!mountedDrawer) {
                renderDrawer();
                mountedDrawer = getDrawerElement();
            }
            if (mountedDrawer) {
                callback(mountedDrawer);
            } else {
                console.warn('[K-Wave Drawer] Failed to confirm drawer element in DOM via requestAnimationFrame.');
            }
        });
    }

    // ==========================================
    // 0. Toggle Drawer (북마크 탭 클릭 시 열기/닫기)
    // ==========================================
    window.toggleKWaveDrawer = function () {
        ensureDrawerElement(function (drawer) {
            if (drawer.classList.contains('-translate-x-full')) {
                window.openKWaveDrawer();
            } else {
                window.closeKWaveDrawer();
            }
        });
    };

    // ==========================================
    // 1. Drawer 열기 함수
    // ==========================================
    window.openKWaveDrawer = function () {
        ensureDrawerElement(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');
            const toggleBtn = document.getElementById('kwave-tab-btn');

            previouslyFocusedElement = document.activeElement;
            clearTimeout(closeTimer);

            if (typeof window.lockPageScroll === 'function') {
                window.lockPageScroll(drawer);
            } else {
                document.body.style.overflow = 'hidden';
            }

            drawer.classList.remove('is-closing');
            drawer.style.removeProperty('transform');
            drawer.style.removeProperty('transition');

            if (backdrop) {
                backdrop.classList.remove('hidden');
            }

            // Force reflow so browser acknowledges starting position (-100%) before animating
            void drawer.offsetWidth;

            requestAnimationFrame(function () {
                drawer.classList.remove('-translate-x-full');
                drawer.classList.add('is-open');
                drawer.setAttribute('aria-hidden', 'false');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
                if (backdrop) {
                    backdrop.classList.remove('opacity-0');
                }

                const closeBtn = drawer.querySelector('[data-kwave-drawer-close]');
                if (closeBtn) {
                    closeBtn.focus();
                } else if (toggleBtn) {
                    toggleBtn.focus();
                }
                updateDrawerSpine();
            });

            setTimeout(updateDrawerSpine, 100);
            setTimeout(updateDrawerSpine, 300);
        });
    };

    // ==========================================
    // 2. Drawer 닫기 함수
    // ==========================================
    window.closeKWaveDrawer = function () {
        ensureDrawerElement(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');
            const toggleBtn = document.getElementById('kwave-tab-btn');

            clearTimeout(closeTimer);

            drawer.setAttribute('aria-hidden', 'true');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');

            if (backdrop) {
                backdrop.classList.add('opacity-0');
            }

            drawer.classList.remove('is-open');
            drawer.classList.add('is-closing');
            drawer.classList.add('-translate-x-full');
            drawer.style.removeProperty('transform');

            closeTimer = setTimeout(function () {
                drawer.classList.add('-translate-x-full');
                drawer.classList.remove('is-closing');
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
                if (backdrop) {
                    backdrop.classList.add('hidden');
                }
                if (typeof window.unlockPageScroll === 'function') {
                    window.unlockPageScroll(drawer);
                } else {
                    document.body.style.overflow = '';
                }
                if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
                    previouslyFocusedElement.focus();
                    previouslyFocusedElement = null;
                }
            }, DRAWER_CLOSE_MS);
        });
    };

    function resetSwipe(drawer, isEdgeOpen = false) {
        const duration = isEdgeOpen ? DRAWER_CLOSE_MS : DRAWER_OPEN_MS;
        const easing = isEdgeOpen ? EASING_LUXURY_CLOSE : EASING_LUXURY_OPEN;
        drawer.style.transition = 'transform ' + duration + 'ms ' + easing;
        if (isEdgeOpen) {
            drawer.style.transform = 'translate3d(-100%, -50%, 0)';
        } else {
            drawer.style.transform = 'translate3d(0, -50%, 0)';
        }

        setTimeout(function () {
            if (isEdgeOpen) {
                drawer.classList.add('-translate-x-full');
                drawer.classList.remove('is-open');
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
            } else if (!drawer.classList.contains('-translate-x-full')) {
                drawer.classList.add('is-open');
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
            }
        }, duration);
    }

    function initializeDrawerInteractions() {
        ensureDrawerElement(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');

        if (backdrop) {
            backdrop.addEventListener('click', function () {
                window.closeKWaveDrawer();
            });
        }

        document.addEventListener('keydown', function (event) {
            if (drawer.classList.contains('-translate-x-full')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                window.closeKWaveDrawer();
                return;
            }

            if (event.key === 'Tab') {
                const focusableElements = drawer.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (!focusableElements.length) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        });

        // ==========================================
        // Edge-Swipe Open & Swipe-to-Close Touch Handlers
        // ==========================================
        document.addEventListener('touchstart', function (event) {
            if (event.touches.length !== 1) return;
            const clientX = event.touches[0].clientX;
            const clientY = event.touches[0].clientY;
            const isClosed = drawer.classList.contains('-translate-x-full');

            touchStartX = clientX;
            touchStartY = clientY;
            touchDeltaX = 0;
            isHorizontalSwipe = false;
            isEdgeSwipeOpen = false;

            if (isClosed && clientX <= 28) {
                // Edge swipe from left edge to open drawer
                isEdgeSwipeOpen = true;
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                drawer.style.removeProperty('transition');
                drawer.classList.remove('-translate-x-full');
                // Start from -100% (hidden)
                drawer.style.transform = 'translate3d(-100%, -50%, 0)';
            } else if (!isClosed && drawer.contains(event.target)) {
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                drawer.style.removeProperty('transition');
            }
        }, { passive: true });

        document.addEventListener('touchmove', function (event) {
            if (event.touches.length !== 1) return;
            const clientX = event.touches[0].clientX;
            const clientY = event.touches[0].clientY;
            const deltaX = clientX - touchStartX;
            const deltaY = clientY - touchStartY;

            if (!isHorizontalSwipe && Math.abs(deltaX) > 8) {
                isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            }

            if (!isHorizontalSwipe) return;

            const isClosed = drawer.classList.contains('-translate-x-full') && !isEdgeSwipeOpen;
            if (isClosed && !isEdgeSwipeOpen) return;

            event.preventDefault();

            const drawerWidth = drawer.offsetWidth || 320;

            if (isEdgeSwipeOpen) {
                // Dragging right from left edge: deltaX goes from 0 to drawerWidth
                const clampedX = Math.max(0, Math.min(drawerWidth, deltaX));
                touchDeltaX = clampedX;
                // Translate from -100% + clampedX
                const translatePx = -drawerWidth + clampedX;
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                rafSwipeId = requestAnimationFrame(function () {
                    drawer.style.transform = 'translate3d(' + translatePx + 'px, -50%, 0)';
                });
            } else {
                // Swipe to close (dragging left into edge when open)
                const clampedX = Math.min(0, Math.max(-drawerWidth, deltaX));
                touchDeltaX = clampedX;
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                rafSwipeId = requestAnimationFrame(function () {
                    drawer.style.transform = 'translate3d(' + clampedX + 'px, -50%, 0)';
                });
            }
        }, { passive: false });

        document.addEventListener('touchend', function () {
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
            if (!isHorizontalSwipe) {
                isEdgeSwipeOpen = false;
                return;
            }

            const drawerWidth = drawer.offsetWidth || 320;
            const openThreshold = drawerWidth * 0.3;
            const closeThreshold = drawerWidth * 0.22;

            if (isEdgeSwipeOpen) {
                if (touchDeltaX >= openThreshold) {
                    window.openKWaveDrawer();
                } else {
                    resetSwipe(drawer, true);
                }
            } else {
                if (touchDeltaX <= -closeThreshold) {
                    window.closeKWaveDrawer();
                } else {
                    resetSwipe(drawer, false);
                }
            }

            isHorizontalSwipe = false;
            isEdgeSwipeOpen = false;
            touchDeltaX = 0;
        });

        document.addEventListener('touchcancel', function () {
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
            if (isEdgeSwipeOpen) {
                resetSwipe(drawer, true);
            } else if (isHorizontalSwipe) {
                resetSwipe(drawer, false);
            }
            isHorizontalSwipe = false;
            isEdgeSwipeOpen = false;
            touchDeltaX = 0;
        });
    });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDrawerInteractions);
    } else {
        initializeDrawerInteractions();
    }

})();