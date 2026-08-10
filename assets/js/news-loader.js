(function () {
    'use strict';

    /** Tracks the currently open post for share functionality. */
    let _currentPost = null;

    async function loadNews() {
        const container = document.getElementById('news-container');
        if (!container) return;

        let posts;
        try {
            const res = await fetch('./posts/posts.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            posts = await res.json();
        } catch (err) {
            console.error('Failed to load posts.json:', err);
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
            var onclick = 'openNewsModal(' + fileJson + ',' + titleJson + ',' + dateJson + ',' + categoryJson + ',' + idJson + ')';

            // 1. 대표 상단 리포트 (Featured Briefing - 2 Columns)
            if (index === 0) {
                return (
                    '<div class="md:col-span-2 news-feature-card group relative" onclick="' + onclick.replace(/"/g, '&quot;') + '">' +
                        '<div class="news-feature-media" style="background-image:url(\'' + post.thumbnail + '\')"></div>' +
                        '<div class="news-feature-overlay"></div>' +
                        '<div class="news-feature-inner">' +
                            '<div class="flex items-center justify-between">' +
                                '<span class="news-badge">[FEATURED BRIEFING]</span>' +
                                '<span class="font-mono text-xs text-slate-300/80">' + post.date + '</span>' +
                            '</div>' +
                            '<div class="max-w-2xl my-6">' +
                                '<div class="mb-3 flex items-center gap-2 text-xs text-slate-300 font-mono">' +
                                    '<span class="rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5">' + post.category + '</span>' +
                                '</div>' +
                                '<h3 class="news-feature-title">' + post.title + '</h3>' +
                                '<p class="news-feature-desc">' + post.author + '의 현장 브리핑으로 이번 주 사역의 핵심 흐름을 먼저 확인합니다.</p>' +
                            '</div>' +
                            '<div class="news-feature-footer">' +
                                '<span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-brand-200 transition-transform group-hover:translate-x-[1px]">' +
                                    '<i data-lucide="arrow-right" class="w-4 h-4"></i> 상세 리포트 보기' +
                                '</span>' +
                                '<span class="font-mono text-slate-300/90">✍️ ' + post.author + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            }

            // 2. 서브 필드 로그 리포트 (Field Log - 1 Column)
            return (
                '<div class="md:col-span-1 news-card group" onclick="' + onclick.replace(/"/g, '&quot;') + '">' +
                    '<div>' +
                        '<div class="news-card-image-wrap">' +
                            '<img src="' + post.thumbnail + '" alt="" class="news-card-image" onerror="this.style.display=\'none\';this.parentElement.innerHTML+=\'<span style=&quot;font-size:2.5rem&quot;>📰</span>\'">' +
                            '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent"></div>' +
                        '</div>' +
                        '<div class="news-card-content">' +
                            '<div class="news-card-meta">' +
                                '<span class="news-card-tag">[FIELD LOG]</span>' +
                                '<span>' + post.date + '</span>' +
                            '</div>' +
                            '<h3 class="news-card-title line-clamp-2">' + post.title + '</h3>' +
                        '</div>' +
                    '</div>' +
                    '<div class="news-card-footer">' +
                        '<span class="font-mono text-slate-400">✍️ ' + post.author + '</span>' +
                        '<i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-brand-300 group-hover:translate-x-[1px] transition-transform"></i>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Notify page-level animation controller to bind staggered reveals on injected cards.
        window.dispatchEvent(new Event('news:rendered'));

        // 쿼리 URL 매칭 시 모달 오픈은 전체 posts 배열 대상 적용
        _openModalFromQuery(posts);
    }

    window.openNewsModal = async function (file, title, date, category, postId) {
        _currentPost = { file: file, title: title, date: date, category: category, id: postId };

        var modalContent = document.getElementById('modal-content');
        modalContent.innerHTML =
            '<div class="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2 font-mono tracking-wide">' +
                '<span>' + category + '</span><span>&nbsp;•&nbsp;</span><span>' + date + '</span>' +
            '</div>' +
            '<h2 class="font-serif text-[1.75rem] leading-tight font-semibold text-slate-900 mb-5">' + title + '</h2>' +
            '<div id="modal-body" class="text-sm text-slate-700 leading-relaxed mb-7">' +
                '<p class="text-slate-400">내용을 불러오는 중...</p>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button onclick="shareCurrentPost()" class="btn-share-footer">' +
                    '<i data-lucide="link-2" class="w-4 h-4"></i> 링크 공유' +
                '</button>' +
                '<button onclick="closeNewsModal()" class="btn-close-footer">닫기</button>' +
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
            var res = await fetch(file);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var md = await res.text();
            var bodyEl = document.getElementById('modal-body');
            if (bodyEl) {
                // Rewrite relative image paths in markdown to be root-relative
                var basePath = file.replace(/[^/]+$/, '');
                var renderer = new marked.Renderer();
                renderer.image = function (hrefOrToken, title, text) {
                    var href = hrefOrToken;
                    var caption = text;
                    var imageTitle = title;

                    // marked versions may pass a token object instead of positional args.
                    if (hrefOrToken && typeof hrefOrToken === 'object') {
                        href = hrefOrToken.href || hrefOrToken.url || '';
                        caption = hrefOrToken.text || hrefOrToken.alt || '';
                        imageTitle = hrefOrToken.title || '';
                    }

                    if (!href || typeof href !== 'string') return '';

                    var src = href;
                    if (!/^(https?:\/\/|\/|data:)/.test(href)) {
                        if (/^\.\/assets\//.test(href) || /^assets\//.test(href)) {
                            src = './' + href.replace(/^\.\//, '');
                        } else {
                            src = (basePath + href).replace(/\/\.\//g, '/');
                        }
                    }
                    var titleAttr = imageTitle ? ' title="' + imageTitle + '"' : '';
                    return '<img src="' + src + '" alt="' + (caption || '') + '"' + titleAttr + ' style="max-width:100%;border-radius:0.5rem;margin:1rem 0">';
                };
                bodyEl.innerHTML = marked.parse(md, { renderer: renderer });
            }
        } catch (err) {
            var bodyEl = document.getElementById('modal-body');
            if (bodyEl) bodyEl.innerHTML = '<p class="text-rose-500 text-sm">내용을 불러올 수 없습니다.</p>';
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
            } catch (_) { /* fall through to clipboard */ }
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
        if (post) window.openNewsModal(post.file, post.title, post.date, post.category, post.id);
    }

    document.addEventListener('DOMContentLoaded', loadNews);
})();