(function () {
    'use strict';

    /** Tracks the currently open post for share functionality. */
    let _currentPost = null;
    let _currentNoticePost = null;

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

    function _postSummary(post) {
        if (post.summary) return post.summary;
        return post.author + '의 현장 기록을 통해 이번 주 사역의 흐름과 기도 제목을 전합니다.';
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
            source: 'db',
            type: type
        };
    }

    function _normalizeFilePost(post) {
        return {
            id: post.id,
            file: post.file,
            title: post.title || '(제목 없음)',
            date: post.date || '-',
            category: post.category || '주간 선교 소식',
            author: post.author || 'K-WAVE MISSION',
            summary: post.summary || post.excerpt || '',
            thumbnail: post.thumbnail || '',
            source: 'file',
            type: String(post.type || '').toLowerCase()
        };
    }

    async function _fetchNewsPosts() {
        if (window.KWaveApi && typeof window.KWaveApi.fetchPosts === 'function') {
            try {
                const dbNews = await window.KWaveApi.fetchPosts('news');
                if (Array.isArray(dbNews) && dbNews.length > 0) {
                    return dbNews.map(_normalizeDbPost);
                }

                const dbAll = await window.KWaveApi.fetchPosts('all');
                if (Array.isArray(dbAll) && dbAll.length > 0) {
                    return dbAll
                        .map(_normalizeDbPost)
                        .filter(function (p) { return p.type !== 'notice'; });
                }
            } catch (err) {
                console.warn('DB posts fetch failed, fallback to posts.json:', err);
            }
        }

        const res = await fetch('./posts/posts.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return Array.isArray(json) ? json.map(_normalizeFilePost) : [];
    }

    async function _fetchNoticePost() {
        if (window.KWaveApi && typeof window.KWaveApi.fetchPosts === 'function') {
            try {
                const notices = await window.KWaveApi.fetchPosts('notice');
                if (Array.isArray(notices) && notices.length > 0) {
                    return _normalizeDbPost(notices[0]);
                }
            } catch (err) {
                console.warn('DB notice fetch failed, fallback to posts.json:', err);
            }
        }

        const res = await fetch('./posts/posts.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const posts = await res.json();
        if (!Array.isArray(posts) || posts.length === 0) return null;

        const noticePost = posts.find(function (p) {
            const category = String(p.category || p.type || '').trim().toUpperCase();
            return category === '공지사항' || category === 'NOTICE' || p.isMainNotice === true;
        });

        return noticePost ? _normalizeFilePost(noticePost) : null;
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

        var summary = _escapeHtml(_postSummary(featuredPost));
        container.innerHTML =
            '<article class="news-feature-card group" data-news-index="0" tabindex="0" role="button">' +
                '<div class="news-feature-media">' +
                    '<img src="./assets/images/indonesia-landscape.jpg" alt="인도네시아의 비식별 풍경 이미지" loading="lazy" onerror="this.parentElement.classList.add(\'is-empty\');this.remove()">' +
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
                        '<span class="font-mono text-slate-500">' + _escapeHtml(featuredPost.author) + '</span>' +
                    '</div>' +
                '</div>' +
            '</article>' +
            '<p class="news-security-caption">' +
                '<i data-lucide="shield-check" class="w-4 h-4 shrink-0"></i>' +
                '<span>K-Wave Mission은 현지 협력 기관과의 안전하고 지속 가능한 교류를 위해 국제 표준 개인정보 보호 및 보안 가이드라인(Security Protocol)을 엄격히 준수합니다. 이에 따라 일부 현장 사진 및 인물 정보는 비식별 처리되어 공개됩니다.</span>' +
            '</p>' +
            '<section class="field-voices" aria-labelledby="field-voices-title">' +
                '<div class="field-voices-heading">' +
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

        if (typeof lucide !== 'undefined') lucide.createIcons();

        window.dispatchEvent(new Event('news:rendered'));
        _openModalFromQuery(posts);
    }

    window.openNewsModal = async function (file, title, date, category, postId, source) {
        var postSource = source || 'file';
        _currentPost = { file: file, title: title, date: date, category: category, id: postId, source: postSource };

        var modalContent = document.getElementById('modal-content');
        
        // 📌 [수정] 모달 껍데기(#modal-content)의 하얀 배경 클래스를 완전히 지우고 약관 모달과 동일한 다크 스타일 적용
        if (modalContent) {
            modalContent.className = 'relative w-full max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar bg-slate-900 border border-slate-800 text-slate-100 p-8 sm:p-12 rounded-2xl shadow-2xl';
        }

        // 📌 수정된 modalContent.innerHTML 예시
modalContent.innerHTML =
    '<button type="button" onclick="closeNewsModal()" aria-label="닫기" class="absolute top-6 right-6 bg-transparent hover:bg-transparent text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer z-10">' +
        '<i data-lucide="x" class="w-5 h-5"></i>' +
    '</button>' +
    '<div class="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4 font-mono tracking-wide">' +
        '<span class="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">' + _escapeHtml(category) + '</span>' +
        '<span>&nbsp;•&nbsp;</span><span>' + _escapeHtml(date) + '</span>' +
    '</div>' +
    '<h2 class="font-serif text-xl sm:text-2xl leading-snug font-bold text-slate-100 mb-8 border-b border-slate-800 pb-6 pr-8">' + _escapeHtml(title) + '</h2>' +
    '<div id="modal-body" class="text-base text-slate-200 leading-relaxed overflow-x-hidden space-y-4">' +
        '<p class="text-slate-400">내용을 불러오는 중...</p>' +
    '</div>' +
    '<div class="modal-footer flex items-center justify-between border-t border-slate-800/80 pt-6 mt-10 font-sans">' +
        '<button onclick="shareCurrentPost()" class="btn-share-footer flex items-center gap-1.5 px-4 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer">' +
            '<i data-lucide="link-2" class="w-4 h-4 text-amber-400"></i> 링크 공유' +
        '</button>' +
        '<button onclick="closeNewsModal()" class="btn-close-footer px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer">닫기</button>' +
    '</div>';

        var modal = document.getElementById('news-modal');
        if (typeof window.activateModal === 'function') {
            window.activateModal(modal);
        } else {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        if (postId) history.replaceState(null, '', '?id=' + encodeURIComponent(postId));
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
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
                               '<img src="' + src + '" alt="' + (caption || '') + '"' + titleAttr + ' class="w-full max-w-full h-auto object-contain rounded-lg shadow-md" loading="lazy" />' +
                               (caption ? '<span class="text-xs text-slate-400 mt-2 text-center font-sans">' + caption + '</span>' : '') +
                           '</div>';
                };

                var trimmed = (md || '').trim();
                if (trimmed.startsWith('<div') || trimmed.startsWith('<p') || trimmed.startsWith('<!--')) {
                    bodyEl.innerHTML = md;
                } else {
                    bodyEl.innerHTML = marked.parse(md, { renderer: renderer });
                }
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
        if (event) event.preventDefault();

        var section = document.getElementById(sectionId);
        if (!section) return;

        var completeNavigation = function () {
            var url = new URL(window.location.href);
            url.searchParams.delete('id');
            url.hash = sectionId;
            history.replaceState(null, '', url.pathname + url.search + url.hash);

            section.scrollIntoView({ behavior: 'smooth', block: 'start' });

            var mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        };

        var modal = document.getElementById('news-modal');
        if (modal && !modal.classList.contains('hidden') && typeof window.deactivateModal === 'function') {
            window.deactivateModal(modal, completeNavigation);
            return;
        }

        completeNavigation();
    };

    document.addEventListener('DOMContentLoaded', function () {
        loadNews();
        loadMainNoticeBanner();
    });
})();