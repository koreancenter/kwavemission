/**
 * K-WAVE Brand DNA Drawer & Partner Connect Controller
 */
(function () {
    'use strict';

    window._kwaveLoaded = true;
    const DRAWER_TRANSITION_MS = 750; // 속도를 절반으로 감속하여 프리미엄 슬라이딩 연출
    const SWIPE_TRANSITION_MS = 450;
    let closeTimer;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isHorizontalSwipe = false;

    // ==========================================
    // 0. Toggle Drawer (북마크 탭 클릭 시 열기/닫기)
    // ==========================================
    window.toggleKWaveDrawer = function () {
        const drawer = document.getElementById('kwave-drawer');
        if (!drawer) return;
        if (drawer.classList.contains('-translate-x-full')) {
            window.openKWaveDrawer();
        } else {
            window.closeKWaveDrawer();
        }
    };

    // ==========================================
    // 1. Drawer 열기 함수 (부드러운 프리미엄 시차 애니메이션)
    // ==========================================
    window.openKWaveDrawer = function () {
        const drawer = document.getElementById('kwave-drawer');
        const backdrop = document.getElementById('kwave-drawer-backdrop');
        if (!drawer) return;

        clearTimeout(closeTimer);
        if (typeof window.lockPageScroll === 'function') {
            window.lockPageScroll(drawer);
        } else {
            document.body.style.overflow = 'hidden';
        }
        drawer.style.removeProperty('transform');
        drawer.style.removeProperty('transition');

        // Backdrop 표시
        if (backdrop) {
            backdrop.classList.remove('hidden');
        }

        setTimeout(function () {
            drawer.classList.remove('-translate-x-full');
            if (backdrop) {
                backdrop.classList.remove('opacity-0');
            }
        }, 16);

        // 카드 순차 페이드 인 (Stagger)
        const cards = drawer.querySelectorAll('.drawer-card');
        cards.forEach(function (card, index) {
            card.classList.remove('animate-card-drop');
            card.style.animationDelay = '0ms';

            setTimeout(function () {
                card.style.animationDelay = (index * 100) + 'ms';
                card.classList.add('animate-card-drop');
            }, 220);
        });
    };

    // ==========================================
    // 2. Drawer 닫기 함수
    // ==========================================
    window.closeKWaveDrawer = function (options) {
        const drawer = document.getElementById('kwave-drawer');
        const backdrop = document.getElementById('kwave-drawer-backdrop');
        if (!drawer) return;

        const closesToRight = options && options.direction === 'right';
        clearTimeout(closeTimer);

        if (backdrop) {
            backdrop.classList.add('opacity-0');
        }

        if (closesToRight) {
            drawer.style.transition = 'transform ' + SWIPE_TRANSITION_MS + 'ms cubic-bezier(0.16, 1, 0.3, 1)';
            drawer.style.transform = 'translate(100%, -50%)';
        } else {
            drawer.classList.add('-translate-x-full');
        }

        closeTimer = setTimeout(function () {
            drawer.classList.add('-translate-x-full');
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
        }, closesToRight ? SWIPE_TRANSITION_MS : DRAWER_TRANSITION_MS);
    };

    function resetSwipe(drawer) {
        drawer.style.transition = 'transform ' + SWIPE_TRANSITION_MS + 'ms cubic-bezier(0.16, 1, 0.3, 1)';
        drawer.style.transform = 'translate(0, -50%)';

        setTimeout(function () {
            if (!drawer.classList.contains('-translate-x-full')) {
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
            }
        }, SWIPE_TRANSITION_MS);
    }

    function initializeDrawerInteractions() {
        const drawer = document.getElementById('kwave-drawer');
        const backdrop = document.getElementById('kwave-drawer-backdrop');
        if (!drawer) return;

        if (backdrop) {
            backdrop.addEventListener('click', function () {
                window.closeKWaveDrawer();
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !drawer.classList.contains('-translate-x-full')) {
                window.closeKWaveDrawer();
            }
        });

        drawer.addEventListener('touchstart', function (event) {
            if (event.touches.length !== 1) return;

            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            touchDeltaX = 0;
            isHorizontalSwipe = false;
            drawer.style.removeProperty('transition');
        }, { passive: true });

        drawer.addEventListener('touchmove', function (event) {
            if (event.touches.length !== 1) return;

            const deltaX = event.touches[0].clientX - touchStartX;
            const deltaY = event.touches[0].clientY - touchStartY;

            if (!isHorizontalSwipe && Math.abs(deltaX) > 8) {
                isHorizontalSwipe = deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY);
            }

            if (!isHorizontalSwipe) return;

            event.preventDefault();
            touchDeltaX = Math.max(0, deltaX);
            drawer.style.transform = 'translate(' + touchDeltaX + 'px, -50%)';
        }, { passive: false });

        drawer.addEventListener('touchend', function () {
            if (!isHorizontalSwipe) return;

            const closeThreshold = Math.min(96, drawer.offsetWidth * 0.25);
            if (touchDeltaX >= closeThreshold) {
                window.closeKWaveDrawer({ direction: 'right' });
            } else {
                resetSwipe(drawer);
            }

            isHorizontalSwipe = false;
            touchDeltaX = 0;
        });

        drawer.addEventListener('touchcancel', function () {
            if (isHorizontalSwipe) {
                resetSwipe(drawer);
            }
            isHorizontalSwipe = false;
            touchDeltaX = 0;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDrawerInteractions);
    } else {
        initializeDrawerInteractions();
    }

    // ==========================================
    // 3. 함께 파도타기 (Partner Connect) 클릭 핸들러
    // ==========================================
    window.handlePartnerConnect = function () {
        const drawer = document.getElementById('kwave-drawer');
        const drawerIsOpen = drawer && !drawer.classList.contains('-translate-x-full');

        if (drawerIsOpen && typeof window.closeKWaveDrawer === 'function') {
            window.closeKWaveDrawer();
        }

        setTimeout(function () {
            if (typeof window.openPartnerModal === 'function') {
                window.openPartnerModal();
            }
        }, drawerIsOpen ? DRAWER_TRANSITION_MS : 0);
    };
})();