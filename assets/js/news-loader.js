(function () {
    'use strict';

    /** Tracks the currently open post for share functionality. */
    let _currentPost = null;
    let _currentNoticePost = null;

    function _escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    // ==========================================
    // 1. 상단 고정 공지사항 배너 로딩 함수 (방어 코드 강화)
    // ==========================================
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

    // 전역에서 배너 클릭 시 실행할 함수
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

    // ==========================================
    // 2. 메인 사역 리포트 로딩 함수
    // ==========================================
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

        // 메인 페이지 Bento Grid 노출용 5개 상위 리포트 제한
        const displayPosts = posts.slice(0, 5);

        container.innerHTML = displayPosts.map(function (post, index) {
            var fileJson = JSON.stringify(post.file);
            var titleJson = JSON.stringify(post.title);
            var dateJson = JSON.stringify(post.date);
            var categoryJson = JSON.stringify(post.category);
            var idJson = JSON.stringify(post.id);
            var sourceJson = JSON.stringify(post.source || 'file');
            var onclick = 'openNewsModal(' + fileJson + ',' + titleJson + ',' + dateJson + ',' + categoryJson + ',' + idJson + ',' + sourceJson + ')';

            // 1. 대표 상단 리포트 (Featured Briefing - 2 Columns)
            if (index === 0) {
                return (
                    '<div class="md:col-span-2 news-feature-card group relative cursor-pointer" onclick="' + onclick.replace(/"/g, '&quot;') + '">' +
                        '<div class="news-feature-media" style="background-image:url(\'' + post.thumbnail + '\')"></div>' +
                        '<div class="news-feature-overlay"></div>' +
                        '<div class="news-feature-inner">' +
                            '<div class="flex items-center justify-between">' +
                                '<span class="news-badge">[FEATURED BRIEFING]</span>' +
                                '<span class="font-mono text-xs text-slate-300/80">' + post.date + '</span>' +
                            '</div>' +
                            '<div class="max-w-2xl my-6">' +
                                '<div class="mb-3 flex items-center gap-2 text-xs text-slate-300 font-mono">' +
                                    '<span class="rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5">' + _escapeHtml(post.category) + '</span>' +
                                '</div>' +
                                '<h3 class="news-feature-title">' + _escapeHtml(post.title) + '</h3>' +
                                '<p class="news-feature-desc">' + _escapeHtml(post.author) + '의 현장 브리핑으로 이번 주 사역의 핵심 흐름을 먼저 확인합니다.</p>' +
                            '</div>' +
                            '<div class="news-feature-footer">' +
                                '<span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-brand-200 transition-transform group-hover:translate-x-[1px]">' +
                                    '<i data-lucide="arrow-right" class="w-4 h-4"></i> 상세 리포트 보기' +
                                '</span>' +
                                '<span class="font-mono text-slate-300/90">✍️ ' + _escapeHtml(post.author) + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            }

            // 2. 서브 필드 로그 리포트 (Field Log - 1 Column)
            return (
                '<div class="md:col-span-1 news-card group cursor-pointer" onclick="' + onclick.replace(/"/g, '&quot;') + '">' +
                    '<div>' +
                        '<div class="news-card-image-wrap aspect-[16/9] w-full overflow-hidden bg-slate-900 relative rounded-t-xl">' +
                            '<img src="' + post.thumbnail + '" alt="" class="news-card-image w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105" onerror="this.style.display=\'none\';this.parentElement.innerHTML+=\'<div class=&quot;w-full h-full flex items-center justify-center bg-slate-800 text-3xl&quot;>📰</div>\'">' +
                            '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent"></div>' +
                        '</div>' +
                        '<div class="news-card-content p-4">' +
                            '<div class="news-card-meta flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">' +
                                '<span class="news-card-tag font-semibold text-brand-300">[FIELD LOG]</span>' +
                                '<span>' + _escapeHtml(post.date) + '</span>' +
                            '</div>' +
                            '<h3 class="news-card-title line-clamp-2 text-base font-medium text-slate-100 group-hover:text-brand-200 transition-colors">' + _escapeHtml(post.title) + '</h3>' +
                        '</div>' +
                    '</div>' +
                    '<div class="news-card-footer px-4 pb-4 flex items-center justify-between text-xs">' +
                        '<span class="font-mono text-slate-400">✍️ ' + _escapeHtml(post.author) + '</span>' +
                        '<i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-brand-300 group-hover:translate-x-[1px] transition-transform"></i>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();

        window.dispatchEvent(new Event('news:rendered'));
        _openModalFromQuery(posts);
    }

    window.openNewsModal = async function (file, title, date, category, postId, source) {
        var postSource = source || 'file';
        _currentPost = { file: file, title: title, date: date, category: category, id: postId, source: postSource };

        var modalContent = document.getElementById('modal-content');
        modalContent.innerHTML =
            '<div class="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2 font-mono tracking-wide">' +
                '<span>' + _escapeHtml(category) + '</span><span>&nbsp;•&nbsp;</span><span>' + _escapeHtml(date) + '</span>' +
            '</div>' +
            '<h2 class="font-serif text-[1.75rem] leading-tight font-semibold text-slate-900 mb-5">' + _escapeHtml(title) + '</h2>' +
            '<div id="modal-body" class="text-sm text-slate-700 leading-relaxed mb-7 overflow-x-hidden">' +
                '<p class="text-slate-400">내용을 불러오는 중...</p>' +
            '</div>' +
            '<div class="modal-footer flex items-center justify-between border-t border-slate-100 pt-4 mt-6">' +
                '<button onclick="shareCurrentPost()" class="btn-share-footer flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors">' +
                    '<i data-lucide="link-2" class="w-4 h-4"></i> 링크 공유' +
                '</button>' +
                '<button onclick="closeNewsModal()" class="btn-close-footer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">닫기</button>' +
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
                    
                    return '<div class="my-4 w-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-50">' +
                               '<img src="' + src + '" alt="' + (caption || '') + '"' + titleAttr + ' class="w-full max-w-full h-auto object-contain rounded-xl shadow-sm" loading="lazy" />' +
                               (caption ? '<span class="text-xs text-slate-400 mt-2 text-center">' + caption + '</span>' : '') +
                           '</div>';
                };
                bodyEl.innerHTML = marked.parse(md, { renderer: renderer });
            }
        } catch (err) {
            var bodyEl = document.getElementById('modal-body');
            if (bodyEl) bodyEl.innerHTML = '<p class="text-rose-500 text-sm py-4">내용을 불러올 수 없습니다.</p>';
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

    // DOM 완료 시 메인 리포트와 상단 공지사항 배너를 모두 로드
    document.addEventListener('DOMContentLoaded', function () {
        loadNews();
        loadMainNoticeBanner();
    });
})();