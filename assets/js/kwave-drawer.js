/**
 * K-WAVE Brand DNA Drawer & Partner Connect Controller
 * Enhanced with instant [K] touch toggle, multi-directional dismissal (Up, Right, Left),
 * and high-performance physics-based gesture interactions
 */
(function () {
    'use strict';

    window._kwaveLoaded = true;
    const DRAWER_OPEN_MS = 360;
    const DRAWER_CLOSE_MS = 280;
    const EASING_LUXURY_OPEN = 'cubic-bezier(0.25, 1, 0.33, 1)';
    const EASING_LUXURY_CLOSE = 'cubic-bezier(0.32, 0, 0.2, 1)';
    const EASING_FLING_DISMISS = 'cubic-bezier(0.22, 1, 0.36, 1)';

    let closeTimer = null;
    let rafSwipeId = null;
    let previouslyFocusedElement = null;

    // Gesture state tracker
    const gestureState = {
        mode: 'none', // 'none' | 'button' | 'evaluating' | 'horizontal' | 'vertical-up'
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        lastTime: 0,
        deltaX: 0,
        deltaY: 0,
        vx: 0,
        vy: 0,
        canSwipeUp: false
    };

    function renderDrawer() {
        if (document.getElementById('k-drawer') || document.getElementById('kwave-drawer')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div id="kwave-drawer-backdrop" class="fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-sm opacity-0 will-change-[opacity]" aria-hidden="true"></div>
            <div id="k-drawer" class="fixed left-0 top-1/2 z-50 -translate-x-full will-change-transform pointer-events-none w-[79vw] min-w-[262px] max-w-[298px] sm:w-[298px] sm:max-w-[308px]">
                <button id="kwave-tab-btn" type="button" data-kwave-drawer-toggle aria-label="Brand DNA 북마크 열기/닫기" aria-expanded="false" class="absolute left-full top-8 -translate-x-px z-50 bg-[#F6F4EF] text-slate-800 border-none px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-none shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer pointer-events-auto select-none hover:bg-stone-100 active:scale-95">
                    <span class="font-serif font-bold text-slate-800 text-xs sm:text-sm leading-none pointer-events-none">K</span>
                </button>
                
                <div class="k-drawer-panel pointer-events-auto w-full bg-[#F6F4EF] border-none rounded-none shadow-2xl overflow-y-auto overflow-x-hidden" role="dialog" aria-modal="true" aria-label="Brand DNA 서랍" aria-hidden="true">
                    <div class="k-drawer-handle sm:hidden" aria-hidden="true"></div>
                    <div class="k-drawer-header">
                        <span class="text-[10px] font-semibold tracking-widest uppercase text-stone-600 block leading-tight mb-1.5">BRAND DNA</span>
                        <p class="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight leading-tight mt-0.5">우리의 K-Wave</p>
                    </div>

                    <div class="k-drawer-body">
                        <div id="k-drawer-spine" class="k-drawer-spine" aria-hidden="true"></div>
                        <div class="k-drawer-group">
                            <span class="k-drawer-num">01</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-blue font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">SPIRITUAL IDENTITY</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">King's <span class="text-stone-600 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">예수 그리스도의 왕 되심을 선포하며</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num">02</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-green font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">KINGDOM EXPANSION</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">Kingdom's <span class="text-stone-600 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">하나님의 나라 확장에 헌신합니다.</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num">03</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-rose font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase block leading-none">MISSIONAL BRIDGE</span>
                                <p class="k-drawer-item-title text-sm sm:text-base font-serif font-bold text-slate-900 leading-snug">Korean <span class="text-stone-600 font-normal">Wave</span></p>
                                <p class="text-xs sm:text-sm font-medium text-slate-700 leading-snug">이 일을 위해 대한민국을 부르십니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="k-drawer-divider" aria-hidden="true"></div>

                    <div class="k-drawer-footer text-center">
                        <div class="text-center text-[11px] sm:text-xs font-semibold tracking-wider text-stone-600 leading-none mb-2">
                            <span>하박국 2:14</span>
                        </div>
                        <p class="text-xs sm:text-[13px] font-serif italic text-slate-800 leading-relaxed break-keep px-0.5">
                            “이는 물이 바다를 덮음 같이<br>여호와의 영광을 인정하는 것이<br>세상에 가득함이니라”
                        </p>
                    </div>
                </div>
            </div>`);

        bindTabButton();

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

    // High-responsiveness [K] button binding (handles touch & click without 300ms delay or swipe confusion)
    function bindTabButton() {
        const toggleBtn = document.getElementById('kwave-tab-btn');
        if (!toggleBtn) return;

        let isTouchFired = false;
        let lastToggleTime = 0;

        const onToggle = function (e) {
            const now = Date.now();
            if (now - lastToggleTime < 240) return;
            lastToggleTime = now;

            if (e && e.cancelable) {
                e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
            }
            window.toggleKWaveDrawer();
        };

        toggleBtn.addEventListener('touchend', function (e) {
            isTouchFired = true;
            onToggle(e);
            setTimeout(function () {
                isTouchFired = false;
            }, 350);
        }, { passive: false });

        toggleBtn.addEventListener('click', function (e) {
            if (isTouchFired) return;
            onToggle(e);
        });
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

        renderDrawer();
        drawer = getDrawerElement();
        if (drawer) {
            callback(drawer);
            return;
        }

        requestAnimationFrame(function () {
            let mountedDrawer = getDrawerElement();
            if (!mountedDrawer) {
                renderDrawer();
                mountedDrawer = getDrawerElement();
            }
            if (mountedDrawer) {
                callback(mountedDrawer);
            } else {
                console.warn('[K-Wave Drawer] Failed to confirm drawer element in DOM.');
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
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);

            if (typeof window.lockPageScroll === 'function') {
                window.lockPageScroll(drawer);
            } else {
                document.body.style.overflow = 'hidden';
            }

            drawer.classList.remove('is-closing');
            drawer.style.removeProperty('transform');
            drawer.style.removeProperty('transition');
            drawer.style.removeProperty('opacity');

            if (backdrop) {
                backdrop.classList.remove('hidden');
            }

            // Force reflow
            void drawer.offsetWidth;

            requestAnimationFrame(function () {
                drawer.classList.remove('-translate-x-full');
                drawer.classList.add('is-open');
                const panel = drawer.querySelector('.k-drawer-panel');
                if (panel) panel.setAttribute('aria-hidden', 'false');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
                if (backdrop) {
                    backdrop.classList.remove('opacity-0');
                }

                if (toggleBtn) {
                    toggleBtn.focus();
                }
                updateDrawerSpine();
            });

            setTimeout(updateDrawerSpine, 80);
            setTimeout(updateDrawerSpine, 260);
        });
    };

    // ==========================================
    // 2. Drawer 다방향 닫기 (Up, Right, Left)
    // ==========================================
    function dismissDrawer(direction) {
        ensureDrawerElement(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');
            const toggleBtn = document.getElementById('kwave-tab-btn');

            clearTimeout(closeTimer);
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);

            const panel = drawer.querySelector('.k-drawer-panel');
            if (panel) panel.setAttribute('aria-hidden', 'true');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');

            if (backdrop) {
                backdrop.classList.add('opacity-0');
            }

            drawer.classList.remove('is-open');
            drawer.classList.add('is-closing');

            const duration = DRAWER_CLOSE_MS;

            if (direction === 'up') {
                // 위로 스왑되어 날아감
                drawer.style.transition = 'transform ' + duration + 'ms ' + EASING_FLING_DISMISS + ', opacity ' + (duration - 40) + 'ms ease-out';
                drawer.style.transform = 'translate3d(0, calc(-50% - 110vh), 0)';
                drawer.style.opacity = '0';
            } else if (direction === 'right') {
                // 오른쪽으로 스왑되어 날아감
                drawer.style.transition = 'transform ' + duration + 'ms ' + EASING_FLING_DISMISS + ', opacity ' + (duration - 40) + 'ms ease-out';
                drawer.style.transform = 'translate3d(120vw, -50%, 0)';
                drawer.style.opacity = '0';
            } else {
                // 왼쪽으로 밀어 넣기 (원래 위치로 쑥 수납)
                drawer.style.transition = 'transform ' + duration + 'ms ' + EASING_LUXURY_CLOSE;
                drawer.style.transform = 'translate3d(-100%, -50%, 0)';
                drawer.style.opacity = '1';
            }

            closeTimer = setTimeout(function () {
                drawer.classList.add('-translate-x-full');
                drawer.classList.remove('is-closing');
                drawer.style.removeProperty('transform');
                drawer.style.removeProperty('transition');
                drawer.style.removeProperty('opacity');
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
            }, duration + 30);
        });
    }

    // 기본 닫기 함수 (왼쪽 수납)
    window.closeKWaveDrawer = function () {
        dismissDrawer('left');
    };

    // 제스처 후 열림 위치로 복귀 (Spring back to open)
    function snapBackToOpen(drawer) {
        const duration = 240;
        drawer.style.transition = 'transform ' + duration + 'ms ' + EASING_LUXURY_OPEN + ', opacity ' + duration + 'ms ease-out';
        drawer.style.transform = 'translate3d(0, -50%, 0)';
        drawer.style.opacity = '1';

        setTimeout(function () {
            drawer.style.removeProperty('transform');
            drawer.style.removeProperty('transition');
            drawer.style.removeProperty('opacity');
            if (!drawer.classList.contains('-translate-x-full')) {
                drawer.classList.add('is-open');
            }
        }, duration);
    }

    // ==========================================
    // 3. 제스처 인터랙션 초기화 (드로워가 열린 상태에서만 닫기 제스처 동작)
    // ==========================================
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

            // ------------------------------------------
            // Touch Start: 분기 판정 (열린 상태에서만 닫기 제스처 추종)
            // ------------------------------------------
            document.addEventListener('touchstart', function (event) {
                if (event.touches.length !== 1) return;

                const touch = event.touches[0];
                const clientX = touch.clientX;
                const clientY = touch.clientY;
                const isClosed = drawer.classList.contains('-translate-x-full');

                // 1. [K] 버튼을 터치한 경우 -> 스와이프 제스처 판정에서 완전 배제 (순수 탭 반응 보장)
                if (event.target.closest('#kwave-tab-btn, [data-kwave-drawer-toggle]')) {
                    gestureState.mode = 'button';
                    return;
                }

                // 2. 드로워가 닫혀 있는 상태에서는 화면 어디를 스와이프해도 열리지 않음 ([K] 버튼 클릭으로만 열림)
                if (isClosed) {
                    gestureState.mode = 'none';
                    return;
                }

                // 3. 드로워가 열려 있는 상태에서 드로워 패널 내부 터치 시에만 닫기 제스처 활성화
                if (drawer.contains(event.target)) {
                    const panel = drawer.querySelector('.k-drawer-panel');
                    const panelScrollTop = panel ? panel.scrollTop : 0;

                    gestureState.mode = 'evaluating';
                    gestureState.startX = clientX;
                    gestureState.startY = clientY;
                    gestureState.lastX = clientX;
                    gestureState.lastY = clientY;
                    gestureState.lastTime = Date.now();
                    gestureState.deltaX = 0;
                    gestureState.deltaY = 0;
                    gestureState.vx = 0;
                    gestureState.vy = 0;
                    gestureState.canSwipeUp = (panelScrollTop <= 2);

                    if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                } else {
                    gestureState.mode = 'none';
                }
            }, { passive: true });

            // ------------------------------------------
            // Touch Move: 실시간 제스처 추종
            // ------------------------------------------
            document.addEventListener('touchmove', function (event) {
                if (gestureState.mode === 'none' || gestureState.mode === 'button') return;
                if (event.touches.length !== 1) return;

                const touch = event.touches[0];
                const clientX = touch.clientX;
                const clientY = touch.clientY;
                const deltaX = clientX - gestureState.startX;
                const deltaY = clientY - gestureState.startY;

                const now = Date.now();
                const dt = now - gestureState.lastTime;
                if (dt > 10) {
                    gestureState.vx = (clientX - gestureState.lastX) / dt;
                    gestureState.vy = (clientY - gestureState.lastY) / dt;
                    gestureState.lastX = clientX;
                    gestureState.lastY = clientY;
                    gestureState.lastTime = now;
                }

                gestureState.deltaX = deltaX;
                gestureState.deltaY = deltaY;

                // A. 열린 상태에서 제스처 방향 판별 (Evaluating)
                if (gestureState.mode === 'evaluating') {
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);

                    if (absX > 8 || absY > 8) {
                        if (absX >= absY) {
                            // 수평 방향 제스처 (왼쪽 밀어넣기 또는 오른쪽 날리기)
                            gestureState.mode = 'horizontal';
                            drawer.style.transition = 'none';
                        } else if (deltaY < -8 && gestureState.canSwipeUp) {
                            // 수직 위쪽 제스처 (위로 쓸어 올려 날리기)
                            gestureState.mode = 'vertical-up';
                            drawer.style.transition = 'none';
                        } else {
                            // 드로워 내부 일반 콘텐츠 스크롤
                            gestureState.mode = 'none';
                            return;
                        }
                    } else {
                        return;
                    }
                }

                // B. 수평 드래그 처리 (Left & Right)
                if (gestureState.mode === 'horizontal') {
                    if (event.cancelable) event.preventDefault();
                    const drawerWidth = drawer.offsetWidth || 280;

                    if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                    rafSwipeId = requestAnimationFrame(function () {
                        if (deltaX < 0) {
                            // 왼쪽으로 밀어 넣기: -drawerWidth까지 부드럽게 추종
                            const clampedX = Math.max(-drawerWidth, deltaX);
                            drawer.style.transform = 'translate3d(' + clampedX + 'px, -50%, 0)';
                            drawer.style.opacity = '1';
                        } else {
                            // 오른쪽으로 스왑: 손가락 따라 오른쪽으로 이동 + 가벼운 투명도 피드백
                            drawer.style.transform = 'translate3d(' + deltaX + 'px, -50%, 0)';
                            const fade = Math.max(0.25, 1 - (deltaX / (drawerWidth * 1.5)));
                            drawer.style.opacity = fade.toString();
                        }
                    });
                }
                // C. 수직 위쪽 드래그 처리 (Up)
                else if (gestureState.mode === 'vertical-up') {
                    if (deltaY < 0) {
                        if (event.cancelable) event.preventDefault();
                        if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                        rafSwipeId = requestAnimationFrame(function () {
                            drawer.style.transform = 'translate3d(0, calc(-50% + ' + deltaY + 'px), 0)';
                            const fade = Math.max(0.2, 1 - (Math.abs(deltaY) / 320));
                            drawer.style.opacity = fade.toString();
                        });
                    }
                }
            }, { passive: false });

            // ------------------------------------------
            // Touch End: 임계값 및 속도(Velocity) 기반 발동
            // ------------------------------------------
            document.addEventListener('touchend', function () {
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);

                const currentMode = gestureState.mode;
                gestureState.mode = 'none';

                if (currentMode === 'none' || currentMode === 'button') {
                    return;
                }

                // A. 수평 스와이프 완료
                if (currentMode === 'horizontal') {
                    // 오른쪽으로 스왑하면 날아감
                    if (gestureState.deltaX > 40 || (gestureState.deltaX > 15 && gestureState.vx > 0.22)) {
                        dismissDrawer('right');
                    }
                    // 왼쪽으로 밀어 넣으면 쑥 들어감
                    else if (gestureState.deltaX < -32 || (gestureState.deltaX < -12 && gestureState.vx < -0.2)) {
                        dismissDrawer('left');
                    } else {
                        // 원위치 복귀
                        snapBackToOpen(drawer);
                    }
                    return;
                }

                // B. 위쪽 스와이프 완료
                if (currentMode === 'vertical-up') {
                    // 위로 쓸어 올리면 위로 날아감
                    if (gestureState.deltaY < -40 || (gestureState.deltaY < -15 && gestureState.vy < -0.22)) {
                        dismissDrawer('up');
                    } else {
                        snapBackToOpen(drawer);
                    }
                    return;
                }
            });

            // ------------------------------------------
            // Touch Cancel: 안전한 원위치 복원
            // ------------------------------------------
            document.addEventListener('touchcancel', function () {
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                const currentMode = gestureState.mode;
                gestureState.mode = 'none';

                if (currentMode === 'horizontal' || currentMode === 'vertical-up') {
                    snapBackToOpen(drawer);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDrawerInteractions);
    } else {
        initializeDrawerInteractions();
    }

})();