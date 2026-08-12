(function () {
    'use strict';

    function closeNewsModal() {
        if (typeof window.deactivateModal !== 'function') return;
        window.deactivateModal(document.getElementById('news-modal'), function () {
            history.replaceState(null, '', window.location.pathname);
        });
    }

    function openContactModal(title) {
        const resolvedTitle = title || '선교 동역 문의';
        const titleEl = document.getElementById('contact-modal-title');
        if (titleEl) titleEl.innerText = resolvedTitle;
        if (typeof window.activateModal === 'function') {
            window.activateModal(document.getElementById('contact-modal'));
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeContactModal() {
        if (typeof window.deactivateModal === 'function') {
            window.deactivateModal(document.getElementById('contact-modal'));
        }
    }

    async function openMdModal(slug) {
        const modal = document.getElementById('md-modal');
        const container = document.getElementById('md-modal-content');
        const title = document.getElementById('md-modal-title');

        const titles = {
            terms: '이용약관',
            privacy: '개인정보처리방침',
            contact: 'Contact Us'
        };

        if (title) title.innerText = titles[slug] ? titles[slug] : '안내';
        if (container) container.innerHTML = '<div class="text-center py-10 text-slate-400">문서를 불러오는 중입니다...</div>';
        if (modal) modal.classList.remove('hidden');

        try {
            const markdownText = await window.KWaveApi.fetchMarkdownBySlug(slug);
            if (container) container.innerHTML = marked.parse(markdownText);
        } catch (err) {
            if (container) container.innerHTML = '<div class="text-center py-10 text-rose-400">' + err.message + '</div>';
        }
    }

    function closeMdModal() {
        const modal = document.getElementById('md-modal');
        if (modal) modal.classList.add('hidden');
    }

    window.closeNewsModal = closeNewsModal;
    window.openContactModal = openContactModal;
    window.closeContactModal = closeContactModal;
    window.openMdModal = openMdModal;
    window.closeMdModal = closeMdModal;
})();
