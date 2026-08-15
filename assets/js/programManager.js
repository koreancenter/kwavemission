(function () {
  'use strict';

  const state = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    postVisibleCount: 12,
    programVisibleCount: 12
  });

  function unwrapItems(payload) {
    if (Array.isArray(payload)) return payload;
    return payload && Array.isArray(payload.data) ? payload.data : [];
  }

  function renderProgramList() {
    const tbody = document.getElementById('programTableBody');
    const filteredPrograms = getFilteredPrograms();
    const visiblePrograms = filteredPrograms.slice(0, state.programVisibleCount);
    const meta = document.getElementById('programListMeta');

    meta.textContent = `${filteredPrograms.length}개 항목`;
    const loadMoreBtn = document.getElementById('programLoadMoreBtn');
    loadMoreBtn.disabled = visiblePrograms.length >= filteredPrograms.length;

    if (!filteredPrograms.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">검색 결과가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = visiblePrograms.map((program) => `
      <tr>
        <td>${program.id}</td>
        <td style="font-size:18px;">${program.icon || '🎓'}</td>
        <td><code>${window.AdminUI.escapeHtml(program.slug)}</code></td>
        <td>${window.AdminUI.escapeHtml(program.category)}</td>
        <td><strong>${window.AdminUI.escapeHtml(program.title)}</strong></td>
        <td>${program.status}</td>
        <td>
          <button class="sm secondary" onclick="editProgram(${program.id})">수정</button>
          <button class="sm danger" onclick="deleteProgram(${program.id})">삭제</button>
        </td>
      </tr>
    `).join('');
  }

  function getFilteredPrograms() {
    const searchText = document.getElementById('programSearchInput').value;
    return state.programs.filter((program) => window.AdminUI.matchSearch(program, searchText));
  }

  async function loadProgramList() {
    try {
      const programs = unwrapItems(await window.AdminApi.api.get('/api/get-programs'));
      state.programs = programs;
      state.programVisibleCount = 12;
      renderProgramList();
    } catch (err) {
      document.getElementById('programTableBody').innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">불러오기 실패</td></tr>';
      window.AdminUI.showToast(err.message || '프로그램 목록을 불러오지 못했습니다.', 'error');
    }
  }

  function showProgramEditor() {
    document.getElementById('programListView').classList.remove('active');
    document.getElementById('programEditorView').classList.add('active');
  }

  function hideProgramEditor() {
    document.getElementById('programForm').reset();
    document.getElementById('programId').value = '';
    document.getElementById('programFormTitle').textContent = '새 프로그램 등록';
    document.getElementById('programEditorView').classList.remove('active');
    document.getElementById('programListView').classList.add('active');
  }

  async function editProgram(id) {
    try {
      const programs = unwrapItems(await window.AdminApi.api.get('/api/get-programs'));
      const program = programs.find((item) => Number(item.id) === Number(id));
      if (!program) return;
      document.getElementById('programId').value = program.id;
      document.getElementById('programSlug').value = program.slug || '';
      document.getElementById('programCategory').value = program.category || '';
      document.getElementById('programTitle').value = program.title || '';
      document.getElementById('programIcon').value = program.icon || '🎓';
      document.getElementById('programStatus').value = program.status || 'recruiting';
      document.getElementById('programOrder').value = program.display_order || 0;
      document.getElementById('programDescription').value = program.description || '';
      document.getElementById('programFormTitle').textContent = `프로그램 수정 (ID: #${program.id})`;
      showProgramEditor();
    } catch (err) {
      window.AdminUI.showToast(err.message || '프로그램 정보를 불러오지 못했습니다.', 'error');
    }
  }

  async function deleteProgram(id) {
    if (!confirm(`정말 #${id}번 프로그램을 삭제하시겠습니까?`)) return;
    const formData = new FormData();
    formData.append('id', id);

    try {
      const result = await window.AdminApi.api.post('/api/delete-program', formData, { isFormData: true });
      if (result && result.success) {
        window.AdminUI.showToast('프로그램이 삭제되었습니다.', 'success');
        loadProgramList();
      } else {
        window.AdminUI.showToast(result?.message || result?.error || '삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      window.AdminUI.showToast(err.message || '삭제 처리 중 오류가 발생했습니다.', 'error');
    }
  }

  function bindProgramEvents() {
    const searchInput = document.getElementById('programSearchInput');
    const resetBtn = document.getElementById('programResetBtn');
    const loadMoreBtn = document.getElementById('programLoadMoreBtn');

    searchInput.addEventListener('input', () => {
      state.programVisibleCount = 12;
      renderProgramList();
    });

    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.programVisibleCount = 12;
      renderProgramList();
    });

    loadMoreBtn.addEventListener('click', () => {
      const filteredPrograms = getFilteredPrograms();
      state.programVisibleCount = Math.min(state.programVisibleCount + 12, filteredPrograms.length);
      renderProgramList();
    });

    document.getElementById('programForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isEdit = Boolean(document.getElementById('programId').value);
      const formData = new FormData();

      if (isEdit) formData.append('id', document.getElementById('programId').value);
      formData.append('slug', document.getElementById('programSlug').value);
      formData.append('category', document.getElementById('programCategory').value);
      formData.append('title', document.getElementById('programTitle').value);
      formData.append('status', document.getElementById('programStatus').value);
      formData.append('icon', document.getElementById('programIcon').value);
      formData.append('description', document.getElementById('programDescription').value);
      formData.append('display_order', document.getElementById('programOrder').value);

      try {
        const result = await window.AdminApi.api.post('/api/write-program', formData, { isFormData: true });
        if (result && result.success) {
          window.AdminUI.showToast(isEdit ? '프로그램이 수정되었습니다.' : '프로그램이 등록되었습니다.', 'success');
          hideProgramEditor();
          loadProgramList();
        } else {
          window.AdminUI.showToast(result?.message || result?.error || '프로그램 저장에 실패했습니다.', 'error');
        }
      } catch (err) {
        window.AdminUI.showToast(err.message || '프로그램 저장 중 오류가 발생했습니다.', 'error');
      }
    });
  }

  function initProgramManager() {
    bindProgramEvents();
    if (document.getElementById('programTableBody')) {
      loadProgramList();
    }
  }

  window.ProgramManager = {
    state,
    renderProgramList,
    loadProgramList,
    showProgramEditor,
    hideProgramEditor,
    editProgram,
    deleteProgram,
    init: initProgramManager
  };

  window.showProgramEditor = showProgramEditor;
  window.hideProgramEditor = hideProgramEditor;
  window.editProgram = editProgram;
  window.deleteProgram = deleteProgram;
  window.loadProgramList = loadProgramList;
})();
