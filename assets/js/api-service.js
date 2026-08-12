(function () {
    'use strict';

    window.KWaveApi = {
        async fetchMarkdownBySlug(slug) {
            const res = await fetch('/api/get-md?slug=' + encodeURIComponent(slug));
            if (!res.ok) throw new Error('문서를 불러올 수 없습니다.');
            return res.text();
        }
    };
})();
