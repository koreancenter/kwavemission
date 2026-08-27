(function () {
    'use strict';

    const MODAL_HASH_MAP = {
        partner: 'partner-modal',
        legal: 'legal-modal',
        md: 'md-modal',
        contact: 'contact-modal',
        'contact-us': 'md-modal',
        terms: 'md-modal',
        privacy: 'md-modal'
    };

    function getHashKey() {
        return (window.location.hash || '').replace(/^#/, '').trim();
    }

    function getModalIdFromHash(hashKey) {
        const normalizedKey = (hashKey || '').trim().toLowerCase();
        if (!normalizedKey) return '';
        // Only return explicitly mapped modal IDs - never generic section IDs
        return MODAL_HASH_MAP[normalizedKey] || '';
    }

    function getActiveModalId() {
        const modalIds = Object.values(MODAL_HASH_MAP);
        for (let i = 0; i < modalIds.length; i += 1) {
            const modal = document.getElementById(modalIds[i]);
            if (modal && !modal.classList.contains('hidden')) return modalIds[i];
        }
        return '';
    }

    function updateModalUrl(modalId, isOpening) {
        const targetKey = Object.keys(MODAL_HASH_MAP).find((key) => MODAL_HASH_MAP[key] === modalId);
        if (!targetKey) return;

        const baseUrl = window.location.pathname + window.location.search;
        const nextHash = '#' + targetKey;

        if (isOpening) {
            if (window.location.hash !== nextHash) {
                history.pushState({ modal: targetKey }, '', baseUrl + nextHash);
            }
            return;
        }

        if (window.location.hash === nextHash) {
            history.replaceState(null, '', baseUrl);
        }
    }

    function closeActiveModalByHistory() {
        const activeModalId = getActiveModalId();
        if (!activeModalId) return;

        const modal = document.getElementById(activeModalId);
        if (!modal) return;

        if (typeof window.deactivateModal === 'function') {
            window.deactivateModal(modal, function () {
                updateModalUrl(activeModalId, false);
            });
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
        updateModalUrl(activeModalId, false);
    }

    const originalActivateModal = typeof window.activateModal === 'function' ? window.activateModal : null;
    const originalDeactivateModal = typeof window.deactivateModal === 'function' ? window.deactivateModal : null;

    function activateModalWithHistory(modal) {
        const result = originalActivateModal ? originalActivateModal(modal) : undefined;
        if (modal && modal.id && Object.values(MODAL_HASH_MAP).includes(modal.id)) {
            updateModalUrl(modal.id, true);
        }
        return result;
    }

    function deactivateModalWithHistory(modal, onClosed) {
        const wrappedOnClosed = function () {
            if (modal && modal.id && Object.values(MODAL_HASH_MAP).includes(modal.id)) {
                updateModalUrl(modal.id, false);
            }
            if (typeof onClosed === 'function') onClosed();
        };

        if (originalDeactivateModal) {
            return originalDeactivateModal(modal, wrappedOnClosed);
        }

        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (typeof onClosed === 'function') onClosed();
        return undefined;
    }

    if (originalActivateModal) {
        window.activateModal = activateModalWithHistory;
    }
    if (originalDeactivateModal) {
        window.deactivateModal = deactivateModalWithHistory;
    }

    window.addEventListener('popstate', function () {
        const hashKey = getHashKey();
        const activeModalId = getActiveModalId();

        if (activeModalId && !hashKey) {
            closeActiveModalByHistory();
            return;
        }

        const modalId = getModalIdFromHash(hashKey);
        if (!modalId || !document.getElementById(modalId)) return;

        if (hashKey === 'terms' || hashKey === 'privacy' || hashKey === 'contact-us' || hashKey === 'contact') {
            openMdModal(hashKey);
            return;
        }

        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains('hidden')) {
            if (typeof window.activateModal === 'function') {
                window.activateModal(modal);
            }
        }
    });

    function handleInitialHash() {
        const hashKey = getHashKey();
        const modalId = getModalIdFromHash(hashKey);
        if (!modalId) {
            // If the hash is not a modal, ensure body overflow is never blocked
            if (!getActiveModalId()) {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                if (typeof window.unlockPageScroll === 'function') {
                    window.unlockPageScroll(null);
                }
            }
            if (hashKey) {
                setTimeout(function () {
                    const targetSection = document.getElementById(hashKey);
                    if (targetSection) {
                        const nav = document.querySelector('.glass-nav') || document.querySelector('nav');
                        const navHeight = nav ? nav.offsetHeight : 80;
                        const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                        const offsetPosition = Math.max(0, elementPosition - navHeight);
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 120);
            }
            return;
        }

        if (hashKey === 'terms' || hashKey === 'privacy' || hashKey === 'contact-us' || hashKey === 'contact') {
            openMdModal(hashKey);
            return;
        }

        const modal = document.getElementById(modalId);
        if (modal && typeof window.activateModal === 'function') {
            window.activateModal(modal);
        }
    }

    function closeNewsModal() {
        if (typeof window.deactivateModal !== 'function') return;
        window.deactivateModal(document.getElementById('news-modal'));
        history.replaceState(null, '', window.location.pathname);
    }

    function openContactModal(title) {
        const contactModalEl = document.getElementById('contact-modal');
        // contact-modal 요소가 없거나 md-modal 연동형 링크인 경우 openMdModal로 자동 전환
        if (!contactModalEl) {
            openMdModal('contact-us');
            return;
        }

        const resolvedTitle = title || '선교 동역 문의';
        const titleEl = document.getElementById('contact-modal-title');
        if (titleEl) titleEl.innerText = resolvedTitle;
        if (typeof window.activateModal === 'function') {
            window.activateModal(contactModalEl);
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeContactModal() {
        if (typeof window.deactivateModal === 'function') {
            window.deactivateModal(document.getElementById('contact-modal'));
        }
    }

    // contact와 contact-us 및 사역 소개 문서들을 정적 문서로 등록
    const STATIC_DOCUMENT_SLUGS = new Set([
        'terms', 'privacy', 'contact', 'contact-us',
        '01-for-spirit', '02-for-church', '03-for-world', '04-global-church', '05-mission-resource'
    ]);

    async function fetchModalMarkdown(slug) {
        const rawSlug = String(slug || '').trim();
        const cleanSlug = rawSlug.replace(/\.md$/, '');
        // 'contact'로 요청이 와도 'contact-us.md' 파일을 불러오도록 맵핑
        const normalizedSlug = (cleanSlug === 'contact') ? 'contact-us' : cleanSlug;

        if (STATIC_DOCUMENT_SLUGS.has(normalizedSlug) || /^\d{2}-/.test(normalizedSlug) || rawSlug.endsWith('.md')) {
            const response = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md');
            if (response.ok) {
                return await response.text();
            }
        }

        if (window.KWaveApi && typeof window.KWaveApi.fetchMarkdownBySlug === 'function') {
            try {
                return await window.KWaveApi.fetchMarkdownBySlug(normalizedSlug);
            } catch (e) {
                const fallbackRes = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md');
                if (fallbackRes.ok) {
                    return await fallbackRes.text();
                }
                throw e;
            }
        }

        const res = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md');
        if (!res.ok) {
            throw new Error('문서를 불러오지 못했습니다.');
        }
        return await res.text();
    }

    function hasHtmlMarkup(str) {
        if (!str || typeof str !== 'string') return false;
        const trimmed = str.trim();
        if (trimmed.startsWith('<')) return true;
        return /<(?:div|span|table|tbody|thead|tr|th|td|p|h[1-6]|ul|ol|li|section|article|header|footer|style|iframe|svg|!--|img|b|strong|i|em|a)\b/i.test(trimmed);
    }

    function renderModalContent(container, content) {
        if (!container) return;
        const strContent = String(content || '').trim();

        if (strContent.startsWith('<')) {
            container.innerHTML = strContent;
        } else if (hasHtmlMarkup(strContent)) {
            // Strip leading spaces/tabs that would cause markdown to treat HTML lines as code blocks (<pre><code>)
            const cleanHtmlMarkdown = strContent.replace(/^[ \t]+(?=<|<!--)/gm, '');
            if (window.marked && typeof window.marked.parse === 'function') {
                container.innerHTML = window.marked.parse(cleanHtmlMarkdown);
            } else {
                container.innerHTML = cleanHtmlMarkdown;
            }
        } else if (window.marked && typeof window.marked.parse === 'function') {
            container.innerHTML = window.marked.parse(strContent);
        } else {
            container.innerHTML = strContent;
        }
    }

    async function openMdModal(slug, customTitle) {
        const modal = document.getElementById('md-modal');
        const container = document.getElementById('md-modal-content');
        const title = document.getElementById('md-modal-title');

        const titles = {
            terms: '이용약관',
            privacy: '개인정보처리방침',
            contact: 'Contact Us',
            'contact-us': 'Contact Us',
            '01-for-spirit': 'Spirit & Culture',
            '02-for-church': 'Network & Alliance',
            '03-for-world': 'Impact & Innovation',
            '04-global-church': 'Global Outreach',
            '05-mission-resource': 'You are the Mission'
        };

        const cleanSlug = String(slug || 'contact-us').trim().replace(/\.md$/, '');
        const targetSlug = (cleanSlug === 'contact') ? 'contact-us' : cleanSlug;

        if (title) title.innerText = customTitle || titles[targetSlug] || '안내';
        if (container) container.innerHTML = '<div class="text-center py-10 text-slate-400 font-sans">문서를 불러오는 중입니다...</div>';
        if (modal) {
            if (typeof window.activateModal === 'function') {
                window.activateModal(modal);
            } else {
                document.body.style.overflow = 'hidden';
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        try {
            const markdownText = await fetchModalMarkdown(targetSlug);

            // 문서 첫 줄의 H1 제목 추출하여 모달 타이틀에 자연스럽게 동기화
            if (!customTitle && markdownText) {
                const matchH1 = markdownText.match(/^#\s+(.+)$/m);
                if (matchH1 && matchH1[1] && title) {
                    title.innerText = matchH1[1].trim();
                }
            }

            renderModalContent(container, markdownText);

            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (err) {
            if (container) container.innerHTML = '<div class="text-center py-10 text-rose-500 font-sans">' + err.message + '</div>';
        }     
    }

    function closeMdModal() {
        const modal = document.getElementById('md-modal');
        if (modal) {
            if (typeof window.deactivateModal === 'function') {
                window.deactivateModal(modal);
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        }
    }

    // 모달 배경 클릭 및 ESC 키 닫기 이벤트 등록
    const mdModalEl = document.getElementById('md-modal');
    if (mdModalEl) {
        mdModalEl.addEventListener('click', function (e) {
            if (e.target === mdModalEl) {
                closeMdModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const openModal = document.getElementById('md-modal');
            if (openModal && !openModal.classList.contains('hidden')) {
                closeMdModal();
            }
        }
    });

    handleInitialHash();

    window.closeNewsModal = closeNewsModal;
    window.openContactModal = openContactModal;
    window.closeContactModal = closeContactModal;
    window.openMdModal = openMdModal;
    window.closeMdModal = closeMdModal;
    window.ModalHistoryManager = {
        getActiveModalId,
        updateModalUrl,
        closeActiveModalByHistory,
        handleInitialHash
    };
})();