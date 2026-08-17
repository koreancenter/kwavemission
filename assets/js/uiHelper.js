(function () {
  'use strict';

  function showToast(message, type = 'error', duration = 4000) {
    if (!message) return;
    if (window.AdminApi && window.AdminApi.toast) {
      window.AdminApi.toast.show(message, type, duration);
      return;
    }
    console.warn(message);
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function parseSearchTokens(searchText) {
    const raw = String(searchText || '').trim();
    if (!raw) return { keywords: [], dateTerms: [], statuses: [], types: [] };

    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const keywords = [];
    const dateTerms = [];
    const statuses = [];
    const types = [];

    tokens.forEach((token) => {
      if (token.startsWith('status:')) {
        statuses.push(token.replace(/^status:/, ''));
      } else if (token.startsWith('type:')) {
        types.push(token.replace(/^type:/, ''));
      } else if (token.startsWith('date:')) {
        dateTerms.push(token.replace(/^date:/, ''));
      } else if (/^\d{4}[-/]\d{2}([-/]\d{2})?$/.test(token)) {
        dateTerms.push(token.replace(/\//g, '-'));
      } else if (['news', 'notice', 'recruiting', 'ongoing', 'preparing'].includes(token)) {
        statuses.push(token);
        types.push(token);
      } else {
        keywords.push(token);
      }
    });

    return { keywords, dateTerms, statuses, types };
  }

  function matchSearch(item, searchText) {
    const { keywords, dateTerms, statuses, types } = parseSearchTokens(searchText);
    if (!keywords.length && !dateTerms.length && !statuses.length && !types.length) {
      return true;
    }

    const haystack = [
      item.title || '',
      item.content || '',
      item.description || '',
      item.slug || '',
      item.category || '',
      item.status || '',
      item.type || '',
      item.created_at || '',
      item.updated_at || '',
      String(item.id || '')
    ].join(' ').toLowerCase();

    const matchesKeyword = keywords.every((word) => haystack.includes(word));
    const matchesDate = dateTerms.every((datePortion) => {
      const normalized = String(item.created_at || item.date || '').toLowerCase().replace(/\//g, '-');
      return normalized.includes(datePortion);
    });
    const matchesStatus = statuses.every((status) => {
      const target = String(item.status || item.type || '').toLowerCase();
      return target.includes(status);
    });
    const matchesType = types.every((typeValue) => {
      const target = String(item.type || item.status || '').toLowerCase();
      return target.includes(typeValue);
    });

    return matchesKeyword && matchesDate && matchesStatus && matchesType;
  }

  window.AdminUI = {
    showToast,
    escapeHtml,
    parseSearchTokens,
    matchSearch
  };
})();

// uiHelper.js 또는 api.js 상단/하단
window.unwrapItems = function(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.items && Array.isArray(response.items)) return response.items;
  return [];
};