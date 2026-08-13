/**
 * K-WAVE Brand DNA Drawer & Partner Connect Controller
 */
(function () {
    'use strict';

    // ==========================================
    // 1. Drawer 열기 함수 (진자 애니메이션 포함)
    // ==========================================
    window.openKWaveDrawer = function () {
        const drawer = document.getElementById('kwave-drawer');
        if (!drawer) return;

        // Drawer 표시 및 슬라이드 인
        drawer.classList.remove('hidden');
        setTimeout(function () {
            drawer.classList.remove('-translate-x-full');
        }, 10);

        // 카드 진자 낙하 순차 애니메이션 (Stagger)
        const cards = drawer.querySelectorAll('.drawer-card');
        cards.forEach(function (card, index) {
            card.classList.remove('animate-card-drop');
            card.style.animationDelay = '0ms';

            setTimeout(function () {
                card.style.animationDelay = (index * 120) + 'ms';
                card.classList.add('animate-card-drop');
            }, 150);
        });
    };

    // ==========================================
    // 2. Drawer 닫기 함수
    // ==========================================
    window.closeKWaveDrawer = function () {
        const drawer = document.getElementById('kwave-drawer');
        if (!drawer) return;

        drawer.classList.add('-translate-x-full');
        setTimeout(function () {
            drawer.classList.add('hidden');
        }, 400);
    };

    // ==========================================
    // 3. 함께 파도타기 (Partner Connect) 클릭 핸들러
    // ==========================================
    window.handlePartnerConnect = function () {
        // 1. Drawer 닫기
        if (typeof window.closeKWaveDrawer === 'function') {
            window.closeKWaveDrawer();
        }

        // 2. Partner Connect 모달 레이어 직접 열기
        setTimeout(function () {
            if (typeof window.openPartnerModal === 'function') {
                window.openPartnerModal();
            } else {
                // openPartnerModal 함수가 없을 경우 버튼 클릭 이벤트 강제 실행
                const partnerBtn = document.getElementById('partner-connect-btn');
                if (partnerBtn) partnerBtn.click();
            }
        }, 300);
    };
})();