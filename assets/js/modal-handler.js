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

    const MD_DOCS_META = {
        '01-for-spirit': {
            badge: '사역 안내',
            subtitle: '01 / HOLY MINISTRY',
            title: '영혼을 살리는 일: 영적 교류와 문화 외교'
        },
        '02-for-church': {
            badge: '사역 안내',
            subtitle: '02 / NEXT-GEN DISCIPLE',
            title: '교회를 세우는 일: 하나님 나라를 위한 연합'
        },
        '03-for-world': {
            badge: '사역 안내',
            subtitle: '03 / GLOBAL BRIDGE',
            title: '세상을 바꾸는 일: 지속 가능한 개발과 섬김'
        },
        '04-global-church': {
            badge: '사역 안내',
            subtitle: '04 / FOR CHURCHES',
            title: '우리 교회 세계화 프로젝트: 글로벌 사역 연계'
        },
        '05-mission-resource': {
            badge: '사역 안내',
            subtitle: '05 / FOR INDIVIDUALS',
            title: '여러분의 지식이 선교 자원입니다: 나의 자원으로 선교적 주체되기'
        },
        terms: {
            badge: '이용 안내',
            subtitle: 'LEGAL & TERMS',
            title: 'K-WAVE MISSION 서비스 이용약관'
        },
        privacy: {
            badge: '개인정보처리',
            subtitle: 'PRIVACY POLICY',
            title: 'K-WAVE MISSION 개인정보처리방침'
        },
        'contact-us': {
            badge: '동역 문의',
            subtitle: 'CONNECT WITH US',
            title: '선교 동역 및 파트너십 문의'
        },
        contact: {
            badge: '동역 문의',
            subtitle: 'CONNECT WITH US',
            title: '선교 동역 및 파트너십 문의'
        }
    };

    let _currentMdMeta = null;

    async function fetchModalMarkdown(slug) {
        const rawSlug = String(slug || '').trim();
        const cleanSlug = rawSlug.replace(/\.md$/, '');
        // 'contact'로 요청이 와도 'contact-us.md' 파일을 불러오도록 맵핑
        const normalizedSlug = (cleanSlug === 'contact') ? 'contact-us' : cleanSlug;

        if (STATIC_DOCUMENT_SLUGS.has(normalizedSlug) || /^\d{2}-/.test(normalizedSlug) || rawSlug.endsWith('.md')) {
            const response = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md?v=' + Date.now());
            if (response.ok) {
                return await response.text();
            }
        }

        if (window.KWaveApi && typeof window.KWaveApi.fetchMarkdownBySlug === 'function') {
            try {
                return await window.KWaveApi.fetchMarkdownBySlug(normalizedSlug);
            } catch (e) {
                const fallbackRes = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md?v=' + Date.now());
                if (fallbackRes.ok) {
                    return await fallbackRes.text();
                }
                throw e;
            }
        }

        const res = await fetch('./docs/' + encodeURIComponent(normalizedSlug) + '.md?v=' + Date.now());
        if (!res.ok) {
            throw new Error('문서를 불러오지 못했습니다.');
        }
        return await res.text();
    }

    function _inlineMarkdown(str) {
        if (!str) return '';
        return String(str)
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-2 max-w-full">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
            .replace(/__(.+?)__/g, '<strong class="font-bold text-slate-900">$1</strong>')
            .replace(/\*([^\*\n]+?)\*/g, '<em class="italic">$1</em>')
            .replace(/_([^_\n]+?)_/g, '<em class="italic">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs text-rose-600 font-mono">$1</code>');
    }

    function parseMarkdownToHtml(markdown) {
        if (!markdown || typeof markdown !== 'string') return '';
        var text = markdown.trim();

        // 1. Normalize line endings and preprocess
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Preprocess heading list bullets like "#### * **Title:**" -> "* **Title:**"
        text = text.replace(/^#{1,6}\s*[\*\-]\s+/gm, '* ');

        // Preprocess malformed table double pipes "|| ... | ... ||" -> "| ... | ... |"
        text = text.replace(/^\|{2,}/gm, '|').replace(/\|{2,}$/gm, '|');

        // 2. Try window.marked if available
        try {
            if (typeof window.marked === 'function') {
                return window.marked(text);
            }
            if (window.marked && typeof window.marked.parse === 'function') {
                return window.marked.parse(text);
            }
            if (typeof marked === 'function') {
                return marked(text);
            }
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                return marked.parse(text);
            }
        } catch (e) {
            console.warn('[ModalHandler] marked.parse fallback to native parser:', e);
        }

        // 3. Built-in Complete Fallback Markdown Parser
        // Parse tables first
        text = text.replace(/(?:^|\n)((?:[ \t]*\|[^\n]+\|\r?\n?)+)/g, function(match, tableBlock) {
            var lines = tableBlock.trim().split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
            if (lines.length >= 2 && lines.some(function(l) { return /^\|?\s*[-:]+[-| :]*\|?\s*$/.test(l); })) {
                var html = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm border border-slate-200 rounded-lg overflow-hidden">';
                var headerDone = false;
                lines.forEach(function(line, idx) {
                    if (/^\|?\s*[-:]+[-| :]*\|?\s*$/.test(line)) {
                        headerDone = true;
                        return;
                    }
                    var rawCells = line.split('|');
                    if (rawCells.length > 0 && !rawCells[0].trim()) rawCells.shift();
                    if (rawCells.length > 0 && !rawCells[rawCells.length - 1].trim()) rawCells.pop();
                    if (!rawCells.length) return;

                    html += '<tr class="' + (!headerDone && idx === 0 ? 'bg-slate-100/90' : (idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white')) + '">';
                    rawCells.forEach(function(cell) {
                        var cellContent = _inlineMarkdown(cell.trim());
                        if (!headerDone && idx === 0) {
                            html += '<th class="border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 text-left text-xs sm:text-sm tracking-tight">' + cellContent + '</th>';
                        } else {
                            html += '<td class="border border-slate-200 px-3.5 py-2.5 text-slate-700 text-xs sm:text-sm">' + cellContent + '</td>';
                        }
                    });
                    html += '</tr>';
                });
                html += '</table></div>';
                return '\n\n' + html + '\n\n';
            }
            return match;
        });

        // Split blocks by blank lines
        var blocks = text.split(/\n{2,}/);
        var output = [];

        blocks.forEach(function(block) {
            var trimmed = block.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('<div') || trimmed.startsWith('<table')) {
                output.push(trimmed);
                return;
            }

            // Headings
            var hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (hMatch) {
                var level = hMatch[1].length;
                var hContent = _inlineMarkdown(hMatch[2]);
                var cls = "font-bold text-slate-900 my-3 leading-snug";
                if (level === 1) cls = "font-serif text-xl sm:text-2xl font-extrabold text-slate-950 my-3 leading-tight border-b border-slate-100 pb-2";
                else if (level === 2) cls = "font-serif text-lg sm:text-xl font-bold text-slate-900 mt-4 mb-2 leading-snug";
                else if (level === 3) cls = "text-base sm:text-lg font-semibold text-slate-800 my-2 leading-normal";
                else cls = "text-sm sm:text-base font-semibold text-slate-800 my-2";

                output.push('<h' + level + ' class="' + cls + '">' + hContent + '</h' + level + '>');
                return;
            }

            // Blockquotes
            if (trimmed.startsWith('>')) {
                var bContent = trimmed.replace(/^>\s?/gm, '');
                output.push('<blockquote class="border-l-4 border-slate-800 bg-slate-50/70 rounded-r-lg px-4 py-2 my-3 text-slate-700 italic">' + _inlineMarkdown(bContent) + '</blockquote>');
                return;
            }

            // Unordered lists
            if (/^[\*\-]\s+/m.test(trimmed)) {
                var items = trimmed.split(/\n(?=[\*\-]\s+)/);
                var listHtml = '<ul class="list-disc pl-5 my-3 space-y-2 text-slate-700">';
                items.forEach(function(item) {
                    var itemText = item.replace(/^[\*\-]\s+/, '').trim();
                    listHtml += '<li class="leading-relaxed">' + _inlineMarkdown(itemText) + '</li>';
                });
                listHtml += '</ul>';
                output.push(listHtml);
                return;
            }

            // Ordered lists
            if (/^\d+\.\s+/m.test(trimmed)) {
                var oItems = trimmed.split(/\n(?=\d+\.\s+)/);
                var oListHtml = '<ol class="list-decimal pl-5 my-3 space-y-2 text-slate-700">';
                oItems.forEach(function(item) {
                    var itemText = item.replace(/^\d+\.\s+/, '').trim();
                    oListHtml += '<li class="leading-relaxed">' + _inlineMarkdown(itemText) + '</li>';
                });
                oListHtml += '</ol>';
                output.push(oListHtml);
                return;
            }

            // Standard Paragraph
            output.push('<p class="my-2 leading-relaxed text-slate-700">' + _inlineMarkdown(trimmed).replace(/\n/g, '<br>') + '</p>');
        });

        return output.join('\n');
    }

    function renderModalContent(container, content) {
        if (!container) return;
        const strContent = String(content || '').trim();

        if (strContent.startsWith('<') && !strContent.startsWith('<!-- markdown')) {
            container.innerHTML = strContent;
        } else {
            container.innerHTML = parseMarkdownToHtml(strContent);
        }
    }

    async function shareCurrentMdModal() {
        if (!_currentMdMeta) return;
        const url = window.location.origin + window.location.pathname + '#' + encodeURIComponent(_currentMdMeta.slug);
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        if (isMobile && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: _currentMdMeta.title || 'K-WAVE MISSION',
                    url: url
                });
                return;
            } catch (_) { }
        }

        try {
            await navigator.clipboard.writeText(url);
        } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }

        if (typeof window.showShareToast === 'function') {
            window.showShareToast('링크가 클립보드에 복사되었습니다.');
        }
    }

    async function openMdModal(slug, customTitle, customBadge, customSubtitle) {
        const modal = document.getElementById('md-modal');
        const container = document.getElementById('md-modal-content');
        const titleEl = document.getElementById('md-modal-title');
        const badgeEl = document.getElementById('md-modal-badge');
        const subtitleEl = document.getElementById('md-modal-subtitle');

        const cleanSlug = String(slug || 'contact-us').trim().replace(/\.md$/, '');
        const targetSlug = (cleanSlug === 'contact') ? 'contact-us' : cleanSlug;
        const meta = MD_DOCS_META[targetSlug] || {
            badge: customBadge || '안내',
            subtitle: customSubtitle || 'K-WAVE MISSION',
            title: customTitle || '안내'
        };

        const resolvedBadge = customBadge || meta.badge || '안내';
        const resolvedSubtitle = customSubtitle || meta.subtitle || 'K-WAVE MISSION';
        let resolvedTitle = customTitle || meta.title || '안내';

        _currentMdMeta = {
            slug: targetSlug,
            title: resolvedTitle,
            badge: resolvedBadge,
            subtitle: resolvedSubtitle
        };

        if (badgeEl) badgeEl.innerText = resolvedBadge;
        if (subtitleEl) subtitleEl.innerText = resolvedSubtitle;
        if (titleEl) titleEl.innerText = resolvedTitle;
        if (container) container.innerHTML = '<div class="text-center py-10 text-slate-400 font-sans">문서를 불러오는 중입니다...</div>';

        updateModalUrl(targetSlug);

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
            let markdownText = await fetchModalMarkdown(targetSlug);

            // 문서 첫 줄의 H1 제목이 있으면 상단 고정 헤더 타이틀에 반영하고 본문에서는 중복 제거
            if (markdownText) {
                const matchH1 = markdownText.match(/^#\s+(.+)$/m);
                if (matchH1 && matchH1[1]) {
                    const extractedTitle = matchH1[1].trim();
                    if (!customTitle && (!meta.title || meta.title === '안내')) {
                        resolvedTitle = extractedTitle;
                        if (titleEl) titleEl.innerText = resolvedTitle;
                        _currentMdMeta.title = resolvedTitle;
                    }
                    // 본문 스크롤 영역에서 중복 H1 제거
                    markdownText = markdownText.replace(/^#\s+[^\r\n]+[\r\n]*/, '');
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
        updateModalUrl(null);
    }

    function closeLegalModal() {
        const legalModal = document.getElementById('legal-modal');
        if (legalModal) {
            if (typeof window.deactivateModal === 'function') {
                window.deactivateModal(legalModal);
            } else {
                legalModal.classList.add('hidden');
                legalModal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        }
        updateModalUrl(null);
    }

    const CINEMATIC_DATA = {
        '01-for-spirit': {
            img: './assets/images/01-for-spirit.webp',
            alt: '영혼을 살리는 일',
            badge: '[ 01 / 영혼을 살리는 일 ]',
            title: 'K-Culture로 현지 영혼들과<br class="hidden sm:block" /> 인격적 관계를 맺습니다.',
            desc: '그 중에서 타겟팅된 전도 대상을 위해 동역자 그룹과 함께 기도하며 전략적으로 케어합니다.',
            layout: 'portrait',
            gradient: 'bg-gradient-to-t from-black/90 via-black/40 to-transparent bottom-0 h-[70%] sm:h-1/2',
            textPos: 'bottom-0 left-0 justify-end'
        },
        '02-for-church': {
            img: './assets/images/02-for-church.webp',
            alt: '교회를 세우는 일',
            badge: '[ 02 / 교회를 세우는 일 ]',
            title: '현지 교회가 지역 사회의 중심이 되도록 지원합니다.',
            desc: '현지 교회에서 성경캠프, 문화 잔치, 도서관 및 공부방 운영, 장학금과 기반 시설을 지원합니다.',
            layout: 'landscape',
            gradient: 'bg-gradient-to-b from-black/80 via-black/40 to-transparent top-0 h-[70%] sm:h-1/2',
            textPos: 'top-0 left-0 justify-start'
        },
        '03-for-world': {
            img: './assets/images/03-for-world.webp',
            alt: '세상을 변화시키는 일',
            badge: '[ 03 / 세상을 변화시키는 일 ]',
            title: '우리의 모든 자원을 총동원해 복음의 길을 개척합니다.',
            desc: '헌신된 교수와 청년들이 캠퍼스를 방문하여 학술대회, 세미나, 문화교류 행사를 통해 새 길을 개척합니다.',
            layout: 'landscape',
            gradient: 'bg-gradient-to-t from-black/90 via-black/40 to-transparent bottom-0 h-[70%] sm:h-1/2',
            textPos: 'bottom-0 left-0 justify-end'
        }
    };

    function closeCinematicModal() {
        const modal = document.getElementById('cinematic-modal');
        if (modal && typeof window.deactivateModal === 'function') {
            window.deactivateModal(modal);
        }
    }

    function openCinematicModal(cardId) {
        const modal = document.getElementById('cinematic-modal');
        const data = CINEMATIC_DATA[cardId];
        
        if (modal && data && typeof window.activateModal === 'function') {
            // Update content
            document.getElementById('cinematic-modal-img').src = data.img;
            document.getElementById('cinematic-modal-img').alt = data.alt;
            document.getElementById('cinematic-modal-badge').innerHTML = data.badge;
            document.getElementById('cinematic-modal-title').innerHTML = data.title;
            document.getElementById('cinematic-modal-desc').innerHTML = data.desc;
            
            // Update styling classes
            const panel = document.getElementById('cinematic-modal-panel');
            const gradient = document.getElementById('cinematic-modal-gradient');
            const textContainer = document.getElementById('cinematic-modal-text-container');
            
            // Reset classes
            panel.className = 'relative w-full rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up';
            gradient.className = 'absolute inset-x-0';
            textContainer.className = 'absolute w-full p-6 sm:p-8 flex flex-col text-left';
            
            if (data.layout === 'landscape') {
                panel.classList.add('max-w-3xl', 'aspect-[16/9]', 'sm:aspect-[16/10]');
            } else {
                panel.classList.add('max-w-sm', 'sm:max-w-md', 'aspect-[3/4]');
            }
            
            gradient.className = 'absolute inset-x-0 ' + data.gradient;
            textContainer.className = 'absolute w-full p-6 sm:p-8 flex flex-col text-left ' + data.textPos;
            
            window.activateModal(modal);
            
            // Add animation class if not present or restart it
            if (panel) {
                panel.classList.remove('animate-fade-in-up');
                void panel.offsetWidth; // trigger reflow
                panel.classList.add('animate-fade-in-up');
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

    const legalModalEl = document.getElementById('legal-modal');
    if (legalModalEl) {
        legalModalEl.addEventListener('click', function (e) {
            if (e.target === legalModalEl) {
                closeLegalModal();
            }
        });
    }

    const cinematicModalEl = document.getElementById('cinematic-modal');
    if (cinematicModalEl) {
        cinematicModalEl.addEventListener('click', function (e) {
            if (e.target === cinematicModalEl) {
                closeCinematicModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const openModal = document.getElementById('md-modal');
            if (openModal && !openModal.classList.contains('hidden')) {
                closeMdModal();
            }
            const openLegal = document.getElementById('legal-modal');
            if (openLegal && !openLegal.classList.contains('hidden')) {
                closeLegalModal();
            }
            const openCinematic = document.getElementById('cinematic-modal');
            if (openCinematic && !openCinematic.classList.contains('hidden')) {
                closeCinematicModal();
            }
        }
    });

    handleInitialHash();

    window.closeNewsModal = closeNewsModal;
    window.openContactModal = openContactModal;
    window.closeContactModal = closeContactModal;
    window.openMdModal = openMdModal;
    window.closeMdModal = closeMdModal;
    window.openCinematicModal = openCinematicModal;
    window.closeCinematicModal = closeCinematicModal;
    window.shareCurrentMdModal = shareCurrentMdModal;
    window.closeLegalModal = closeLegalModal;
    window.ModalHistoryManager = {
        getActiveModalId,
        updateModalUrl,
        closeActiveModalByHistory,
        handleInitialHash
    };
})();