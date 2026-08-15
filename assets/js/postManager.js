(function () {
  'use strict';

  const state = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    postVisibleCount: 12,
    programVisibleCount: 12,
    currentPostType: 'all'
  });

  function renderPostList() {
    const tbody = document.getElementById('postTableBody');
    const filteredPosts = getFilteredPosts();
    const visiblePosts = filteredPosts.slice(0, state.postVisibleCount);
    const meta = document.getElementById('postListMeta');

    meta.textContent = `${filteredPosts.length}개 항목`;
    const loadMoreBtn = document.getElementById('postLoadMoreBtn');
    loadMoreBtn.disabled = visiblePosts.length >= filteredPosts.length;

    if (!filteredPosts.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">검색 결과가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = visiblePosts.map(post => `
      <tr>
        <td>${post.id}</td>
        <td>${post.thumbnail_url ? `<img src="${post.thumbnail_url}" class="list-thumb">` : '-'}</td>
        <td><span class="type-chip ${post.type === 'news' ? 'type-news' : 'type-notice'}">${post.type === 'news' ? '뉴스' : '공지'}</span></td>
        <td><strong>${window.AdminUI.escapeHtml(post.title)}</strong></td>
        <td>${post.created_at ? post.created_at.substring(0, 10) : '-'}</td>
        <td>
          <button class="sm outline" onclick="editPost(${post.id})">수정/편집</button>
          <button class="sm danger" onclick="deletePost(${post.id})">삭제</button>
        </td>
      </tr>
    `).join('');
  }

  function getFilteredPosts() {
    const searchText = document.getElementById('postSearchInput').value;
    return state.posts.filter((post) => {
      const typeMatches = state.currentPostType === 'all' || post.type === state.currentPostType;
      return typeMatches && window.AdminUI.matchSearch(post, searchText);
    });
  }

  async function loadPostList() {
    try {
      const posts = await window.AdminApi.api.get('/api/get-posts?type=all');
      state.posts = Array.isArray(posts) ? posts : [];
      state.postVisibleCount = 12;
      renderPostList();
    } catch (err) {
      document.getElementById('postTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">불러오기 오류 발생</td></tr>';
      window.AdminUI.showToast(err.message || '게시글을 불러오지 못했습니다.', 'error');
    }
  }

  async function editPost(id) {
    try {
      const post = await window.AdminApi.api.get(`/api/get-posts?id=${id}`);
      if (post && post.id) {
        document.getElementById('postId').value = post.id;
        document.getElementById('postType').value = post.type || 'news';
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postFormTitle').textContent = `글 수정 (ID: #${post.id})`;
        window.showPostEditor();
      }
    } catch (err) {
      window.AdminUI.showToast(err.message || '글 정보를 불러올 수 없습니다.', 'error');
    }
  }

  async function deletePost(id) {
    if (!confirm(`정말 #${id}번 글을 삭제하시겠습니까?`)) return;

    const formData = new FormData();
    formData.append('id', id);

    try {
      const result = await window.AdminApi.api.post('/api/delete-post', formData, { isFormData: true });
      if (result && result.success) {
        window.AdminUI.showToast('삭제되었습니다.', 'success');
        loadPostList();
      } else {
        window.AdminUI.showToast(result?.message || result?.error || '비밀번호를 확인하세요.', 'error');
      }
    } catch (err) {
      window.AdminUI.showToast(err.message || '통신 오류', 'error');
    }
  }

  function bindPostEvents() {
    const searchInput = document.getElementById('postSearchInput');
    const resetBtn = document.getElementById('postResetBtn');
    const loadMoreBtn = document.getElementById('postLoadMoreBtn');

    searchInput.addEventListener('input', () => {
      state.postVisibleCount = 12;
      renderPostList();
    });

    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.postVisibleCount = 12;
      renderPostList();
    });

    loadMoreBtn.addEventListener('click', () => {
      const filteredPosts = getFilteredPosts();
      state.postVisibleCount = Math.min(state.postVisibleCount + 12, filteredPosts.length);
      renderPostList();
    });

    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.toggle('active', btn === button));
        state.currentPostType = button.dataset.type || 'all';
        state.postVisibleCount = 12;
        renderPostList();
      });
    });

    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isEdit = Boolean(document.getElementById('postId').value);
      const endpoint = isEdit ? '/api/update-post' : '/api/write-post';

      const formData = new FormData();
      if (isEdit) formData.append('id', document.getElementById('postId').value);
      formData.append('type', document.getElementById('postType').value);
      formData.append('title', document.getElementById('postTitle').value);
      formData.append('content', document.getElementById('postContent').value);

      const file = document.getElementById('postImage').files[0];
      if (file) formData.append('image', file);

      try {
        const result = await window.AdminApi.api.post(endpoint, formData, { isFormData: true });
        if (result && result.success) {
          window.AdminUI.showToast(isEdit ? '수정되었습니다!' : '등록되었습니다!', 'success');
          window.hidePostEditor();
          loadPostList();
        } else {
          window.AdminUI.showToast(result?.message || result?.error || '저장 중 오류가 발생했습니다.', 'error');
        }
      } catch (err) {
        window.AdminUI.showToast(err.message || '통신 실패', 'error');
      }
    });
  }

  function initPostManager() {
    bindPostEvents();
    if (document.getElementById('postTableBody')) {
      loadPostList();
    }
  }

  window.PostManager = {
    state,
    renderPostList,
    loadPostList,
    editPost,
    deletePost,
    init: initPostManager
  };

  window.loadPostList = loadPostList;
  window.editPost = editPost;
  window.deletePost = deletePost;
})();
