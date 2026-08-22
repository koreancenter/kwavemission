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
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));

    if (tabName === 'posts') {
      const postBtn = document.querySelector('.nav-tab-btn[data-tab="posts"]') || document.querySelectorAll('.nav-tab-btn')[0];
      if (postBtn) postBtn.classList.add('active');
      const tabPosts = document.getElementById('tab-posts');
      if (tabPosts) tabPosts.classList.add('active');
      const listView = document.getElementById('postListView');
      if (listView) listView.classList.add('active');
      if (window.loadPostList) window.loadPostList();
    } else {
      const progBtn = document.querySelector('.nav-tab-btn[data-tab="programs"]') || document.querySelectorAll('.nav-tab-btn')[1];
      if (progBtn) progBtn.classList.add('active');
      const tabProg = document.getElementById('tab-programs');
      if (tabProg) tabProg.classList.add('active');
      const progListView = document.getElementById('programListView');
      if (progListView) progListView.classList.add('active');
      if (window.loadProgramList) window.loadProgramList();
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
    document.querySelectorAll('.nav-tab-btn').forEach((button) => {
      button.addEventListener('click', () => switchTab(button.dataset.tab || 'posts'));
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
        switchTab('posts');
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

    bindStaticActions();
    initLoginFlow();
    initModalPreview();

    if (getAccessToken()) {
      switchTab('posts');
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
        btn.className = 'fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-slate-900/90 text-slate-200 border border-slate-700/60 shadow-xl backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer';
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
