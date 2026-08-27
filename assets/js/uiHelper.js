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

  function confirmModal(message, { title = '확인', confirmText = '확인', cancelText = '취소', danger = false } = {}) {
    return new Promise((resolve) => {
      try {
        const overlay = document.createElement('div');
        overlay.id = 'adminConfirmOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;background-color:rgba(15,23,42,0.65);backdrop-filter:blur(4px);opacity:0;transition:opacity 180ms ease;';

        const box = document.createElement('div');
        box.style.cssText = 'background:#ffffff;border-radius:1rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);max-width:380px;width:100%;padding:1.5rem;color:#1e293b;transform:scale(0.95);transition:transform 180ms ease;font-family:inherit;';

        box.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
            <span style="font-size:1.25rem;">${danger ? '⚠️' : '❓'}</span>
            <h3 style="margin:0;font-size:1rem;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(title)}</h3>
          </div>
          <p style="margin:0 0 1.25rem 0;font-size:0.875rem;color:#475569;line-height:1.6;white-space:pre-line;">${escapeHtml(message)}</p>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:0.5rem;">
            <button type="button" class="btn-cancel" style="display:inline-flex;align-items:center;justify-content:center;padding:0.5rem 0.85rem;border-radius:0.5rem;font-size:0.75rem;font-weight:600;color:#475569;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;transition:all 150ms ease;min-height:unset;box-shadow:none;">${escapeHtml(cancelText)}</button>
            <button type="button" class="btn-confirm" style="display:inline-flex;align-items:center;justify-content:center;padding:0.5rem 1rem;border-radius:0.5rem;font-size:0.75rem;font-weight:600;color:#ffffff;background:${danger ? '#e11d48' : '#0f172a'};border:none;cursor:pointer;transition:all 150ms ease;min-height:unset;box-shadow:none;">${escapeHtml(confirmText)}</button>
          </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
          overlay.style.opacity = '1';
          box.style.transform = 'scale(1)';
        });

        let resolved = false;
        const cleanup = (result) => {
          if (resolved) return;
          resolved = true;
          overlay.style.opacity = '0';
          box.style.transform = 'scale(0.95)';
          setTimeout(() => {
            overlay.remove();
            resolve(result);
          }, 150);
        };

        const cancelBtn = box.querySelector('.btn-cancel');
        const confirmBtn = box.querySelector('.btn-confirm');

        if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); cleanup(false); });
        if (confirmBtn) confirmBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); cleanup(true); });
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) cleanup(false);
        });

        const onKeyDown = (e) => {
          if (e.key === 'Escape') {
            window.removeEventListener('keydown', onKeyDown);
            cleanup(false);
          } else if (e.key === 'Enter') {
            window.removeEventListener('keydown', onKeyDown);
            cleanup(true);
          }
        };
        window.addEventListener('keydown', onKeyDown, { once: true });
      } catch (err) {
        console.error('confirmModal error, fallback to confirm:', err);
        resolve(window.confirm(message));
      }
    });
  }

  window.AdminUI = {
    showToast,
    escapeHtml,
    parseSearchTokens,
    matchSearch,
    confirm: confirmModal
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