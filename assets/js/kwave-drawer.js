/**
 * K-WAVE Brand DNA Drawer & Partner Connect Controller
 * Refined with Framer Motion-inspired spring physics and high-performance RAF gestures
 */
(function () {
    'use strict';

    window._kwaveLoaded = true;
    const DRAWER_TRANSITION_MS = 650; // Smooth luxury sliding door pacing (approx 50% slower, soft-close curve)
    const SWIPE_TRANSITION_MS = 420;
    const EASING_LUXURY = 'cubic-bezier(0.16, 1, 0.3, 1)'; // Silky smooth high-end deceleration curve
    let closeTimer;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isHorizontalSwipe = false;
    let rafSwipeId = null;

    function renderDrawer() {
        if (document.getElementById('kwave-drawer')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div id="kwave-drawer-backdrop" class="fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-[2px] opacity-0 transition-opacity duration-500" aria-hidden="true"></div>
            <div id="kwave-drawer" class="fixed left-0 top-1/2 -translate-y-1/2 w-[92vw] sm:w-[320px] md:w-[310px] max-w-[380px] h-fit max-h-[90vh] sm:max-h-[92vh] md:min-h-[550px] flex flex-col justify-between bg-[#F6F4EF] border-r border-y border-black/10 rounded-r-3xl p-5 sm:p-7 md:p-7 shadow-2xl z-50 transition-transform duration-650 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-full overflow-visible">
                <button id="kwave-tab-btn" type="button" data-kwave-drawer-toggle aria-label="Brand DNA 북마크 열기/닫기" class="z-50 bg-[#F6F4EF] text-slate-800 border-r border-y border-l-0 border-black/10 p-1.5 sm:p-2 rounded-r-xl shadow-md transition-all duration-300 group flex items-center justify-center cursor-pointer pointer-events-auto select-none">
                    <span class="w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-lg bg-black/[0.04] border border-black/10 group-hover:border-black/25 flex items-center justify-center group-hover:scale-105 transition-all shadow-2xs"><span class="font-serif font-bold text-slate-800 text-[10px] sm:text-[11px]">K</span></span>
                </button>
                <div class="flex items-center justify-between mb-3 sm:mb-5">
                    <div><span class="text-[clamp(9px,2.4vw,11px)] text-rose-500 font-mono tracking-widest uppercase mb-1 sm:mb-1.5 block font-semibold">[ BRAND DNA ]</span><h2 class="text-[clamp(1.125rem,4vw,1.5rem)] font-serif font-bold text-slate-900 tracking-tight">우리의 K-Wave</h2></div>
                    <button type="button" data-kwave-drawer-close aria-label="닫기" class="min-h-[44px] min-w-[44px] p-2 sm:p-2 rounded-lg bg-transparent hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"><i data-lucide="x" class="w-5 h-5 sm:w-5 sm:h-5"></i></button>
                </div>
                <div class="my-4 sm:my-5 ml-1 border-l border-slate-300 pl-3.5 sm:pl-5 space-y-3 sm:space-y-4">
                    <div class="drawer-card relative pb-2 sm:pb-3 border-b border-slate-200/90"><span class="absolute -left-[1.22rem] sm:-left-[1.58rem] top-1 sm:top-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-700 ring-4 ring-[#F6F4EF]"></span><span class="text-[clamp(8.5px,2vw,10px)] font-mono text-slate-500 font-semibold tracking-wider mb-1 sm:mb-1.5 block">01 / SPIRITUAL IDENTITY</span><h3 class="text-[clamp(0.875rem,3.5vw,1.125rem)] font-serif font-bold text-slate-900 mb-1 sm:mb-1.5 leading-snug"><span class="text-slate-900">K</span>ing's <span class="text-slate-500">Wave</span></h3><p class="text-[clamp(11px,2.5vw,14px)] font-semibold text-slate-800 leading-snug !m-0">예수 그리스도의 왕 되심을 선포하며</p></div>
                    <div class="drawer-card relative py-2 sm:py-3 border-b border-slate-200/90"><span class="absolute -left-[1.22rem] sm:-left-[1.58rem] top-2 sm:top-3 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-700 ring-4 ring-[#F6F4EF]"></span><span class="text-[clamp(8.5px,2vw,10px)] font-mono text-slate-500 font-semibold tracking-wider mb-1 sm:mb-1.5 block">02 / KINGDOM EXPANSION</span><h3 class="text-[clamp(0.875rem,3.5vw,1.125rem)] font-serif font-bold text-slate-900 mb-1 sm:mb-1.5 leading-snug"><span class="text-slate-900">K</span>ingdom's <span class="text-slate-500">Wave</span></h3><p class="text-[clamp(11px,2.5vw,14px)] font-semibold text-slate-800 leading-snug !m-0">하나님의 나라 확장에 헌신합니다.</p></div>
                    <div class="drawer-card relative pt-2 sm:pt-3"><span class="absolute -left-[1.22rem] sm:-left-[1.58rem] top-2 sm:top-3 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-700 ring-4 ring-[#F6F4EF]"></span><span class="text-[clamp(8.5px,2vw,10px)] font-mono text-slate-500 font-semibold tracking-wider mb-1 sm:mb-1.5 block">03 / MISSIONAL BRIDGE</span><h3 class="text-[clamp(0.875rem,3.5vw,1.125rem)] font-serif font-bold text-slate-900 mb-1 sm:mb-1.5 leading-snug"><span class="text-slate-900">K</span>orean <span class="text-slate-500">Wave</span></h3><p class="text-[clamp(11px,2.5vw,14px)] font-semibold text-slate-800 leading-snug !m-0">이 일을 위해 대한민국을 부르십니다.</p></div>
                </div>
                <div class="drawer-card"><div class="border-t border-slate-300/80 pt-3 sm:pt-4 mt-3 sm:mt-4 text-center"><div class="flex items-center justify-between text-[clamp(8.5px,2vw,10px)] font-mono mb-2 sm:mb-2.5"><span class="text-slate-700 font-bold">KEY SCRIPTURE</span><span class="text-slate-500">HABAKKUK 2:14</span></div><p class="text-[clamp(11px,2.5vw,14px)] font-serif italic text-slate-800 leading-relaxed mb-3 sm:mb-4">“이는 물이 바다를 덮음 같이<br>여호와의 영광을 인정하는 것이<br>세상에 가득함이니라”</p><a href="https://kwavemission.org/#contact-us" class="btn-primary partner-action no-shadow w-full min-h-[44px] py-2.5 sm:py-3 px-4 text-[clamp(11px,2.5vw,14px)] sm:text-sm font-semibold cursor-pointer rounded-xl flex items-center justify-center gap-1.5 shadow-xs"><span>CONNECT</span><i data-lucide="arrow-up-right" class="partner-action-arrow w-4 h-4"></i></a></div></div>
            </div>`);

        document.querySelector('[data-kwave-drawer-toggle]').addEventListener('click', window.toggleKWaveDrawer);
        document.querySelector('[data-kwave-drawer-close]').addEventListener('click', window.closeKWaveDrawer);
        if (window.lucide) window.lucide.createIcons();
    }

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
    // 1. Drawer 열기 함수 (부드러운 프리미엄 슬라이딩 도어 시차 애니메이션)
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

        // Use requestAnimationFrame for instant 60/120fps hardware trigger
        requestAnimationFrame(function () {
            drawer.classList.remove('-translate-x-full');
            if (backdrop) {
                backdrop.classList.remove('opacity-0');
            }
        });

        // 카드 순차 페이드 인 (Staggered Luxury Drop)
        const cards = drawer.querySelectorAll('.drawer-card');
        cards.forEach(function (card, index) {
            card.classList.remove('animate-card-drop');
            card.style.animationDelay = '0ms';

            setTimeout(function () {
                card.style.animationDelay = (index * 80) + 'ms';
                card.classList.add('animate-card-drop');
            }, 180);
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
            drawer.style.transition = 'transform ' + SWIPE_TRANSITION_MS + 'ms ' + EASING_LUXURY;
            drawer.style.transform = 'translate3d(100%, -50%, 0)';
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
        drawer.style.transition = 'transform ' + SWIPE_TRANSITION_MS + 'ms ' + EASING_LUXURY;
        drawer.style.transform = 'translate3d(0, -50%, 0)';

        setTimeout(function () {
            if (!drawer.classList.contains('-translate-x-full')) {
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
            }
        }, SWIPE_TRANSITION_MS);
    }

    function initializeDrawerInteractions() {
        renderDrawer();
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
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
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

            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
            rafSwipeId = requestAnimationFrame(function () {
                drawer.style.transform = 'translate3d(' + touchDeltaX + 'px, -50%, 0)';
            });
        }, { passive: false });

        drawer.addEventListener('touchend', function () {
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
            if (!isHorizontalSwipe) return;

            const closeThreshold = Math.min(80, drawer.offsetWidth * 0.22);
            if (touchDeltaX >= closeThreshold) {
                window.closeKWaveDrawer({ direction: 'right' });
            } else {
                resetSwipe(drawer);
            }

            isHorizontalSwipe = false;
            touchDeltaX = 0;
        });

        drawer.addEventListener('touchcancel', function () {
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
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

})();