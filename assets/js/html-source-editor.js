(function () {
  'use strict';

  function create(containerId, toolbarId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!container) return null;

    const toolbar = document.getElementById(toolbarId);
    if (toolbar) toolbar.classList.add('hidden');

    let source = container.parentNode.querySelector('.blogger-html-source');
    if (!source) {
      source = document.createElement('textarea');
      source.className = 'blogger-html-source w-full min-h-[300px] p-4 font-mono text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-slate-800 resize-y leading-relaxed';
      source.placeholder = 'HTML 코드를 직접 입력하거나 AI로 생성하세요.';
      container.parentNode.insertBefore(source, container.nextSibling);
    }

    container.classList.add('hidden');

    function setContent(value) {
      const html = String(value || '');
      source.value = html;
      if (hiddenInput) hiddenInput.value = html;
    }

    function getHTML() {
      return source.value;
    }

    source.addEventListener('input', function () {
      if (hiddenInput) hiddenInput.value = source.value;
    });

    setContent(hiddenInput ? hiddenInput.value : '');
    return { getHTML: getHTML, setContent: setContent, commands: { setContent: setContent }, source: source };
  }

  window.HtmlSourceEditor = { create: create };
})();
