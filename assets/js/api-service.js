(function () {
    'use strict';

    async function _fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    window.KWaveApi = {
        async fetchPosts(type) {
            const q = type ? ('?type=' + encodeURIComponent(type)) : '?type=all';
            return _fetchJson('/api/get-posts' + q);
        },

        async fetchPostById(id) {
            return _fetchJson('/api/get-posts?id=' + encodeURIComponent(id));
        },

        async fetchMarkdownBySlug(slug) {
            const res = await fetch('/api/get-md?slug=' + encodeURIComponent(slug));
            if (!res.ok) throw new Error('문서를 불러올 수 없습니다.');
            return res.text();
        }
    };
})();
