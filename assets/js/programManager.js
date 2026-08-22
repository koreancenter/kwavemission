(function () {
  'use strict';

  const state = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    postVisibleCount: 12,
    programVisibleCount: 12,
    currentPostType: 'all',
    currentProgCategory: 'all'
  });

  function unwrapItems(payload) {
    if (Array.isArray(payload)) return payload;
    return payload && Array.isArray(payload.data) ? payload.data : [];
  }

  function stripHtmlTags(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'recruiting': return '<span class="type-chip type-news">모집중</span>';
      case 'ongoing': return '<span class="type-chip type-notice">진행중</span>';
      case 'preparing': return '<span class="type-chip" style="border-color:#cbd5e1; background:#f8fafc; color:#64748b;">준비중</span>';
      default: return `<span class="type-chip">${window.AdminUI.escapeHtml(status || '')}</span>`;
    }
  }

  function previewProgram(id) {
    const program = state.programs.find(p => Number(p.id) === Number(id));
    if (!program) return;

    const modal = document.getElementById('previewModal');
    const modalTypeChip = document.getElementById('modalTypeChip');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalContent = document.getElementById('modalContent');
    const modalImg = document.getElementById('modalImg');

    if (modalTypeChip) {
      modalTypeChip.textContent = program.category || '프로그램';
      modalTypeChip.className = 'type-chip type-news px-2.5 py-0.5 text-xs font-semibold rounded-full';
    }
    if (modalTitle) modalTitle.textContent = `${program.icon || '🎓'} ${program.title || '(제목 없음)'}`;
    if (modalDate) modalDate.textContent = `슬러그: /programs/${program.slug || 'program'}`;

    let htmlContent = program.description || '(설명 내용 없음)';
    const hasHtml = htmlContent.trim().startsWith('<') || /<(?:div|span|table|tbody|thead|tr|th|td|p|h[1-6]|ul|ol|li|section|article|header|footer|style|iframe|svg|!--|img|b|strong|i|em|a)\b/i.test(htmlContent);
    if (!htmlContent.trim().startsWith('<') && !hasHtml && window.marked && typeof window.marked.parse === 'function') {
      htmlContent = window.marked.parse(htmlContent);
    } else if (hasHtml && !htmlContent.trim().startsWith('<') && window.marked && typeof window.marked.parse === 'function') {
      const cleanHtml = htmlContent.replace(/^[ \t]+(?=<|<!--)/gm, '');
      htmlContent = window.marked.parse(cleanHtml);
    }
    if (modalContent) modalContent.innerHTML = htmlContent;

    if (modalImg) {
      modalImg.src = '';
      modalImg.style.display = 'none';
      modalImg.classList.add('hidden');
    }

    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function getSelectedProgramIds() {
    const checkboxes = document.querySelectorAll('.program-select-chk:checked');
    return Array.from(checkboxes).map(chk => Number(chk.dataset.id));
  }

  function updateProgramBatchBar() {
    const selectedIds = getSelectedProgramIds();
    const batchBar = document.getElementById('programBatchBar');
    const countText = document.getElementById('selectedProgramCountText');
    const selectAllChk = document.getElementById('selectAllPrograms');

    if (batchBar) {
      if (selectedIds.length > 0) {
        batchBar.classList.remove('hidden');
        if (countText) countText.textContent = `${selectedIds.length}개 항목 선택됨`;
      } else {
        batchBar.classList.add('hidden');
      }
    }

    if (selectAllChk) {
      const allCheckboxes = document.querySelectorAll('.program-select-chk');
      if (allCheckboxes.length > 0 && selectedIds.length === allCheckboxes.length) {
        selectAllChk.checked = true;
        selectAllChk.indeterminate = false;
      } else if (selectedIds.length > 0) {
        selectAllChk.checked = false;
        selectAllChk.indeterminate = true;
      } else {
        selectAllChk.checked = false;
        selectAllChk.indeterminate = false;
      }
    }
  }

  function renderProgramList() {
    const tbody = document.getElementById('programTableBody');
    const filteredPrograms = getFilteredPrograms();
    const visiblePrograms = filteredPrograms.slice(0, state.programVisibleCount);
    const meta = document.getElementById('programListMeta');

    if (meta) meta.textContent = `${filteredPrograms.length}개 항목`;
    const loadMoreBtn = document.getElementById('programLoadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.disabled = visiblePrograms.length >= filteredPrograms.length;

    if (!filteredPrograms.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400">검색 결과가 없습니다.</td></tr>';
      updateProgramBatchBar();
      return;
    }

    tbody.innerHTML = visiblePrograms.map((program) => {
      const plainExcerpt = stripHtmlTags(program.description || '').substring(0, 80);
      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3 text-center">
            <input type="checkbox" class="program-select-chk w-4 h-4 rounded text-slate-900 focus:ring-slate-800 cursor-pointer" data-id="${program.id}">
          </td>
          <td class="p-3 text-slate-500 font-mono text-xs">${program.id}</td>
          <td class="p-3 text-lg">${program.icon || '🎓'}</td>
          <td class="p-3 font-mono text-xs text-slate-600"><code>${window.AdminUI.escapeHtml(program.slug)}</code></td>
          <td class="p-3"><span class="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">${window.AdminUI.escapeHtml(program.category || 'DEGREE')}</span></td>
          <td class="p-3">
            <div class="flex flex-col">
              <span role="button" tabindex="0" onclick="previewProgram(${program.id})" onkeydown="if(event.key==='Enter'||event.key===' ')previewProgram(${program.id})" class="admin-title-btn text-left font-medium text-slate-800 hover:font-bold hover:text-slate-900 transition-[font-weight] leading-snug text-sm cursor-pointer">${window.AdminUI.escapeHtml(program.title)}</span>
              <span class="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">${window.AdminUI.escapeHtml(plainExcerpt || '설명 없음')}</span>
            </div>
          </td>
          <td class="p-3">${getStatusLabel(program.status)}</td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end">
              <button type="button" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs" onclick="editProgram(${program.id})" title="프로그램 수정">✏️ 수정</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row checkbox listeners
    document.querySelectorAll('.program-select-chk').forEach(chk => {
      chk.addEventListener('change', updateProgramBatchBar);
    });

    updateProgramBatchBar();
  }

  function getFilteredPrograms() {
    const searchInput = document.getElementById('programSearchInput');
    const searchText = searchInput ? searchInput.value : '';

    return state.programs.filter((program) => {
      return window.AdminUI.matchSearch(program, searchText);
    });
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

  let programTiptapInstance = null;

  function initProgramTiptapEditor() {
    const container = document.getElementById('programTiptapEditor');
    if (!container || programTiptapInstance) return;

    if (!window.setupBloggerEditor || !window.TiptapEditor) {
      document.addEventListener('tiptap:ready', initProgramTiptapEditor, { once: true });
      return;
    }

    programTiptapInstance = window.setupBloggerEditor('programTiptapEditor', 'programTiptapToolbar', 'programDescription');
  }

  function hasComplexHtml(html) {
    if (!html || typeof html !== 'string') return false;
    return /<(?:table|thead|tbody|tr|th|td|div|style|section|article|header|footer|iframe|svg|span\s+style|p\s+style|h[1-6]\s+style|!--)/i.test(html);
  }

  function getProgramTiptapContent() {
    const hiddenInput = document.getElementById('programDescription');
    const container = document.getElementById('programTiptapEditor');
    const sourceTextarea = container && container.parentNode ? container.parentNode.querySelector('.blogger-html-source') : null;

    if (sourceTextarea && !sourceTextarea.classList.contains('hidden')) {
      return sourceTextarea.value || '';
    }
    if (hiddenInput && hasComplexHtml(hiddenInput.value)) {
      return hiddenInput.value;
    }
    if (sourceTextarea && hasComplexHtml(sourceTextarea.value)) {
      return sourceTextarea.value;
    }
    if (programTiptapInstance) {
      const html = programTiptapInstance.getHTML();
      if (html && html !== '<p></p>') return html;
    }
    return hiddenInput ? hiddenInput.value || '' : '';
  }

  function setProgramTiptapContent(html) {
    const hiddenInput = document.getElementById('programDescription');
    const container = document.getElementById('programTiptapEditor');
    const sourceTextarea = container && container.parentNode ? container.parentNode.querySelector('.blogger-html-source') : null;
    const safeHtml = html || '';

    if (hiddenInput) hiddenInput.value = safeHtml;
    if (sourceTextarea) sourceTextarea.value = safeHtml;
    if (programTiptapInstance) {
      try {
        programTiptapInstance.commands.setContent(safeHtml);
      } catch (err) {
        console.warn('Tiptap program editor setContent fallback:', err);
      }
    }
  }


  function showProgramEditor() {
    document.getElementById('programListView').classList.remove('active');
    document.getElementById('programEditorView').classList.add('active');
  }

  function hideProgramEditor() {
    document.getElementById('programForm').reset();
    document.getElementById('programId').value = '';
    setProgramTiptapContent('');
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
      setProgramTiptapContent(program.description || '');
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
        if (window.DashboardManager && window.DashboardManager.refresh) {
          window.DashboardManager.refresh();
        }
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
    const selectAllChk = document.getElementById('selectAllPrograms');
    const btnBatchDelete = document.getElementById('btnBatchDeletePrograms');
    const btnDeselectAll = document.getElementById('btnDeselectAllPrograms');

    if (selectAllChk) {
      selectAllChk.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.program-select-chk').forEach(chk => {
          chk.checked = isChecked;
        });
        updateProgramBatchBar();
      });
    }

    if (btnDeselectAll) {
      btnDeselectAll.addEventListener('click', () => {
        document.querySelectorAll('.program-select-chk').forEach(chk => chk.checked = false);
        if (selectAllChk) selectAllChk.checked = false;
        updateProgramBatchBar();
      });
    }

    if (btnBatchDelete) {
      btnBatchDelete.addEventListener('click', async () => {
        const selectedIds = getSelectedProgramIds();
        if (!selectedIds.length) return;

        if (!confirm(`선택한 ${selectedIds.length}개 프로그램을 삭제하시겠습니까?`)) return;

        let successCount = 0;
        for (const id of selectedIds) {
          const formData = new FormData();
          formData.append('id', id);
          try {
            const res = await window.AdminApi.api.post('/api/delete-program', formData, { isFormData: true });
            if (res && res.success) successCount++;
          } catch (e) {
            console.error('Batch delete program error:', e);
          }
        }

        window.AdminUI.showToast(`${successCount}개 프로그램이 삭제되었습니다.`, 'success');
        loadProgramList();
        if (window.DashboardManager && window.DashboardManager.refresh) {
          window.DashboardManager.refresh();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.programVisibleCount = 12;
        renderProgramList();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.programVisibleCount = 12;
        renderProgramList();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const filteredPrograms = getFilteredPrograms();
        state.programVisibleCount = Math.min(state.programVisibleCount + 12, filteredPrograms.length);
        renderProgramList();
      });
    }

    document.getElementById('programForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isEdit = Boolean(document.getElementById('programId').value);

      const slug = (document.getElementById('programSlug').value || '').trim();
      const category = (document.getElementById('programCategory').value || '').trim();
      const title = (document.getElementById('programTitle').value || '').trim();
      const status = document.getElementById('programStatus').value || 'active';
      const icon = (document.getElementById('programIcon').value || '🎓').trim();
      const display_order = document.getElementById('programOrder').value || '0';
      const rawDescription = getProgramTiptapContent();
      const description = (rawDescription === '<p></p>' || !rawDescription) ? '' : rawDescription;

      if (!slug) {
        window.AdminUI.showToast('슬러그(영문)를 입력하세요.', 'warning');
        return;
      }
      if (!category) {
        window.AdminUI.showToast('카테고리를 입력하세요.', 'warning');
        return;
      }
      if (!title) {
        window.AdminUI.showToast('프로그램명을 입력하세요.', 'warning');
        return;
      }

      const formData = new FormData();
      if (isEdit) formData.append('id', document.getElementById('programId').value);
      formData.append('slug', slug);
      formData.append('category', category);
      formData.append('title', title);
      formData.append('status', status);
      formData.append('icon', icon || '🎓');
      formData.append('description', description);
      formData.append('display_order', display_order);

      try {
        const result = await window.AdminApi.api.post('/api/write-program', formData, { isFormData: true });
        if (result && result.success) {
          window.AdminUI.showToast(isEdit ? '프로그램이 수정되었습니다.' : '프로그램이 등록되었습니다.', 'success');
          hideProgramEditor();
          loadProgramList();
          if (window.DashboardManager && window.DashboardManager.refresh) {
            window.DashboardManager.refresh();
          }
        } else {
          window.AdminUI.showToast(result?.message || result?.error || '프로그램 저장에 실패했습니다.', 'error');
        }
      } catch (err) {
        window.AdminUI.showToast(err.message || '프로그램 저장 중 오류가 발생했습니다.', 'error');
      }
    });

  }

  function initProgramManager() {
    initProgramTiptapEditor();
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
    previewProgram,
    getProgramTiptapContent,
    setProgramTiptapContent,
    init: initProgramManager
  };

  window.showProgramEditor = showProgramEditor;
  window.hideProgramEditor = hideProgramEditor;
  window.editProgram = editProgram;
  window.deleteProgram = deleteProgram;
  window.loadProgramList = loadProgramList;
  window.previewProgram = previewProgram;
  window.getProgramTiptapContent = getProgramTiptapContent;
  window.setProgramTiptapContent = setProgramTiptapContent;
})();
