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

        container.innerHTML = posts.map(function (post) {
            var fileJson = JSON.stringify(post.file);
            var titleJson = JSON.stringify(post.title);
            var dateJson = JSON.stringify(post.date);
            var categoryJson = JSON.stringify(post.category);
            var idJson = JSON.stringify(post.id);
            var onclick = 'openNewsModal(' + fileJson + ',' + titleJson + ',' + dateJson + ',' + categoryJson + ',' + idJson + ')';
            return (
                '<div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col hover:border-rose-500/50 transition-all cursor-pointer group" onclick="' + onclick.replace(/"/g, '&quot;') + '">' +
                    '<div class="aspect-video bg-slate-700 overflow-hidden flex items-center justify-center">' +
                        '<img src="' + post.thumbnail + '" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.style.display=\'none\';this.parentElement.innerHTML+=\'<span style=&quot;font-size:2.5rem&quot;>&#x1F4F0;</span>\'">' +
                    '</div>' +
                    '<div class="p-6 flex flex-col flex-1">' +
                        '<div class="flex items-center justify-between text-xs text-slate-400 mb-3">' +
                            '<span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">' + post.category + '</span>' +
                            '<span>' + post.date + '</span>' +
                        '</div>' +
                        '<h3 class="text-base font-bold text-white mb-3 line-clamp-2 flex-1">' + post.title + '</h3>' +
                        '<p class="text-xs text-slate-500 mt-auto">\u270D\uFE0F ' + post.author + '</p>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();

        _openModalFromQuery(posts);
    }

    window.openNewsModal = async function (file, title, date, category, postId) {
        _currentPost = { file: file, title: title, date: date, category: category, id: postId };

        var modalContent = document.getElementById('modal-content');
        modalContent.innerHTML =
            '<div class="flex items-center gap-2 text-xs text-rose-600 font-bold mb-2">' +
                '<span>' + category + '</span><span>&nbsp;•&nbsp;</span><span>' + date + '</span>' +
            '</div>' +
            '<h2 class="text-2xl font-bold text-slate-900 mb-6">' + title + '</h2>' +
            '<div id="modal-body" class="text-sm text-slate-700 leading-relaxed mb-8">' +
                '<p class="text-slate-400">내용을 불러오는 중...</p>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button onclick="shareCurrentPost()" class="btn-share-footer">' +
                    '<i data-lucide="link-2" class="w-4 h-4"></i> 링크 공유' +
                '</button>' +
                '<button onclick="closeNewsModal()" class="btn-close-footer">닫기</button>' +
            '</div>';

        var modal = document.getElementById('news-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
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
                renderer.image = function (href, title, text) {
                    var src = (href && !/^(https?:\/\/|\/|data:)/.test(href))
                        ? (basePath + href).replace(/\/\.\//g, '/')
                        : href;
                    var titleAttr = title ? ' title="' + title + '"' : '';
                    return '<img src="' + src + '" alt="' + text + '"' + titleAttr + ' style="max-width:100%;border-radius:0.5rem;margin:1rem 0">';
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
