(function () {
  'use strict';

  const state = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    postVisibleCount: 12,
    programVisibleCount: 12,
    currentPostType: 'all'
  });

  let tiptapInstance = null;

  function hasComplexHtml(html) {
    if (!html || typeof html !== 'string') return false;
    return /<(?:table|thead|tbody|tr|th|td|div|style|section|article|header|footer|iframe|svg|span\s+style|p\s+style|h[1-6]\s+style|!--)/i.test(html);
  }

  function setupBloggerEditor(containerId, toolbarId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const toolbar = document.getElementById(toolbarId);
    if (!container) return null;

    // Create HTML source textarea alongside editor container if not exists
    let sourceTextarea = container.parentNode.querySelector('.blogger-html-source');
    if (!sourceTextarea) {
      sourceTextarea = document.createElement('textarea');
      sourceTextarea.className = 'blogger-html-source hidden w-full min-h-[360px] p-4 font-mono text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-slate-800 resize-y leading-relaxed';
      sourceTextarea.placeholder = '여기에 HTML 코드를 직접 입력하거나 수정하세요 (예: <h2>제목</h2><div style="...">...</div>)...';
      container.parentNode.insertBefore(sourceTextarea, container.nextSibling);

      sourceTextarea.addEventListener('input', () => {
        if (hiddenInput) hiddenInput.value = sourceTextarea.value;
      });
      sourceTextarea.addEventListener('change', () => {
        if (hiddenInput) hiddenInput.value = sourceTextarea.value;
      });
    }

    const initialContent = hiddenInput ? (hiddenInput.value || '') : '';
    if (sourceTextarea) {
      sourceTextarea.value = initialContent;
    }

    const extensions = [window.TiptapStarterKit];
    if (window.TiptapLink) extensions.push(window.TiptapLink.configure({ openOnClick: false }));
    if (window.TiptapImage) extensions.push(window.TiptapImage);
    if (window.TiptapUnderline) extensions.push(window.TiptapUnderline);

    let editor = null;
    let isHandlingHtmlSync = false;

    try {
      editor = new window.TiptapEditor({
        element: container,
        extensions,
        content: initialContent,
        editorProps: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain') || '';
            if (text && /<[a-z][\s\S]*>/i.test(text.trim())) {
              // Pasted HTML code
              if (hasComplexHtml(text)) {
                // For rich/complex HTML, update source and hidden input
                if (hiddenInput) hiddenInput.value = text.trim();
                if (sourceTextarea) sourceTextarea.value = text.trim();
                if (editor) {
                  try {
                    editor.commands.setContent(text.trim());
                  } catch (e) {
                    console.warn('Tiptap setContent fallback for complex HTML:', e);
                  }
                }
                return true;
              } else {
                event.preventDefault();
                editor.commands.insertContent(text.trim());
                return true;
              }
            }
            return false;
          }
        },
        onUpdate: ({ editor: ed }) => {
          if (isHandlingHtmlSync) return;
          const currentHtml = ed.getHTML();
          const sourceActive = sourceTextarea && !sourceTextarea.classList.contains('hidden');

          if (!sourceActive) {
            // In visual mode, update hidden input and source textarea if not complex HTML preserved
            if (!hasComplexHtml(sourceTextarea.value) || currentHtml.length >= sourceTextarea.value.length * 0.7) {
              if (hiddenInput) hiddenInput.value = currentHtml;
              if (sourceTextarea) sourceTextarea.value = currentHtml;
            }
          }
          updateActiveButtons(ed, toolbar);
        },
        onSelectionUpdate: ({ editor: ed }) => {
          updateActiveButtons(ed, toolbar);
        }
      });
    } catch (err) {
      console.warn('Error initializing Tiptap editor:', err);
    }

    if (toolbar) {
      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cmd]');
        if (!btn) return;
        e.preventDefault();

        const cmd = btn.getAttribute('data-cmd');
        executeEditorCommand(editor, cmd, container, sourceTextarea, hiddenInput, toolbar);
        if (editor) updateActiveButtons(editor, toolbar);
      });

      const headingSelect = toolbar.querySelector('select[data-cmd="headingSelect"]');
      if (headingSelect && editor) {
        headingSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
          else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
          else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
        });
      }
    }

    return editor;
  }

  function executeEditorCommand(editor, cmd, container, sourceTextarea, hiddenInput, toolbar) {
    switch (cmd) {
      case 'toggleHtmlView': {
        if (!container || !sourceTextarea) return;
        const isSourceActive = !sourceTextarea.classList.contains('hidden');
        const toggleBtn = toolbar ? toolbar.querySelectorAll('[data-cmd="toggleHtmlView"]') : document.querySelectorAll('[data-cmd="toggleHtmlView"]');

        if (isSourceActive) {
          // Switch from HTML Source -> Visual WYSIWYG
          const htmlCode = sourceTextarea.value || '';
          if (hiddenInput) hiddenInput.value = htmlCode;

          if (editor) {
            try {
              editor.commands.setContent(htmlCode);
            } catch (err) {
              console.warn('Failed to parse complex HTML into Tiptap visual model:', err);
            }
          }

          sourceTextarea.classList.add('hidden');
          container.classList.remove('hidden');

          toggleBtn.forEach(btn => {
            btn.innerHTML = '&lt;/&gt;';
            btn.title = 'HTML 소스 코드 보기';
            btn.classList.remove('bg-slate-800', 'text-white');
            btn.classList.add('bg-slate-100', 'text-slate-800');
          });
        } else {
          // Switch from Visual WYSIWYG -> HTML Source
          let currentContent = hiddenInput ? (hiddenInput.value || '') : '';
          if (editor && !hasComplexHtml(currentContent)) {
            currentContent = editor.getHTML();
          }
          if (sourceTextarea) sourceTextarea.value = currentContent;
          if (hiddenInput) hiddenInput.value = currentContent;

          container.classList.add('hidden');
          sourceTextarea.classList.remove('hidden');
          sourceTextarea.focus();

          toggleBtn.forEach(btn => {
            btn.innerHTML = '👁️';
            btn.title = '시각적 편집 모드로 전환';
            btn.classList.remove('bg-slate-100', 'text-slate-800');
            btn.classList.add('bg-slate-800', 'text-white');
          });
        }
        return;
      }
    }

    if (!editor) return;
    switch (cmd) {
      case 'undo': editor.chain().focus().undo().run(); break;
      case 'redo': editor.chain().focus().redo().run(); break;
      case 'bold': editor.chain().focus().toggleBold().run(); break;
      case 'italic': editor.chain().focus().toggleItalic().run(); break;
      case 'underline': if (editor.commands.toggleUnderline) editor.chain().focus().toggleUnderline().run(); break;
      case 'strike': editor.chain().focus().toggleStrike().run(); break;
      case 'code': editor.chain().focus().toggleCode().run(); break;
      case 'link': {
        const currentUrl = editor.getAttributes('link').href || '';
        const url = prompt('링크 URL을 입력하세요 (예: https://example.com):', currentUrl || 'https://');
        if (url === null) return;
        if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        break;
      }
      case 'image': {
        const url = prompt('이미지 URL을 입력하세요:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
        break;
      }
      case 'hr': editor.chain().focus().setHorizontalRule().run(); break;
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break;
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break;
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break;
      case 'clear': editor.chain().focus().unsetAllMarks().clearNodes().run(); break;
    }
  }


  function updateActiveButtons(editor, toolbar) {
    if (!editor || !toolbar) return;

    const btnMap = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      strike: 'strike',
      code: 'code',
      bulletList: 'bulletList',
      orderedList: 'orderedList',
      blockquote: 'blockquote',
      codeBlock: 'codeBlock'
    };

    Object.keys(btnMap).forEach(cmd => {
      const btn = toolbar.querySelector(`button[data-cmd="${cmd}"]`);
      if (btn) {
        if (editor.isActive(btnMap[cmd])) {
          btn.classList.add('is-active');
          btn.setAttribute('data-active', 'true');
        } else {
          btn.classList.remove('is-active');
          btn.removeAttribute('data-active');
        }
      }
    });

    const headingSelect = toolbar.querySelector('select[data-cmd="headingSelect"]');
    if (headingSelect) {
      if (editor.isActive('heading', { level: 1 })) headingSelect.value = 'h1';
      else if (editor.isActive('heading', { level: 2 })) headingSelect.value = 'h2';
      else if (editor.isActive('heading', { level: 3 })) headingSelect.value = 'h3';
      else headingSelect.value = 'p';
    }
  }

  function initTiptapEditor() {
    const container = document.getElementById('postTiptapEditor');
    if (!container || tiptapInstance) return;

    if (!window.TiptapEditor || !window.TiptapStarterKit) {
      document.addEventListener('tiptap:ready', initTiptapEditor, { once: true });
      return;
    }

    tiptapInstance = setupBloggerEditor('postTiptapEditor', 'postTiptapToolbar', 'postContent');
  }

  function getTiptapContent() {
    const hiddenInput = document.getElementById('postContent');
    const container = document.getElementById('postTiptapEditor');
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
    if (tiptapInstance) {
      const html = tiptapInstance.getHTML();
      if (html && html !== '<p></p>') return html;
    }
    return hiddenInput ? hiddenInput.value || '' : '';
  }

  function setTiptapContent(html) {
    const hiddenInput = document.getElementById('postContent');
    const container = document.getElementById('postTiptapEditor');
    const sourceTextarea = container && container.parentNode ? container.parentNode.querySelector('.blogger-html-source') : null;
    const safeHtml = html || '';

    if (hiddenInput) hiddenInput.value = safeHtml;
    if (sourceTextarea) sourceTextarea.value = safeHtml;
    if (tiptapInstance) {
      try {
        tiptapInstance.commands.setContent(safeHtml);
      } catch (err) {
        console.warn('Tiptap setContent fallback:', err);
      }
    }
  }


  function clearTiptapContent() {
    setTiptapContent('');
  }

  function stripHtmlTags(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  async function previewPost(id) {
    let post = state.posts.find(p => Number(p.id) === Number(id));
    if (!post || !post.content) {
      try {
        const fetched = await window.AdminApi.api.get(`/api/get-posts?id=${id}`);
        if (fetched && fetched.id) {
          post = fetched;
          // Update in local state as well
          const idx = state.posts.findIndex(p => Number(p.id) === Number(id));
          if (idx !== -1) {
            state.posts[idx] = { ...state.posts[idx], ...fetched };
          }
        }
      } catch (err) {
        console.warn('Failed to fetch full post for preview:', err);
      }
    }
    if (!post) return;

    const modal = document.getElementById('previewModal');
    const modalTypeChip = document.getElementById('modalTypeChip');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalContent = document.getElementById('modalContent');
    const modalImg = document.getElementById('modalImg');

    if (modalTypeChip) {
      modalTypeChip.textContent = post.type === 'news' ? '뉴스' : '공지사항';
      modalTypeChip.className = `type-chip ${post.type === 'news' ? 'type-news' : 'type-notice'} px-2.5 py-0.5 text-xs font-semibold rounded-full`;
    }
    if (modalTitle) modalTitle.textContent = post.title || '(제목 없음)';
    if (modalDate) modalDate.textContent = post.created_at ? post.created_at.substring(0, 10) : '방금 전';

    let htmlContent = post.content || '(본문 내용 없음)';
    const hasHtml = htmlContent.trim().startsWith('<') || /<(?:div|span|table|tbody|thead|tr|th|td|p|h[1-6]|ul|ol|li|section|article|header|footer|style|iframe|svg|!--|img|b|strong|i|em|a)\b/i.test(htmlContent);
    if (!htmlContent.trim().startsWith('<') && !hasHtml && window.marked && typeof window.marked.parse === 'function') {
      htmlContent = window.marked.parse(htmlContent);
    } else if (hasHtml && !htmlContent.trim().startsWith('<') && window.marked && typeof window.marked.parse === 'function') {
      const cleanHtml = htmlContent.replace(/^[ \t]+(?=<|<!--)/gm, '');
      htmlContent = window.marked.parse(cleanHtml);
    }
    if (modalContent) modalContent.innerHTML = htmlContent;

    if (modalImg) {
      if (post.thumbnail_url) {
        modalImg.src = post.thumbnail_url;
        modalImg.style.display = 'block';
        modalImg.classList.remove('hidden');
      } else {
        modalImg.src = '';
        modalImg.style.display = 'none';
        modalImg.classList.add('hidden');
      }
    }

    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function getSelectedPostIds() {
    const checkboxes = document.querySelectorAll('.post-select-chk:checked');
    return Array.from(checkboxes).map(chk => Number(chk.dataset.id));
  }

  function updateBatchBar() {
    const selectedIds = getSelectedPostIds();
    const batchBar = document.getElementById('postBatchBar');
    const countText = document.getElementById('selectedPostCountText');
    const selectAllChk = document.getElementById('selectAllPosts');

    if (batchBar) {
      if (selectedIds.length > 0) {
        batchBar.classList.remove('hidden');
        if (countText) countText.textContent = `${selectedIds.length}개 항목 선택됨`;
      } else {
        batchBar.classList.add('hidden');
      }
    }

    if (selectAllChk) {
      const allCheckboxes = document.querySelectorAll('.post-select-chk');
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

  function renderPostList() {
    const tbody = document.getElementById('postTableBody');
    const filteredPosts = getFilteredPosts();
    const visiblePosts = filteredPosts.slice(0, state.postVisibleCount);
    const meta = document.getElementById('postListMeta');

    if (meta) meta.textContent = `${filteredPosts.length}개 항목`;
    const loadMoreBtn = document.getElementById('postLoadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.disabled = visiblePosts.length >= filteredPosts.length;

    if (!filteredPosts.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">검색 결과가 없습니다.</td></tr>';
      updateBatchBar();
      return;
    }

    tbody.innerHTML = visiblePosts.map(post => {
      const plainExcerpt = stripHtmlTags(post.content || '').substring(0, 80);
      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-3 text-center">
            <input type="checkbox" class="post-select-chk w-4 h-4 rounded text-slate-900 focus:ring-slate-800 cursor-pointer" data-id="${post.id}">
          </td>
          <td class="p-3 text-slate-500 font-mono text-xs">${post.id}</td>
          <td class="p-3">${post.thumbnail_url ? `<img src="${post.thumbnail_url}" class="w-10 h-10 object-cover rounded-lg border border-slate-200">` : '<div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">📷</div>'}</td>
          <td class="p-3"><span class="type-chip ${post.type === 'news' ? 'type-news' : 'type-notice'}">${post.type === 'news' ? '뉴스' : '공지'}</span></td>
          <td class="p-3">
            <div class="flex flex-col">
              <button type="button" onclick="previewPost(${post.id})" class="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors leading-snug text-sm cursor-pointer p-0 bg-transparent border-0">${window.AdminUI.escapeHtml(post.title)}</button>
              <span class="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">${window.AdminUI.escapeHtml(plainExcerpt || '내용 없음')}</span>
            </div>
          </td>
          <td class="p-3 text-xs text-slate-500 font-medium">${post.created_at ? post.created_at.substring(0, 10) : '-'}</td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end">
              <button type="button" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs" onclick="editPost(${post.id})" title="글 수정">✏️ 수정</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row checkbox event listeners
    document.querySelectorAll('.post-select-chk').forEach(chk => {
      chk.addEventListener('change', updateBatchBar);
    });

    updateBatchBar();
  }

  function getFilteredPosts() {
    const searchInput = document.getElementById('postSearchInput');
    const searchText = searchInput ? searchInput.value : '';
    return state.posts.filter((post) => {
      const typeMatches = state.currentPostType === 'all' || post.type === state.currentPostType;
      return typeMatches && window.AdminUI.matchSearch(post, searchText);
    });
  }

  async function loadPostList() {
    try {
      const posts = unwrapItems(await window.AdminApi.api.get('/api/get-posts?type=all'));
      state.posts = posts;
      state.postVisibleCount = 12;
      renderPostList();
    } catch (err) {
      document.getElementById('postTableBody').innerHTML = '<tr><td colspan="7" class="p-6 text-center text-red-500">불러오기 오류 발생</td></tr>';
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
        setTiptapContent(post.content || '');

        const previewImg = document.getElementById('preview-img');
        if (previewImg) {
          if (post.thumbnail_url) {
            previewImg.src = post.thumbnail_url;
            previewImg.style.display = 'block';
            previewImg.classList.remove('hidden');
          } else {
            previewImg.src = '';
            previewImg.style.display = 'none';
            previewImg.classList.add('hidden');
          }
        }

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
        if (window.DashboardManager && window.DashboardManager.refresh) {
          window.DashboardManager.refresh();
        }
      } else {
        window.AdminUI.showToast(result?.message || result?.error || '삭제 중 오류가 발생했습니다.', 'error');
      }
    } catch (err) {
      window.AdminUI.showToast(err.message || '통신 오류', 'error');
    }
  }

  function bindPostEvents() {
    const searchInput = document.getElementById('postSearchInput');
    const resetBtn = document.getElementById('postResetBtn');
    const loadMoreBtn = document.getElementById('postLoadMoreBtn');
    const fileInput = document.getElementById('postImage');
    const previewImg = document.getElementById('preview-img');
    const selectAllChk = document.getElementById('selectAllPosts');
    const btnBatchDelete = document.getElementById('btnBatchDeletePosts');
    const btnBatchNews = document.getElementById('btnBatchChangeTypeNews');
    const btnBatchNotice = document.getElementById('btnBatchChangeTypeNotice');
    const btnDeselectAll = document.getElementById('btnDeselectAllPosts');

    if (selectAllChk) {
      selectAllChk.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.post-select-chk').forEach(chk => {
          chk.checked = isChecked;
        });
        updateBatchBar();
      });
    }

    if (btnDeselectAll) {
      btnDeselectAll.addEventListener('click', () => {
        document.querySelectorAll('.post-select-chk').forEach(chk => chk.checked = false);
        if (selectAllChk) selectAllChk.checked = false;
        updateBatchBar();
      });
    }

    if (btnBatchDelete) {
      btnBatchDelete.addEventListener('click', async () => {
        const selectedIds = getSelectedPostIds();
        if (!selectedIds.length) return;

        if (!confirm(`선택한 ${selectedIds.length}개 게시글을 삭제하시겠습니까?`)) return;

        let successCount = 0;
        for (const id of selectedIds) {
          const formData = new FormData();
          formData.append('id', id);
          try {
            const res = await window.AdminApi.api.post('/api/delete-post', formData, { isFormData: true });
            if (res && res.success) successCount++;
          } catch (e) {
            console.error('Batch delete item error:', e);
          }
        }

        window.AdminUI.showToast(`${successCount}개 게시글이 삭제되었습니다.`, 'success');
        loadPostList();
        if (window.DashboardManager && window.DashboardManager.refresh) {
          window.DashboardManager.refresh();
        }
      });
    }

    const batchChangeType = async (newType) => {
      const selectedIds = getSelectedPostIds();
      if (!selectedIds.length) return;

      const typeName = newType === 'news' ? '뉴스' : '공지사항';
      if (!confirm(`선택한 ${selectedIds.length}개 게시글의 분류를 '${typeName}'(으)로 변경하시겠습니까?`)) return;

      let successCount = 0;
      for (const id of selectedIds) {
        const post = state.posts.find(p => Number(p.id) === Number(id));
        if (!post) continue;

        const formData = new FormData();
        formData.append('id', id);
        formData.append('type', newType);
        formData.append('title', post.title);
        formData.append('content', post.content || '');

        try {
          const res = await window.AdminApi.api.post('/api/update-post', formData, { isFormData: true });
          if (res && res.success) successCount++;
        } catch (e) {
          console.error('Batch type change error:', e);
        }
      }

      window.AdminUI.showToast(`${successCount}개 게시글이 '${typeName}'(으)로 변경되었습니다.`, 'success');
      loadPostList();
    };

    if (btnBatchNews) {
      btnBatchNews.addEventListener('click', () => batchChangeType('news'));
    }

    if (btnBatchNotice) {
      btnBatchNotice.addEventListener('click', () => batchChangeType('notice'));
    }

    if (fileInput && previewImg) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            previewImg.src = evt.target.result;
            previewImg.style.display = 'block';
            previewImg.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.postVisibleCount = 12;
        renderPostList();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.postVisibleCount = 12;
        renderPostList();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const filteredPosts = getFilteredPosts();
        state.postVisibleCount = Math.min(state.postVisibleCount + 12, filteredPosts.length);
        renderPostList();
      });
    }

    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle('active', isActive);
          if (isActive) {
            btn.className = 'filter-btn active px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-2xs border border-slate-900 transition-all cursor-pointer';
          } else {
            btn.className = 'filter-btn px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer';
          }
        });
        state.currentPostType = button.dataset.type || 'all';
        state.postVisibleCount = 12;
        renderPostList();
      });
    });

    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const isEdit = Boolean(document.getElementById('postId').value);
      const endpoint = isEdit ? '/api/update-post' : '/api/write-post';

      const title = document.getElementById('postTitle').value.trim();
      const content = getTiptapContent();

      if (!title) {
        window.AdminUI.showToast('제목을 입력하세요.', 'warning');
        return;
      }
      if (!content || content === '<p></p>') {
        window.AdminUI.showToast('본문 내용을 입력하세요.', 'warning');
        return;
      }

      const formData = new FormData();
      if (isEdit) formData.append('id', document.getElementById('postId').value);
      formData.append('type', document.getElementById('postType').value);
      formData.append('title', title);
      formData.append('content', content);

      const file = document.getElementById('postImage').files[0];
      if (file) formData.append('image', file);

      try {
        const result = await window.AdminApi.api.post(endpoint, formData, { isFormData: true });
        if (result && result.success) {
          window.AdminUI.showToast(isEdit ? '수정되었습니다!' : '등록되었습니다!', 'success');
          window.hidePostEditor();
          loadPostList();
          if (window.DashboardManager && window.DashboardManager.refresh) {
            window.DashboardManager.refresh();
          }
        } else {
          window.AdminUI.showToast(result?.message || result?.error || '저장 중 오류가 발생했습니다.', 'error');
        }
      } catch (err) {
        window.AdminUI.showToast(err.message || '통신 실패', 'error');
      }
    });
  }

  function initPostManager() {
    initTiptapEditor();
    bindPostEvents();
    if (document.getElementById('postTableBody')) {
      loadPostList();
    }
  }

  window.setupBloggerEditor = setupBloggerEditor;

  window.PostManager = {
    state,
    renderPostList,
    loadPostList,
    editPost,
    deletePost,
    previewPost,
    getTiptapContent,
    setTiptapContent,
    clearTiptapContent,
    setupBloggerEditor,
    init: initPostManager
  };

  window.loadPostList = loadPostList;
  window.editPost = editPost;
  window.deletePost = deletePost;
  window.previewPost = previewPost;
})();
