/**
 * Legal Terms Modal Handler
 */
(function () {
    'use strict';

    var legalContents = {
        'terms-of-use': {
            title: 'Terms of Use (이용약관)',
            body: '<p>본 웹사이트는 K-WAVE MISSION의 사역 현황 브리핑 및 정보 제공을 목적으로 운영됩니다. 사용자는 본 사이트가 제공하는 리포트 및 자료를 무단 복제하거나 상업적 목적으로 재배포할 수 없습니다.</p>'
        },
        'terms-and-conditions': {
            title: 'Terms and Conditions (동역 및 후원 약관)',
            body: '<p>K-WAVE MISSION에 전달되는 사역 후원금은 인도네시아 현지 고등교육선교, 학술 교류, 한국학 교재 지원 및 현지 인재 양성을 위해 투명하게 사용됩니다.</p>'
        },
        'privacy-policy': {
            title: 'Privacy Policy (개인정보처리방침)',
            body: '<p>K-WAVE MISSION은 이용자의 개인정보를 중요시하며 관련 법령을 준수합니다. 문의 및 상담 과정에서 수집된 정보는 목적 외 용도로 활용되지 않습니다.</p>'
        }
    };

    window.openLegalModal = function (type) {
        var modal = document.getElementById('legal-modal');
        var titleEl = document.getElementById('legal-modal-title');
        var bodyEl = document.getElementById('legal-modal-body');

        if (modal && titleEl && bodyEl && legalContents[type]) {
            titleEl.innerText = legalContents[type].title;
            bodyEl.innerHTML = legalContents[type].body;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    window.closeLegalModal = function () {
        var modal = document.getElementById('legal-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };
})();