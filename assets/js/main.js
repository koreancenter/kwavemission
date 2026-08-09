<!-- Legal Terms Modal JavaScript -->
    <script>
        const legalContents = {
            'terms-of-use': {
                title: 'Terms of Use (이용약관)',
                body: '<p>본 웹사이트는 K-WAVE MISSION의 사역 현황 브리핑 및 정보 제공을 목적으로 운영됩니다. 사용자는 본 사이트가 제공하는 리포트 및 자료를 무단 복제하거나 상업적 목적으로 재배포할 수 없습니다.</p>'
            },
            'terms-and-conditions': {
                title: 'Terms and Conditions (동역 및 후원 약관)',
                body: '<p>K-WAVE MISSION에 전달되는 자발적 동역 후원금은 선교 현지 고등교육선교, 학술 교류, 한국학 교재 지원 및 현지 인재 양성을 위해 투명하게 사용되며 매년 10월 재정 동역자들에게 월간 재정결산보고서를 보내드리비다.</p>'
            },
            'privacy-policy': {
                title: 'Privacy Policy (개인정보처리방침)',
                body: '<p>K-WAVE MISSION은 이용자의 개인정보를 중요시하며 관련 법령을 준수합니다. 문의 및 상담 과정에서 수집된 정보는 목적 외 용도로 활용되지 않습니다.</p>'
            }
        };

        function openLegalModal(type) {
            const modal = document.getElementById('legal-modal');
            const titleEl = document.getElementById('legal-modal-title');
            const bodyEl = document.getElementById('legal-modal-body');
            
            if (legalContents[type]) {
                titleEl.innerText = legalContents[type].title;
                bodyEl.innerHTML = legalContents[type].body;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        function closeLegalModal() {
            const modal = document.getElementById('legal-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
    </script>
</body>
</html>