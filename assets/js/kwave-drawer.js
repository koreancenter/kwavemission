/**
 * K-WAVE Brand DNA Drawer (Independent Component Logic)
 * 
 * Standalone module providing:
 * - Deterministic toggle & state management (open/close/toggle)
 * - Fluid mobile swipe gestures (left swipe to dismiss, vertical fling)
 * - Automatic backdrop handling & background scroll locking
 * - Accessible keyboard focus trap & Escape key dismissal
 * - Robust vertical spine timeline alignment calculation
 */

(function (global) {
    'use strict';

    // Prevent duplicate initialization
    if (global._kwaveDrawerInitialized) return;
    global._kwaveDrawerInitialized = true;

    const CSS_MODULE_PATH = './assets/css/kwave-drawer.min.css?v=20260924-v2';
    const DRAWER_OPEN_MS = 360;
    const DRAWER_CLOSE_MS = 280;
    const EASING_OPEN = 'cubic-bezier(0.25, 1, 0.33, 1)';
    const EASING_CLOSE = 'cubic-bezier(0.32, 0, 0.2, 1)';
    const EASING_FLING = 'cubic-bezier(0.22, 1, 0.36, 1)';

    let closeTimer = null;
    let rafSwipeId = null;
    let previouslyFocusedElement = null;

    // Gesture tracking state
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

    /**
     * Auto-ensure CSS is loaded for standalone usage
     */
    function ensureStylesLoaded() {
        if (document.getElementById('kwave-drawer-css') || document.querySelector('link[href*="kwave-drawer"]')) {
            return;
        }
        const link = document.createElement('link');
        link.id = 'kwave-drawer-css';
        link.rel = 'stylesheet';
        link.href = CSS_MODULE_PATH;
        document.head.appendChild(link);
    }

    /**
     * Helper to get drawer DOM node
     */
    function getDrawerElement() {
        return document.getElementById('k-drawer') || document.getElementById('kwave-drawer');
    }

    /**
     * Dynamically compute and adjust the vertical spine line connecting 01 to 03
     */
    function updateSpine() {
        const body = document.querySelector('.k-drawer-body');
        const spine = document.getElementById('k-drawer-spine');
        const nums = document.querySelectorAll('.k-drawer-num');
        if (!body || !spine || nums.length < 3) return;

        const num1 = nums[0];
        const num3 = nums[2];

        // Use layout offset metrics relative to body (unaffected by 3D transforms)
        const top = num1.offsetTop + (num1.offsetHeight / 2);
        const bottom = num3.offsetTop + (num3.offsetHeight / 2);
        const height = Math.max(0, bottom - top);

        if (height > 0) {
            spine.style.top = Math.round(top) + 'px';
            spine.style.height = Math.round(height) + 'px';
        }
    }

    /**
     * Bind click and touch events to the [K] tab button
     */
    function bindTabButton() {
        const btn = document.getElementById('kwave-tab-btn');
        if (!btn || btn._kwaveTabBound) return;
        btn._kwaveTabBound = true;

        let isTouchTriggered = false;
        let lastTriggerTime = 0;

        const handleActivation = function (e) {
            const now = Date.now();
            if (now - lastTriggerTime < 240) return;
            lastTriggerTime = now;

            if (e && e.cancelable) e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

            toggle();
        };

        btn.addEventListener('touchend', function (e) {
            isTouchTriggered = true;
            handleActivation(e);
            setTimeout(function () {
                isTouchTriggered = false;
            }, 350);
        }, { passive: false });

        btn.addEventListener('click', function (e) {
            if (isTouchTriggered) return;
            handleActivation(e);
        });
    }

    /**
     * Render the Drawer HTML markup if not present
     */
    function renderDrawer() {
        if (getDrawerElement()) {
            bindTabButton();
            return;
        }

        ensureStylesLoaded();

        const html = `
            <div id="kwave-drawer-backdrop" class="fixed inset-0 z-40 hidden bg-black/40 backdrop-blur-sm opacity-0 will-change-[opacity]" aria-hidden="true"></div>
            <div id="k-drawer" class="fixed left-0 top-1/2 z-50 pointer-events-none -translate-x-full will-change-transform" role="region" aria-label="Brand DNA 서랍 컨테이너">
                <button id="kwave-tab-btn" type="button" data-kwave-drawer-toggle aria-label="Brand DNA 북마크 서랍 열기/닫기" aria-expanded="false">
                    <span class="pointer-events-none">K</span>
                </button>
                
                <div class="k-drawer-panel" role="dialog" aria-modal="true" aria-label="Brand DNA 서랍" aria-hidden="true">
                    <div class="k-drawer-handle" aria-hidden="true"></div>
                    
                    <div class="k-drawer-header">
                        <span class="k-drawer-header-subtitle">BRAND DNA</span>
                        <h2 class="k-drawer-header-title">우리의 K-Wave</h2>
                    </div>

                    <div class="k-drawer-body">
                        <div id="k-drawer-spine" class="k-drawer-spine" aria-hidden="true"></div>
                        
                        <div class="k-drawer-group">
                            <span class="k-drawer-num" aria-hidden="true">01</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-blue">SPIRITUAL IDENTITY</span>
                                <h3 class="k-drawer-item-title">King's <span style="font-weight:normal;color:#78716c;">Wave</span></h3>
                                <p class="k-drawer-item-desc">예수 그리스도의 왕 되심을 선포하며</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num" aria-hidden="true">02</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-green">KINGDOM EXPANSION</span>
                                <h3 class="k-drawer-item-title">Kingdom's <span style="font-weight:normal;color:#78716c;">Wave</span></h3>
                                <p class="k-drawer-item-desc">하나님의 나라 확장에 헌신합니다.</p>
                            </div>
                        </div>

                        <div class="k-drawer-group">
                            <span class="k-drawer-num" aria-hidden="true">03</span>
                            <div class="k-drawer-info">
                                <span class="k-tag-rose">MISSIONAL BRIDGE</span>
                                <h3 class="k-drawer-item-title">Korean <span style="font-weight:normal;color:#78716c;">Wave</span></h3>
                                <p class="k-drawer-item-desc">이 일을 위해 대한민국을 부르십니다.</p>
                            </div>
                        </div>
                    </div>

                    <div class="k-drawer-divider" aria-hidden="true"></div>

                    <div class="k-drawer-footer">
                        <div class="k-drawer-footer-verse-ref">
                            <span>하박국 2:14</span>
                        </div>
                        <p class="k-drawer-footer-verse-text">
                            “이는 물이 바다를 덮음 같이<br>여호와의 영광을 인정하는 것이<br>세상에 가득함이니라”
                        </p>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        bindTabButton();

        if (window.ResizeObserver) {
            const drawerEl = getDrawerElement();
            if (drawerEl) {
                const observer = new ResizeObserver(function () {
                    updateSpine();
                });
                observer.observe(drawerEl);
            }
        }

        window.addEventListener('resize', updateSpine, { passive: true });
        window.addEventListener('orientationchange', function () {
            setTimeout(updateSpine, 100);
        }, { passive: true });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(updateSpine);
        }

        requestAnimationFrame(updateSpine);
    }

    /**
     * Ensure drawer element is accessible, initializing if necessary
     */
    function ensureDrawer(callback) {
        let drawer = getDrawerElement();
        if (drawer) {
            bindTabButton();
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
                console.warn('[KWaveDrawer] Could not find or mount drawer element in DOM.');
            }
        });
    }

    /**
     * Determine whether drawer is open
     */
    function isOpen() {
        const drawer = getDrawerElement();
        return !!drawer && drawer.classList.contains('is-open');
    }

    /**
     * Open Drawer
     */
    function open() {
        ensureDrawer(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');
            const tabBtn = document.getElementById('kwave-tab-btn');

            previouslyFocusedElement = document.activeElement;
            if (closeTimer) clearTimeout(closeTimer);
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);

            if (typeof window.lockPageScroll === 'function') {
                window.lockPageScroll(drawer);
            } else {
                document.body.style.overflow = 'hidden';
            }

            drawer.classList.remove('is-closing');
            drawer.classList.remove('-translate-x-full');
            drawer.style.removeProperty('transform');
            drawer.style.removeProperty('transition');
            drawer.style.removeProperty('opacity');

            if (backdrop) {
                backdrop.classList.remove('hidden');
            }

            // Force reflow
            drawer.offsetWidth;

            requestAnimationFrame(function () {
                drawer.classList.add('is-open');

                const panel = drawer.querySelector('.k-drawer-panel');
                if (panel) panel.setAttribute('aria-hidden', 'false');
                if (tabBtn) tabBtn.setAttribute('aria-expanded', 'true');

                if (backdrop) {
                    backdrop.classList.remove('opacity-0');
                }

                if (tabBtn) tabBtn.focus();
                updateSpine();
            });

            setTimeout(updateSpine, 80);
            setTimeout(updateSpine, 260);
        });
    }

    /**
     * Close Drawer
     */
    function close(direction) {
        ensureDrawer(function (drawer) {
            const backdrop = document.getElementById('kwave-drawer-backdrop');
            const tabBtn = document.getElementById('kwave-tab-btn');

            if (closeTimer) clearTimeout(closeTimer);
            if (rafSwipeId) cancelAnimationFrame(rafSwipeId);

            const panel = drawer.querySelector('.k-drawer-panel');
            if (panel) panel.setAttribute('aria-hidden', 'true');
            if (tabBtn) tabBtn.setAttribute('aria-expanded', 'false');

            if (backdrop) {
                backdrop.classList.add('opacity-0');
            }

            drawer.classList.remove('is-open');
            drawer.classList.add('is-closing');

            if (direction === 'up') {
                drawer.style.transition = 'transform ' + DRAWER_CLOSE_MS + 'ms ' + EASING_FLING + ', opacity 240ms ease-out';
                drawer.style.transform = 'translate3d(0, calc(-50% - 110vh), 0)';
                drawer.style.opacity = '0';
            } else if (direction === 'right') {
                drawer.style.transition = 'transform ' + DRAWER_CLOSE_MS + 'ms ' + EASING_FLING + ', opacity 240ms ease-out';
                drawer.style.transform = 'translate3d(120vw, -50%, 0)';
                drawer.style.opacity = '0';
            } else {
                drawer.style.transition = 'transform ' + DRAWER_CLOSE_MS + 'ms cubic-bezier(0.32, 0, 0.2, 1)';
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
            }, DRAWER_CLOSE_MS + 30);
        });
    }

    /**
     * Dismiss via standard left slide
     */
    function dismiss(target) {
        close(target || 'left');
    }

    /**
     * Toggle open/closed state
     */
    function toggle() {
        if (isOpen()) {
            dismiss();
        } else {
            open();
        }
    }

    /**
     * Restore open position if gesture threshold was not met
     */
    function snapBackToOpen(drawer) {
        const duration = 240;
        drawer.style.transition = 'transform ' + duration + 'ms ' + EASING_OPEN + ', opacity ' + duration + 'ms ease-out';
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

    /**
     * Set up keyboard traps, backdrop click, and touch physics
     */
    function setupInteractions() {
        ensureDrawer(function (drawer) {
            bindTabButton();

            const backdrop = document.getElementById('kwave-drawer-backdrop');

            if (backdrop && !backdrop._kwaveBackdropBound) {
                backdrop._kwaveBackdropBound = true;
                backdrop.addEventListener('click', function () {
                    dismiss();
                });
            }

            // Keyboard navigation & trap
            document.addEventListener('keydown', function (event) {
                if (!drawer.classList.contains('is-open')) return;

                if (event.key === 'Escape') {
                    event.preventDefault();
                    dismiss();
                    return;
                }

                if (event.key === 'Tab') {
                    const focusableElements = drawer.querySelectorAll(
                        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusableElements.length === 0) return;

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

            // Touchstart handler
            document.addEventListener('touchstart', function (event) {
                if (event.touches.length !== 1) return;

                const touch = event.touches[0];
                const clientX = touch.clientX;
                const clientY = touch.clientY;
                const isClosed = !drawer.classList.contains('is-open');

                // 1. [K] Button touch -> Ignore gesture tracker to guarantee instant tap response
                if (event.target.closest('#kwave-tab-btn, [data-kwave-drawer-toggle]')) {
                    gestureState.mode = 'button';
                    return;
                }

                // 2. Closed drawer -> Do not activate gestures from outside
                if (isClosed) {
                    gestureState.mode = 'none';
                    return;
                }

                // 3. Open drawer -> Inside panel touch enables dismissal gestures
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

            // Touchmove handler
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

                // Mode determination
                if (gestureState.mode === 'evaluating') {
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);

                    if (absX <= 8 && absY <= 8) return;

                    if (absX >= absY) {
                        gestureState.mode = 'horizontal';
                        drawer.style.transition = 'none';
                    } else {
                        if (deltaY < -8 && gestureState.canSwipeUp) {
                            gestureState.mode = 'vertical-up';
                            drawer.style.transition = 'none';
                        } else {
                            gestureState.mode = 'none';
                            return;
                        }
                    }
                }

                // Horizontal tracking
                if (gestureState.mode === 'horizontal') {
                    if (event.cancelable) event.preventDefault();
                    const drawerWidth = drawer.offsetWidth || 280;

                    if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                    rafSwipeId = requestAnimationFrame(function () {
                        if (deltaX < 0) {
                            const clampedX = Math.max(-drawerWidth, deltaX);
                            drawer.style.transform = 'translate3d(' + clampedX + 'px, -50%, 0)';
                            drawer.style.opacity = '1';
                        } else {
                            drawer.style.transform = 'translate3d(' + deltaX + 'px, -50%, 0)';
                            const opacity = Math.max(0.25, 1 - (deltaX / (drawerWidth * 1.5)));
                            drawer.style.opacity = opacity.toString();
                        }
                    });
                }
                // Vertical upward fling tracking
                else if (gestureState.mode === 'vertical-up' && deltaY < 0) {
                    if (event.cancelable) event.preventDefault();
                    if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                    rafSwipeId = requestAnimationFrame(function () {
                        drawer.style.transform = 'translate3d(0, calc(-50% + ' + deltaY + 'px), 0)';
                        const opacity = Math.max(0.2, 1 - (Math.abs(deltaY) / 320));
                        drawer.style.opacity = opacity.toString();
                    });
                }
            }, { passive: false });

            // Touchend handler
            document.addEventListener('touchend', function () {
                if (rafSwipeId) cancelAnimationFrame(rafSwipeId);
                const currentMode = gestureState.mode;
                gestureState.mode = 'none';

                if (currentMode === 'none' || currentMode === 'button') return;

                if (currentMode === 'horizontal') {
                    const deltaX = gestureState.deltaX;
                    const vx = gestureState.vx;
                    if (deltaX > 40 || (deltaX > 15 && vx > 0.22)) {
                        close('right');
                    } else if (deltaX < -32 || (deltaX < -12 && vx < -0.20)) {
                        close('left');
                    } else {
                        snapBackToOpen(drawer);
                    }
                } else if (currentMode === 'vertical-up') {
                    const deltaY = gestureState.deltaY;
                    const vy = gestureState.vy;
                    if (deltaY < -40 || (deltaY < -15 && vy < -0.22)) {
                        close('up');
                    } else {
                        snapBackToOpen(drawer);
                    }
                }
            });

            // Touchcancel handler
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

    // Initialize upon DOM readiness
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInteractions);
    } else {
        setupInteractions();
    }

    // Expose Modular API
    const KWaveDrawer = {
        init: setupInteractions,
        render: renderDrawer,
        open: open,
        close: close,
        dismiss: dismiss,
        toggle: toggle,
        isOpen: isOpen,
        updateSpine: updateSpine
    };

    global.KWaveDrawer = KWaveDrawer;

    // Backwards compatibility global shortcuts
    global.openKWaveDrawer = open;
    global.closeKWaveDrawer = dismiss;
    global.toggleKWaveDrawer = toggle;

})(typeof window !== 'undefined' ? window : this);
