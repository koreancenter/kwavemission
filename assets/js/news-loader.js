(function () {
    'use strict';

    /** Tracks the currently open post for share functionality. */
    let _currentPost = null;
    let _currentNoticePost = null;
    const FEATURED_PUBLISHER_LABEL = '케이웨이브 미션';

    const FIELD_VOICES = [
        {
            label: '은혜로운 한국생활 참가자',
            quote: '이번 한국에서의 10일 살기를 통해 한국이 왜 발전한 나라가 되었는지 알게 되었습니다.'
        },
        {
            label: '한국어 수업 섬김 선생님',
            quote: '수업을 통해 순수한 현지 청년들을 만나게 되어 기뻤습니다. 더욱 사랑으로 기도겠습니다.'
        },
        {
            label: '경기OO교회 김OO 안수집사님',
            quote: '교환학생으로 한국에 가는 학생들이 예수님을 인격적으로 만날 수 있기를 간절히 기도하겠습니다.'
        }
    ];

    function _escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function _safeImageUrl(value) {
        var url = String(value || '').trim();
        if (!url || /^(javascript|data|vbscript):/i.test(url)) return '';
        return _escapeHtml(url);
    }

    function _unwrapItems(payload) {
        if (Array.isArray(payload)) return payload;
        return payload && Array.isArray(payload.data) ? payload.data : [];
    }

    function _postSummary(post) {
        if (post.summary) return post.summary;
        return post.author + '의 현장 기록을 통해 이번 주 사역의 흐름과 기도 제목을 전합니다.';
    }

    /**
     * Extracts the first image src from the content HTML/Markdown.
     * @param {string} content 
     * @returns {string} Image URL or empty string
     */
    function _extractFirstImageSrc(content) {
        if (!content || typeof content !== 'string') return '';

        // 1. HTML <img src="..."> extraction via DOMParser
        try {
            var parser = new DOMParser();
            var doc = parser.parseFromString(content, 'text/html');
            var img = doc.querySelector('img');
            if (img) {
                var src = (img.getAttribute('src') || '').trim();
                if (src && !/^(javascript|vbscript):/i.test(src)) {
                    return src;
                }
            }
        } catch (e) {}

        // 2. HTML <img ... src="..."> fallback via Regex
        var htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (htmlMatch && htmlMatch[1]) {
            var htmlSrc = htmlMatch[1].trim();
            if (htmlSrc && !/^(javascript|vbscript):/i.test(htmlSrc)) {
                return htmlSrc;
            }
        }

        // 3. Markdown ![alt](url) fallback via Regex
        var mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/?[^\s\)]+\.(?:png|jpg|jpeg|webp|gif|svg)[^\s\)]*)\)/i);
        if (mdMatch && mdMatch[1]) {
            var mdSrc = mdMatch[1].trim();
            if (mdSrc && !/^(javascript|vbscript):/i.test(mdSrc)) {
                return mdSrc;
            }
        }

        return '';
    }

    function _normalizeDbPost(post) {
        const type = String(post.type || '').toLowerCase();
        const created = String(post.created_at || post.date || '');
        const date = created ? created.substring(0, 10) : '';

        return {
            id: post.id,
            file: '',
            title: post.title || '(제목 없음)',
            date: date || '-',
            category: type === 'notice' ? '공지사항' : '주간 선교 소식',
            author: post.author || 'K-WAVE MISSION',
            summary: post.summary || post.excerpt || '',
            thumbnail: post.thumbnail_url || post.thumbnail || '',
            content: post.content || '',
            source: 'db',
            type: type
        };
    }

    async function _fetchNewsPosts() {
        if (!window.KWaveApi || typeof window.KWaveApi.fetchPosts !== 'function') {
            throw new Error('게시글 API를 사용할 수 없습니다.');
        }

        const dbNews = _unwrapItems(await window.KWaveApi.fetchPosts('news'));
        return dbNews.map(_normalizeDbPost);
    }

    async function _fetchNoticePost() {
        if (!window.KWaveApi || typeof window.KWaveApi.fetchPosts !== 'function') {
            throw new Error('공지사항 API를 사용할 수 없습니다.');
        }

        const notices = _unwrapItems(await window.KWaveApi.fetchPosts('notice'));
        return notices.length > 0 ? _normalizeDbPost(notices[0]) : null;
    }

    async function loadMainNoticeBanner() {
        const titleEl = document.getElementById('main-notice-title');
        if (!titleEl) return;

        try {
            const target = await _fetchNoticePost();

            if (target && target.title) {
                titleEl.textContent = '📢 ' + target.title;
                _currentNoticePost = {
                    file: target.file || '',
                    title: target.title,
                    date: target.date || (target.created_at ? String(target.created_at).substring(0, 10) : '-'),
                    category: target.category || (String(target.type || '').toLowerCase() === 'notice' ? '공지사항' : '주간 선교 소식'),
                    id: target.id,
                    source: target.file ? 'file' : 'db'
                };
            } else {
                titleEl.textContent = '📢 등록된 공지사항이 없습니다.';
                _currentNoticePost = null;
            }

        } catch (err) {
            console.error('Failed to load main notice banner:', err);
            titleEl.textContent = '📢 공지사항 로딩 실패';
        }
    }

    window.openNoticeBannerModal = function () {
        if (_currentNoticePost) {
            window.openNewsModal(
                _currentNoticePost.file,
                _currentNoticePost.title,
                _currentNoticePost.date,
                _currentNoticePost.category,
                _currentNoticePost.id,
                _currentNoticePost.source
            );
        } else {
            openMdModal('notice-main');
        }
    };

    async function loadNews() {
        const container = document.getElementById('news-container');
        if (!container) return;

        let posts;
        try {
            posts = await _fetchNewsPosts();
        } catch (err) {
            console.error('Failed to load news posts:', err);
            container.innerHTML =
                '<p class="text-slate-400 text-sm col-span-3 text-center py-8">소식을 불러오는 중 오류가 발생했습니다.</p>';
            return;
        }

        const displayPosts = posts.slice(0, 1);
        const featuredPost = displayPosts[0];

        if (!featuredPost) {
            container.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">등록된 미션 리포트가 없습니다.</p>';
            return;
        }

        // 본문이 아직 로드되지 않은 경우 상세 조회로 본문 확보
        if (!featuredPost.content && featuredPost.id && window.KWaveApi && typeof window.KWaveApi.fetchPostById === 'function') {
            try {
                var fullPostData = await window.KWaveApi.fetchPostById(featuredPost.id);
                var fullPost = fullPostData && fullPostData.data ? fullPostData.data : fullPostData;
                if (fullPost && fullPost.content) {
                    featuredPost.content = fullPost.content;
                }
            } catch (e) {
                console.warn('Failed to load full post content for thumbnail:', e);
            }
        }

        var landscapeImages = [
            './assets/images/indonesia-landscape.jpg',
            './assets/images/indonesia-landscape2.jpg',
            './assets/images/indonesia-landscape3.jpg',
            './assets/images/indonesia-landscape4.jpg'
        ];
        var fallbackImg = landscapeImages[Math.floor(Math.random() * landscapeImages.length)];

        // 1. 본문 HTML 파싱하여 첫 번째 <img src="..."> 추출
        var extractedImg = _extractFirstImageSrc(featuredPost.content);

        // 2 & 3. 본문 내 이미지 URL이 존재하면 썸네일로 사용, 없거나 비어 있으면 ./assets/images 폴더의 기본/랜덤 배열 이미지로 Fallback
        var displayImg = extractedImg || fallbackImg;

        var summary = _escapeHtml(_postSummary(featuredPost));
        container.innerHTML =
            '<article class="news-feature-card group" data-news-index="0" tabindex="0" role="button">' +
                '<div class="news-feature-media">' +
                    '<img data-lazy-src="' + _escapeHtml(displayImg) + '" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 9\'%3E%3C/svg%3E" alt="' + _escapeHtml(featuredPost.title) + '" class="transition-opacity duration-300 opacity-0" onerror="this.parentElement.classList.add(\'is-empty\');this.remove()">' +
                    '<span class="news-security-badge"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> SECURITY FILTERED</span>' +
                '</div>' +
                '<div class="news-feature-inner">' +
                    '<div class="news-feature-meta">' +
                        '<span class="news-badge">FEATURED REPORT</span>' +
                        '<span class="font-mono text-xs text-slate-500">' + _escapeHtml(featuredPost.date) + '</span>' +
                    '</div>' +
                    '<div>' +
                        '<span class="news-feature-category">' + _escapeHtml(featuredPost.category) + '</span>' +
                        '<h3 class="news-feature-title">' + _escapeHtml(featuredPost.title) + '</h3>' +
                        '<p class="news-feature-desc">' + summary + '</p>' +
                    '</div>' +
                    '<div class="news-feature-footer">' +
                        '<span class="news-read-link">자세히 보기 <i data-lucide="arrow-up-right" class="w-4 h-4"></i></span>' +
                        '<span class="news-feature-publisher font-mono text-slate-500">' + FEATURED_PUBLISHER_LABEL + '</span>' +
                    '</div>' +
                '</div>' +
            '</article>' +
            '<p class="news-security-caption">' +
                '<i data-lucide="shield-check" class="w-4 h-4 shrink-0"></i>' +
                '<span>K-Wave Mission은 현지 협력 기관과의 안전하고 지속 가능한 교류를 위해 국제 표준 개인정보 보호 및 보안 가이드라인(Security Protocol)을 엄격히 준수합니다. 이에 따라 일부 현장 사진 및 인물 정보는 비식별 처리되어 공개됩니다.</span>' +
            '</p>' +
            '<section class="field-voices" aria-labelledby="field-voices-title">' +
                '<div class="field-voices-heading text-center sm:text-left">' +
                    '<span class="font-mono text-[11px] text-slate-500 tracking-widest">ANONYMISED TESTIMONIES</span>' +
                    '<h3 id="field-voices-title">VOICES FROM THE FIELD</h3>' +
                '</div>' +
                '<div class="field-voices-grid">' +
                    FIELD_VOICES.map(function (voice) {
                        return '<blockquote class="field-voice-card">' +
                            '<span class="field-voice-mark" aria-hidden="true">“</span>' +
                            '<p>' + _escapeHtml(voice.quote) + '</p>' +
                            '<footer>' + _escapeHtml(voice.label) + '</footer>' +
                        '</blockquote>';
                    }).join('') +
                '</div>' +
            '</section>';

        container.querySelectorAll('[data-news-index]').forEach(function (card) {
            var openPost = function () {
                var post = displayPosts[Number(card.dataset.newsIndex)];
                if (!post) return;
                window.openNewsModal(post.file, post.title, post.date, post.category, post.id, post.source || 'file');
            };

            card.addEventListener('click', openPost);
            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openPost();
                }
            });
        });

        if (typeof window.observeLazyImages === 'function') window.observeLazyImages(container);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        window.dispatchEvent(new Event('news:rendered'));
        _openModalFromQuery(posts);
    }

    window.openNewsModal = async function (file, title, date, category, postId, source) {
        var postSource = source || 'file';
        _currentPost = { file: file, title: title, date: date, category: category, id: postId, source: postSource };

        var modalContent = document.getElementById('modal-content');
        
        // Keep the panel fixed while only the article body scrolls.
        if (modalContent) {
            modalContent.className = 'modal-panel relative w-full max-w-xl h-[85vh] max-h-[85vh] overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl flex flex-col';
        }

modalContent.innerHTML =
    '<div class="relative shrink-0 px-6 sm:px-12 pt-6 sm:pt-10 pb-5 sm:pb-6 border-b border-slate-800">' +
        '<button type="button" onclick="closeNewsModal()" aria-label="닫기" class="absolute top-4 right-4 sm:top-8 sm:right-8 bg-transparent hover:bg-transparent text-slate-400 hover:text-slate-200 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer z-10 rounded-xl">' +
            '<i data-lucide="x" class="w-5 h-5"></i>' +
        '</button>' +
        '<div class="flex items-center gap-2 text-xs text-slate-400 font-medium mb-3 sm:mb-4 pr-10 font-mono tracking-wide">' +
            '<span class="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">' + _escapeHtml(category) + '</span>' +
            '<span>&nbsp;•&nbsp;</span><span>' + _escapeHtml(date) + '</span>' +
        '</div>' +
        '<h2 class="font-serif text-lg sm:text-2xl leading-snug font-bold text-slate-100 pr-10">' + _escapeHtml(title) + '</h2>' +
    '</div>' +
    '<div id="modal-body" class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain px-6 sm:px-12 py-5 sm:py-6 text-base text-slate-200 leading-relaxed space-y-4">' +
        '<p class="text-slate-400">내용을 불러오는 중...</p>' +
    '</div>' +
    '<div class="shrink-0 flex items-center justify-between border-t border-slate-800/80 px-6 sm:px-12 py-4 font-sans gap-3">' +
        '<button onclick="shareCurrentPost()" class="btn-share-footer flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer">' +
            '<i data-lucide="link-2" class="w-4 h-4 text-amber-400"></i> 링크 공유' +
        '</button>' +
        '<button onclick="closeNewsModal()" class="btn-close-footer flex items-center justify-center px-5 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer">닫기</button>' +
    '</div>';

        var modal = document.getElementById('news-modal');
        if (typeof window.activateModal === 'function') {
            window.activateModal(modal);
        } else {
            document.body.style.overflow = 'hidden';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        if (postId) history.replaceState(null, '', '?id=' + encodeURIComponent(postId));
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            if (typeof window.ensureMarked === 'function') {
                await window.ensureMarked();
            }
            var md = '';
            if (postSource === 'db' && postId && window.KWaveApi && typeof window.KWaveApi.fetchPostById === 'function') {
                var dbPost = await window.KWaveApi.fetchPostById(postId);
                md = dbPost && dbPost.content ? dbPost.content : '';
            } else {
                var res = await fetch(file);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                md = await res.text();
            }

            var bodyEl = document.getElementById('modal-body');
            if (bodyEl) {
                var basePath = file.replace(/[^/]+$/, '');
                var renderer = new marked.Renderer();
                
                renderer.image = function (hrefOrToken, title, text) {
                    var href = hrefOrToken;
                    var caption = text;
                    var imageTitle = title;

                    if (hrefOrToken && typeof hrefOrToken === 'object') {
                        href = hrefOrToken.href || hrefOrToken.url || '';
                        caption = hrefOrToken.text || hrefOrToken.alt || '';
                        imageTitle = hrefOrToken.title || '';
                    }

                    if (!href || typeof href !== 'string') return '';

                    var src = href;
                    if (!/^(https?:\/\/|\/|data:)/.test(href)) {
                        if (/^\.\/assets\//.test(href) || /^assets\//.test(href)) {
                            src = './' + href.replace(/^\.\/$/, '');
                        } else if (postSource === 'db') {
                            src = './' + href.replace(/^\.\//, '');
                        } else {
                            src = (basePath + href).replace(/\/\.\//g, '/');
                        }
                    }
                    var titleAttr = imageTitle ? ' title="' + imageTitle + '"' : '';
                    
                    return '<div class="my-6 w-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-2">' +
                               '<img data-lazy-src="' + src + '" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 9\'%3E%3C/svg%3E" alt="' + (caption || '') + '"' + titleAttr + ' class="w-full max-w-full h-auto object-contain rounded-lg shadow-md transition-opacity duration-300 opacity-0" />' +
                               (caption ? '<span class="text-xs text-slate-400 mt-2 text-center font-sans">' + caption + '</span>' : '') +
                           '</div>';
                };

            var trimmed = (md || '').trim();
            var hasHtml = trimmed.startsWith('<') || /<(?:div|span|table|tbody|thead|tr|th|td|p|h[1-6]|ul|ol|li|section|article|header|footer|style|iframe|svg|!--|img|b|strong|i|em|a)\b/i.test(trimmed);

            // HTML 태그가 포함된 경우 마크다운의 4스페이스 코드블록 변환 방지 및 적절한 렌더링
            if (trimmed.startsWith('<')) {
                bodyEl.innerHTML = md;
            } else if (hasHtml) {
                var cleanHtml = (md || '').replace(/^[ \t]+(?=<|<!--)/gm, '');
                bodyEl.innerHTML = marked.parse(cleanHtml, { renderer: renderer });
            } else {
                bodyEl.innerHTML = marked.parse(md, { renderer: renderer });
            }
            if (typeof window.observeLazyImages === 'function') window.observeLazyImages(bodyEl);
        }
        } catch (err) {
            var bodyEl = document.getElementById('modal-body');
            if (bodyEl) bodyEl.innerHTML = '<p class="text-rose-400 text-sm py-4 font-sans">내용을 불러올 수 없습니다.</p>';
        }
    };

    window.shareCurrentPost = async function () {
        if (!_currentPost) return;
        var url = window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(_currentPost.id);
        var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        if (isMobile && typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: _currentPost.title, url: url });
                return;
            } catch (_) { }
        }

        try {
            await navigator.clipboard.writeText(url);
        } catch (_) {
            var ta = document.createElement('textarea');
            ta.value = url;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        if (typeof showShareToast === 'function') showShareToast('링크가 클립보드에 복사되었습니다.');
    };

    function _openModalFromQuery(posts) {
        var id = new URLSearchParams(window.location.search).get('id');
        if (!id) return;
        var post = posts.find(function (p) { return String(p.id) === id; });
        if (post) window.openNewsModal(post.file, post.title, post.date, post.category, post.id, post.source);
    }

    window.navigateToSection = function (event, sectionId) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        var section = document.getElementById(sectionId);
        if (!section) return;

        var completeNavigation = function () {
            var nav = document.querySelector('.glass-nav') || document.querySelector('nav');
            var navHeight = nav ? nav.offsetHeight : 80;
            var elementPosition = section.getBoundingClientRect().top + window.scrollY;
            var offsetPosition = Math.max(0, elementPosition - navHeight);

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            var mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        };

        var newsModal = document.getElementById('news-modal');
        if (newsModal && !newsModal.classList.contains('hidden') && typeof window.deactivateModal === 'function') {
            window.deactivateModal(newsModal, completeNavigation);
            return;
        }

        var mdModal = document.getElementById('md-modal');
        if (mdModal && !mdModal.classList.contains('hidden') && typeof window.deactivateModal === 'function') {
            window.deactivateModal(mdModal, completeNavigation);
            return;
        }

        var legalModal = document.getElementById('legal-modal');
        if (legalModal && !legalModal.classList.contains('hidden') && typeof window.deactivateModal === 'function') {
            window.deactivateModal(legalModal, completeNavigation);
            return;
        }

        completeNavigation();
    };

    function initLazyNews() {
        var triggered = false;
        function execute() {
            if (triggered) return;
            triggered = true;
            loadNews();
            loadMainNoticeBanner();
        }

        var newsContainer = document.getElementById('news-container');
        var noticeBanner = document.getElementById('main-notice-banner');

        if ('IntersectionObserver' in window && (newsContainer || noticeBanner)) {
            var observer = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) {
                        execute();
                        observer.disconnect();
                        return;
                    }
                }
            }, { rootMargin: '400px 0px' });

            if (newsContainer) observer.observe(newsContainer);
            if (noticeBanner) observer.observe(noticeBanner);
        }

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(execute, { timeout: 3000 });
        } else {
            setTimeout(execute, 1500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLazyNews);
    } else {
        initLazyNews();
    }
})();