(function () {
  'use strict';

  const listState = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    postVisibleCount: 12,
    programVisibleCount: 12,
    currentPostType: 'all'
  });

  function getAccessToken() {
    return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('admin_session=active'))
      ? 'cookie-based-session'
      : (sessionStorage.getItem('adminAccessToken') || '');
  }

  function getRefreshToken() {
    return sessionStorage.getItem('adminRefreshToken') || '';
  }

  function setAuthTokens({ accessToken, refreshToken }) {
    document.cookie = 'admin_session=active; Path=/; SameSite=Lax; max-age=900';
    if (accessToken) sessionStorage.setItem('adminAccessToken', accessToken);
    if (refreshToken) sessionStorage.setItem('adminRefreshToken', refreshToken);
    if (window.AdminApi && window.AdminApi.api) {
      window.AdminApi.api.setAccessToken(accessToken || getAccessToken());
      window.AdminApi.api.setRefreshToken(refreshToken || getRefreshToken());
    }
  }

  function clearAuthTokens() {
    sessionStorage.removeItem('adminAccessToken');
    sessionStorage.removeItem('adminRefreshToken');
    document.cookie = 'admin_session=; Path=/; SameSite=Lax; Max-Age=0';
    if (window.AdminApi && window.AdminApi.api) {
      window.AdminApi.api.clearTokens();
    }
  }

  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');

  function showLoginOverlay() {
    if (!loginOverlay) return;
    loginOverlay.style.display = 'flex';
    const passwordInput = document.getElementById('loginPassword');
    if (passwordInput) {
      passwordInput.value = '';
      setTimeout(() => passwordInput.focus(), 50);
    }
  }

  function hideLoginOverlay() {
    if (!loginOverlay) return;
    loginOverlay.style.display = 'none';
  }

  function switchTab(tabName) {
    const validTabs = ['posts', 'programs', 'official'];
    if (!validTabs.includes(tabName)) {
      tabName = 'posts';
    }

    // 1. Update Tab Button Styles & Active state
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      const target = btn.dataset.tab || btn.getAttribute('data-tab');
      if (target === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Explicitly toggle visibility on all tab contents
    validTabs.forEach((t) => {
      const tabEl = document.getElementById(`tab-${t}`);
      if (tabEl) {
        if (t === tabName) {
          tabEl.classList.add('active');
          tabEl.classList.remove('hidden');
          tabEl.style.display = 'block';
        } else {
          tabEl.classList.remove('active');
          tabEl.classList.add('hidden');
          tabEl.style.display = 'none';
        }
      }
    });

    // 3. Load corresponding tab data safely
    try {
      if (tabName === 'posts') {
        if (typeof window.loadPostList === 'function') window.loadPostList();
        else if (window.PostManager?.loadPostList) window.PostManager.loadPostList();
      } else if (tabName === 'programs') {
        if (typeof window.loadProgramList === 'function') window.loadProgramList();
        else if (window.ProgramManager?.loadProgramList) window.ProgramManager.loadProgramList();
      } else if (tabName === 'official') {
        if (typeof window.loadOfficialList === 'function') {
          window.loadOfficialList();
        } else if (window.OfficialManager?.loadOfficialList) {
          window.OfficialManager.loadOfficialList();
        }
      }
    } catch (err) {
      console.error('Error during tab switch to ' + tabName, err);
    }
  }

  function showPostEditor() {
    const listView = document.getElementById('postListView');
    const editorView = document.getElementById('postEditorView');
    if (listView) listView.classList.remove('active');
    if (editorView) editorView.classList.add('active');
  }

  function hidePostEditor() {
    const form = document.getElementById('postForm');
    if (form) form.reset();
    const idInput = document.getElementById('postId');
    if (idInput) idInput.value = '';
    const preview = document.getElementById('preview-img');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
      preview.classList.add('hidden');
    }
    const fileInput = document.getElementById('postImage');
    if (fileInput) fileInput.value = '';

    if (window.PostManager && window.PostManager.setTiptapContent) {
      window.PostManager.setTiptapContent('');
    }
    const title = document.getElementById('postFormTitle');
    if (title) title.textContent = '새 글 작성';
    const listView = document.getElementById('postListView');
    const editorView = document.getElementById('postEditorView');
    if (editorView) editorView.classList.remove('active');
    if (listView) listView.classList.add('active');
  }

  function showProgramEditor() {
    const listView = document.getElementById('programListView');
    const editorView = document.getElementById('programEditorView');
    if (listView) listView.classList.remove('active');
    if (editorView) editorView.classList.add('active');
  }

  function hideProgramEditor() {
    const form = document.getElementById('programForm');
    if (form) form.reset();
    const idInput = document.getElementById('programId');
    if (idInput) idInput.value = '';
    const title = document.getElementById('programFormTitle');
    if (title) title.textContent = '새 프로그램 등록';
    const listView = document.getElementById('programListView');
    const editorView = document.getElementById('programEditorView');
    if (editorView) editorView.classList.remove('active');
    if (listView) listView.classList.add('active');
  }

  function showToast(message, type = 'error', duration = 4000) {
    if (!message) return;
    if (window.AdminUI && window.AdminUI.showToast) {
      window.AdminUI.showToast(message, type, duration);
    } else if (window.AdminApi && window.AdminApi.toast) {
      window.AdminApi.toast.show(message, type, duration);
    }
  }

  function bindStaticActions() {
    // Global delegation for nav tabs
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.nav-tab-btn');
      if (tabBtn && tabBtn.dataset.tab) {
        switchTab(tabBtn.dataset.tab);
        return;
      }

      const showOfficial = e.target.closest('[data-action="show-official-editor"]');
      if (showOfficial) {
        if (window.OfficialManager?.showOfficialEditor) window.OfficialManager.showOfficialEditor();
        return;
      }

      const hideOfficial = e.target.closest('[data-action="hide-official-editor"]');
      if (hideOfficial) {
        if (window.OfficialManager?.hideOfficialEditor) window.OfficialManager.hideOfficialEditor();
        return;
      }
    });

    document.querySelectorAll('[data-action="show-post-editor"]').forEach((button) => {
      button.addEventListener('click', showPostEditor);
    });
    document.querySelectorAll('[data-action="hide-post-editor"]').forEach((button) => {
      button.addEventListener('click', hidePostEditor);
    });
    document.querySelectorAll('[data-action="show-program-editor"]').forEach((button) => {
      button.addEventListener('click', showProgramEditor);
    });
    document.querySelectorAll('[data-action="hide-program-editor"]').forEach((button) => {
      button.addEventListener('click', hideProgramEditor);
    });
  }

  function initLoginFlow() {
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!password) {
        showToast('비밀번호를 입력하세요.', 'warning');
        return;
      }

      clearAuthTokens();

      try {
        const response = await window.AdminApi.api.post('/api/login', {
          email,
          password
        }, {
          skipAuth: true,
          headers: { 'Content-Type': 'application/json' }
        });

        const payload = response && response.data ? response.data : response;
        if (!payload?.accessToken) {
          throw new Error('로그인 토큰을 받지 못했습니다.');
        }

        setAuthTokens(payload);
        hideLoginOverlay();
        showToast('로그인되었습니다.', 'success');
        if (window.loadPostList) window.loadPostList();
        if (window.DashboardManager && window.DashboardManager.refresh) {
          window.DashboardManager.refresh();
        }
      } catch (error) {
        clearAuthTokens();
        showToast(error.message || '로그인에 실패했습니다.', 'error');
      }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch((window.location.protocol === 'file:' || window.location.origin === 'null') ? 'http://localhost:8788/api/logout' : '/api/logout', {
            method: 'POST',
            credentials: 'same-origin'
          });
        } catch (error) {
          // Ignore logout response failures and clear local session state.
        }
        clearAuthTokens();
        showLoginOverlay();
      });
    }
  }

  function initModalPreview() {
    const modal = document.getElementById('previewModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const previewBtn = document.getElementById('formPreviewBtn');

    if (closeBtn) {
      closeBtn.onclick = () => {
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      };
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const type = document.getElementById('postType').value;
        const title = document.getElementById('postTitle').value || '(제목 없음)';
        let content = window.PostManager?.getTiptapContent ? window.PostManager.getTiptapContent() : (document.getElementById('postContent').value || '(본문 없음)');

        if (window.marked && typeof window.marked.parse === 'function' && !content.trim().startsWith('<')) {
          content = window.marked.parse(content);
        }

        const modalTypeChip = document.getElementById('modalTypeChip');
        const modalTitle = document.getElementById('modalTitle');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');
        const modalImg = document.getElementById('modalImg');

        if (modalTypeChip) modalTypeChip.textContent = type === 'news' ? '뉴스' : '공지사항';
        if (modalTitle) modalTitle.textContent = title;
        if (modalDate) modalDate.textContent = '방금 전 (미리보기)';
        if (modalContent) modalContent.innerHTML = content;

        const previewImg = document.getElementById('preview-img');
        if (modalImg) {
          if (previewImg && previewImg.src && previewImg.style.display !== 'none' && !previewImg.classList.contains('hidden')) {
            modalImg.src = previewImg.src;
            modalImg.style.display = 'block';
          } else {
            modalImg.src = '';
            modalImg.style.display = 'none';
          }
        }

        if (modal) {
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      });
    }
  }

  function initAdminShell() {
    window.addEventListener('admin:require-login', () => {
      clearAuthTokens();
      showLoginOverlay();
    });

    if (getAccessToken()) {
      hideLoginOverlay();
    } else {
      showLoginOverlay();
    }

    if (window.PostManager && window.PostManager.init) {
      window.PostManager.init();
    }
    if (window.ProgramManager && window.ProgramManager.init) {
      window.ProgramManager.init();
    }
    if (window.OfficialManager && window.OfficialManager.init) {
      window.OfficialManager.init();
    }

    bindStaticActions();
    initLoginFlow();
    initModalPreview();

    switchTab('posts');
    hidePostEditor();

    if (getAccessToken()) {
      if (window.loadPostList) window.loadPostList();
      if (window.DashboardManager && window.DashboardManager.refresh) {
        window.DashboardManager.refresh();
      }
    }

    if (typeof window.initBackToTop === 'function') {
      window.initBackToTop();
    } else {
      let btn = document.getElementById('back-to-top-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'back-to-top-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', '맨 위로 이동');
        btn.className = 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full bg-slate-900/40 text-slate-200 border border-slate-700/50 shadow-xl backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300 hover:bg-slate-800/70 hover:text-white hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>';
        document.body.appendChild(btn);
      }

      const toggleVisibility = () => {
        if (window.scrollY > 300) {
          btn.classList.remove('opacity-0', 'pointer-events-none');
          btn.classList.add('opacity-100', 'pointer-events-auto');
        } else {
          btn.classList.remove('opacity-100', 'pointer-events-auto');
          btn.classList.add('opacity-0', 'pointer-events-none');
        }
      };

      window.addEventListener('scroll', toggleVisibility, { passive: true });
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      toggleVisibility();
    }
  }

  window.AdminApp = {
    getAccessToken,
    getRefreshToken,
    setAuthTokens,
    clearAuthTokens,
    showLoginOverlay,
    hideLoginOverlay,
    switchTab,
    showPostEditor,
    hidePostEditor,
    showProgramEditor,
    hideProgramEditor,
    showToast,
    init: initAdminShell
  };

  window.showPostEditor = showPostEditor;
  window.hidePostEditor = hidePostEditor;
  window.showProgramEditor = showProgramEditor;
  window.hideProgramEditor = hideProgramEditor;
  window.switchTab = switchTab;

  initAdminShell();
})();
