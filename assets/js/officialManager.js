(function () {
  'use strict';

  const state = window.AdminState || (window.AdminState = {
    posts: [],
    programs: [],
    officialLetters: [],
    postVisibleCount: 12,
    programVisibleCount: 12,
    officialVisibleCount: 15,
    currentPostType: 'all'
  });

  let officialTiptapInstance = null;

  function hasComplexHtml(html) {
    if (!html || typeof html !== 'string') return false;
    return /<(?:table|thead|tbody|tr|th|td|div|style|section|article|header|footer|iframe|svg|span\s+style|p\s+style|h[1-6]\s+style|!--)/i.test(html);
  }

  function setupBloggerEditor(containerId, toolbarId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const toolbar = document.getElementById(toolbarId);
    if (!container) return null;

    let sourceTextarea = container.parentNode.querySelector('.blogger-html-source');
    if (!sourceTextarea) {
      sourceTextarea = document.createElement('textarea');
      sourceTextarea.className = 'blogger-html-source hidden w-full min-h-[300px] p-4 font-mono text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-slate-800 resize-y leading-relaxed';
      sourceTextarea.placeholder = '여기에 공문 HTML 서식을 직접 입력하거나 수정하세요...';
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

    try {
      editor = new window.TiptapEditor({
        element: container,
        extensions,
        content: initialContent,
        onUpdate({ editor: currentEditor }) {
          const html = currentEditor.getHTML();
          if (hiddenInput) hiddenInput.value = html;
          if (sourceTextarea && sourceTextarea.classList.contains('hidden')) {
            sourceTextarea.value = html;
          }
        }
      });
    } catch (e) {
      console.warn('Tiptap initialization error in official editor:', e);
      if (sourceTextarea) {
        sourceTextarea.classList.remove('hidden');
        if (container) container.classList.add('hidden');
      }
    }

    if (toolbar) {
      toolbar.querySelectorAll('button[data-cmd]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cmd = btn.getAttribute('data-cmd');

          if (cmd === 'toggleHtmlView') {
            if (sourceTextarea && container) {
              const isHtmlMode = !sourceTextarea.classList.contains('hidden');
              if (isHtmlMode) {
                const updatedHtml = sourceTextarea.value || '';
                if (hiddenInput) hiddenInput.value = updatedHtml;
                if (editor) {
                  try { editor.commands.setContent(updatedHtml); } catch (_) {}
                }
                sourceTextarea.classList.add('hidden');
                container.classList.remove('hidden');
                btn.classList.remove('bg-slate-900', 'text-white');
                btn.classList.add('bg-slate-100', 'text-slate-800');
              } else {
                const currentHtml = editor ? editor.getHTML() : (hiddenInput ? hiddenInput.value : '');
                sourceTextarea.value = currentHtml;
                if (hiddenInput) hiddenInput.value = currentHtml;
                container.classList.add('hidden');
                sourceTextarea.classList.remove('hidden');
                btn.classList.remove('bg-slate-100', 'text-slate-800');
                btn.classList.add('bg-slate-900', 'text-white');
                sourceTextarea.focus();
              }
            }
            return;
          }

          if (!editor) return;

          switch (cmd) {
            case 'bold': editor.chain().focus().toggleBold().run(); break;
            case 'italic': editor.chain().focus().toggleItalic().run(); break;
            case 'underline': if (editor.commands.toggleUnderline) editor.chain().focus().toggleUnderline().run(); break;
            case 'strike': editor.chain().focus().toggleStrike().run(); break;
            case 'code': editor.chain().focus().toggleCode().run(); break;
            case 'bulletList': editor.chain().focus().toggleBulletList().run(); break;
            case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break;
            case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break;
            case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break;
            case 'hr': editor.chain().focus().setHorizontalRule().run(); break;
            case 'undo': editor.chain().focus().undo().run(); break;
            case 'redo': editor.chain().focus().redo().run(); break;
            case 'link': {
              const url = prompt('링크 URL을 입력하세요:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
              break;
            }
            case 'image': {
              const imgUrl = prompt('이미지 URL을 입력하세요:');
              if (imgUrl) editor.chain().focus().setImage({ src: imgUrl }).run();
              break;
            }
            case 'clear': editor.chain().focus().unsetAllMarks().clearNodes().run(); break;
          }
        });
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

  function generateRecommendedDocNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomSeq = String(Math.floor(Math.random() * 90) + 10);
    return `KWM-${year}-${month}${day}-${randomSeq}호`;
  }

  function getOfficialShareUrl(token) {
    const origin = window.location.origin;
    return `${origin}/official.html?token=${encodeURIComponent(token)}`;
  }

  async function copyToClipboard(text, successMessage = '클립보드에 복사되었습니다.') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      if (window.AdminApi && window.AdminApi.toast) {
        window.AdminApi.toast.show(successMessage, 'success');
      } else {
        alert(successMessage);
      }
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      if (window.AdminApi && window.AdminApi.toast) {
        window.AdminApi.toast.show('링크 복사에 실패했습니다. 수동으로 복사해 주세요.', 'error');
      }
      return false;
    }
  }

  function renderOfficialTable(letters = []) {
    const tbody = document.getElementById('officialTableBody');
    const meta = document.getElementById('officialListMeta');
    if (!tbody) return;

    if (!letters || letters.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-2xl">📄</span>
              <span class="font-medium text-sm">등록된 발송 공문이 없습니다.</span>
              <span class="text-xs text-slate-400">'새 공문 작성' 버튼을 눌러 보안 공문을 생성해 보세요.</span>
            </div>
          </td>
        </tr>
      `;
      if (meta) meta.textContent = '총 0개 항목';
      return;
    }

    const html = letters.map((letter) => {
      const shareUrl = getOfficialShareUrl(letter.secret_token);
      const createdAt = letter.created_at ? letter.created_at.slice(0, 10) : '-';
      const safeTitle = (letter.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeReceiver = (letter.receiver || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeDocNo = (letter.doc_no || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeSender = (letter.sender || '케이웨이브 미션 대표선교사').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 group" data-id="${letter.id}" data-token="${letter.secret_token}">
          <td class="p-3.5 text-xs text-slate-400 font-mono text-center">${letter.id}</td>
          <td class="p-3.5 text-xs font-bold text-slate-900 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono border border-slate-200">${safeDocNo}</span>
          </td>
          <td class="p-3.5 text-xs text-slate-700 font-medium max-w-[150px] truncate" title="${safeReceiver}">
            ${safeReceiver}
          </td>
          <td class="p-3.5">
            <div class="font-bold text-slate-900 text-sm hover:text-slate-700 cursor-pointer line-clamp-1 btn-view-letter" title="${safeTitle}">
              ${safeTitle}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>발신: ${safeSender}</span>
              <span>•</span>
              <span class="font-mono text-emerald-600">🔒 보안 난수 링크 발급됨</span>
            </div>
          </td>
          <td class="p-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">${createdAt}</td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button type="button" class="btn-copy-official-link px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer" data-token="${letter.secret_token}" data-url="${shareUrl}" title="비공개 열람 링크 복사">
                <span>🔗</span> 링크 복사
              </button>
              <button type="button" class="btn-edit-official px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer" data-id="${letter.id}" title="공문 내용 수정">
                <span>✏️</span> 수정
              </button>
              <button type="button" class="btn-delete-official p-1.5 text-xs rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer" data-id="${letter.id}" title="공문 삭제">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
    if (meta) meta.textContent = `총 ${letters.length}개 항목`;
  }

  async function loadOfficialList() {
    const tbody = document.getElementById('officialTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">발송 공문 목록을 불러오는 중...</td></tr>';
    }

    try {
      if (!window.AdminApi || !window.AdminApi.api) return;
      const res = await window.AdminApi.api.get('/api/official');
      const list = Array.isArray(res) ? res : (res?.data || []);
      state.officialLetters = list;
      renderOfficialTable(list);
    } catch (err) {
      console.error('Failed to load official letters:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-rose-500">목록을 불러오지 못했습니다: ${err.message || '오류 발생'}</td></tr>`;
      }
    }
  }

  function showOfficialEditor() {
    const editIdInput = document.getElementById('officialEditId');
    if (editIdInput) editIdInput.value = '';

    const formTitle = document.getElementById('officialFormTitle');
    if (formTitle) formTitle.textContent = '새 공문 작성 (비공개 보안 발송)';

    const submitBtn = document.getElementById('officialSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<span>📄</span> 공문 생성 및 보안 링크 발급';

    const listView = document.getElementById('officialListView');
    const editorView = document.getElementById('officialEditorView');
    if (listView) listView.classList.remove('active');
    if (editorView) editorView.classList.add('active');

    // 추천 문서번호 자동 입력 (비어있을 경우)
    const docNoInput = document.getElementById('officialDocNo');
    if (docNoInput && !docNoInput.value.trim()) {
      docNoInput.value = generateRecommendedDocNo();
    }
  }

  async function editOfficialLetter(id) {
    let letter = (state.officialLetters || []).find((item) => Number(item.id) === Number(id));
    if (!letter) {
      try {
        const res = await window.AdminApi.api.get('/api/official');
        const list = Array.isArray(res) ? res : (res?.data || []);
        letter = list.find((item) => Number(item.id) === Number(id));
      } catch (err) {
        console.warn('Failed to fetch official letter for edit:', err);
      }
    }
    if (!letter) {
      if (window.AdminApi?.toast) window.AdminApi.toast.show('공문 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    const editIdInput = document.getElementById('officialEditId');
    if (editIdInput) editIdInput.value = letter.id;

    const docNoInput = document.getElementById('officialDocNo');
    if (docNoInput) docNoInput.value = letter.doc_no || '';

    const receiverInput = document.getElementById('officialReceiver');
    if (receiverInput) receiverInput.value = letter.receiver || '';

    const senderInput = document.getElementById('officialSender');
    if (senderInput) senderInput.value = letter.sender || '케이웨이브 미션 대표선교사';

    const titleInput = document.getElementById('officialTitle');
    if (titleInput) titleInput.value = letter.title || '';

    const hiddenContent = document.getElementById('officialContent');
    if (hiddenContent) hiddenContent.value = letter.content || '';

    if (officialTiptapInstance) {
      try { officialTiptapInstance.commands.setContent(letter.content || ''); } catch (_) {}
    }
    const sourceTextarea = document.querySelector('#officialEditorView .blogger-html-source');
    if (sourceTextarea) sourceTextarea.value = letter.content || '';

    // Handle Attachment Display
    const fileInput = document.getElementById('officialAttachment');
    const displayBox = document.getElementById('officialAttachmentDisplay');
    const displayName = document.getElementById('officialAttachmentName');
    const keepAttachment = document.getElementById('officialKeepAttachment');
    
    if (fileInput) fileInput.value = ''; // Reset file input
    if (keepAttachment) keepAttachment.value = 'true';

    if (letter.attachment_url && letter.attachment_name) {
      if (displayBox) displayBox.classList.remove('hidden');
      if (displayName) displayName.textContent = letter.attachment_name;
    } else {
      if (displayBox) displayBox.classList.add('hidden');
      if (displayName) displayName.textContent = '';
    }

    const formTitle = document.getElementById('officialFormTitle');
    if (formTitle) formTitle.textContent = `공문 수정 (문서번호: ${letter.doc_no})`;

    const submitBtn = document.getElementById('officialSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<span>💾</span> 공문 수정 저장';

    const listView = document.getElementById('officialListView');
    const editorView = document.getElementById('officialEditorView');
    if (listView) listView.classList.remove('active');
    if (editorView) editorView.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideOfficialEditor() {
    const form = document.getElementById('officialForm');
    if (form) form.reset();

    const editIdInput = document.getElementById('officialEditId');
    if (editIdInput) editIdInput.value = '';

    const formTitle = document.getElementById('officialFormTitle');
    if (formTitle) formTitle.textContent = '새 공문 작성 (비공개 보안 발송)';

    const submitBtn = document.getElementById('officialSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = '<span>📄</span> 공문 생성 및 보안 링크 발급';

    const hiddenContent = document.getElementById('officialContent');
    if (hiddenContent) hiddenContent.value = '';

    if (officialTiptapInstance) {
      try { officialTiptapInstance.commands.setContent(''); } catch (_) {}
    }
    const sourceTextarea = document.querySelector('#officialEditorView .blogger-html-source');
    if (sourceTextarea) {
      sourceTextarea.value = '';
      sourceTextarea.classList.add('hidden');
    }

    const editorContainer = document.getElementById('officialTiptapEditor');
    if (editorContainer) editorContainer.classList.remove('hidden');

    // 첨부파일 초기화
    const fileInput = document.getElementById('officialAttachment');
    const displayBox = document.getElementById('officialAttachmentDisplay');
    const displayName = document.getElementById('officialAttachmentName');
    const keepAttachment = document.getElementById('officialKeepAttachment');
    
    if (fileInput) fileInput.value = '';
    if (displayBox) displayBox.classList.add('hidden');
    if (displayName) displayName.textContent = '';
    if (keepAttachment) keepAttachment.value = 'true';

    const statusMsg = document.getElementById('officialStatusMsg');
    if (statusMsg) statusMsg.innerHTML = '';

    const listView = document.getElementById('officialListView');
    const editorView = document.getElementById('officialEditorView');
    if (editorView) editorView.classList.remove('active');
    if (listView) listView.classList.add('active');
  }

  function applyOfficialTemplate() {
    const docNoInput = document.getElementById('officialDocNo');
    const receiverInput = document.getElementById('officialReceiver');
    const senderInput = document.getElementById('officialSender');
    const titleInput = document.getElementById('officialTitle');

    if (docNoInput && !docNoInput.value.trim()) docNoInput.value = generateRecommendedDocNo();
    if (receiverInput && !receiverInput.value.trim()) receiverInput.value = '동역교회 담임목사 및 선교위원장 귀하';
    if (senderInput && !senderInput.value.trim()) senderInput.value = '케이웨이브 미션 대표선교사';
    if (titleInput && !titleInput.value.trim()) titleInput.value = '2026년 하반기 K-WAVE 고등교육선교 협력 및 단원 파견의 건';

    const defaultHtml = `<h3>1. 귀 교회의 부흥과 주님의 은혜를 기원합니다.</h3>
<p>주님의 지상명령을 받들어 세계 복음화를 위해 헌신하시는 귀 교회와 성도님들 위에 하나님의 크신 평강과 은혜가 늘 충만하시기를 간절히 기도합니다.</p>
<p>사단법인 케이웨이브 미션(K-Wave Mission)은 현대 선교의 핵심 통로인 <strong>'K-Culture & 교육'</strong>을 통해 인도네시아 및 동남아시아 권역의 차세대 청년들에게 복음을 전파하고 그리스도의 제자로 양육하는 고등교육선교 플랫폼입니다.</p>

<h3>2. 협력 제안 및 주요 사역 내용</h3>
<ul>
  <li><strong>선교 현장:</strong> 인도네시아 현지 대학 및 협력 교육기관 한국어/문화 학과</li>
  <li><strong>주요 사역:</strong> 한국어 교육 봉사, K-WAVE 문화 캠프, 1:1 멘토링 및 청년 복음화</li>
  <li><strong>단원 파견:</strong> 귀 교회의 헌신된 청년/성도 맞춤형 단기 및 중장기 파견 연계</li>
  <li><strong>지원 체계:</strong> 현지 안전 거점 및 전담 사역 멘토링 지원</li>
</ul>

<h3>3. 요청 사항</h3>
<p>귀 교회 청년 및 성도들이 열방을 품고 선교의 비전을 발견할 수 있도록 본 사역의 안내 및 선교 동역 협약을 정중히 요청드리오니 긍정적인 검토와 기도를 부탁드립니다.</p>

<p><em>※ 첨부: K-Wave Mission 2026 하반기 선교 사역 브로슈어 및 동역 신청서 1부. 끝.</em></p>`;

    const hiddenContent = document.getElementById('officialContent');
    if (hiddenContent) hiddenContent.value = defaultHtml;

    if (officialTiptapInstance) {
      try { officialTiptapInstance.commands.setContent(defaultHtml); } catch (_) {}
    }
    const sourceTextarea = document.querySelector('#officialEditorView .blogger-html-source');
    if (sourceTextarea) sourceTextarea.value = defaultHtml;

    if (window.AdminApi && window.AdminApi.toast) {
      window.AdminApi.toast.show('표준 공문 서식 템플릿이 적용되었습니다.', 'info');
    }
  }

  function bindEvents() {
    // 1. Navigation & View Switch
    document.querySelectorAll('[data-action="show-official-editor"]').forEach((btn) => {
      btn.addEventListener('click', showOfficialEditor);
    });

    document.querySelectorAll('[data-action="hide-official-editor"]').forEach((btn) => {
      btn.addEventListener('click', hideOfficialEditor);
    });

    // 첨부파일 삭제 버튼
    const btnRemoveAttachment = document.getElementById('btnRemoveOfficialAttachment');
    if (btnRemoveAttachment) {
      btnRemoveAttachment.addEventListener('click', () => {
        const keepAttachment = document.getElementById('officialKeepAttachment');
        const displayBox = document.getElementById('officialAttachmentDisplay');
        const fileInput = document.getElementById('officialAttachment');
        
        if (keepAttachment) keepAttachment.value = 'false';
        if (displayBox) displayBox.classList.add('hidden');
        if (fileInput) fileInput.value = '';
      });
    }

    const fileInput = document.getElementById('officialAttachment');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const displayBox = document.getElementById('officialAttachmentDisplay');
        const displayName = document.getElementById('officialAttachmentName');
        const keepAttachment = document.getElementById('officialKeepAttachment');
        
        if (file) {
          if (displayBox) displayBox.classList.remove('hidden');
          if (displayName) displayName.textContent = file.name;
          if (keepAttachment) keepAttachment.value = 'true';
        }
      });
    }

    // 2. 표준 공문 템플릿 버튼
    const templateBtn = document.getElementById('btnApplyOfficialTemplate');
    if (templateBtn) {
      templateBtn.addEventListener('click', applyOfficialTemplate);
    }

    // 3. 검색 및 필터링
    const searchInput = document.getElementById('officialSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!state.officialLetters) return;
        if (!query) {
          renderOfficialTable(state.officialLetters);
          return;
        }
        const filtered = state.officialLetters.filter((item) => {
          return (
            (item.doc_no || '').toLowerCase().includes(query) ||
            (item.receiver || '').toLowerCase().includes(query) ||
            (item.sender || '').toLowerCase().includes(query) ||
            (item.title || '').toLowerCase().includes(query)
          );
        });
        renderOfficialTable(filtered);
      });
    }

    const resetBtn = document.getElementById('officialResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        renderOfficialTable(state.officialLetters || []);
      });
    }

    // 4. 테이블 액션 (링크 복사, 수정, 열람, 삭제) 위임
    const tableBody = document.getElementById('officialTableBody');
    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('.btn-copy-official-link');
        if (copyBtn) {
          const url = copyBtn.getAttribute('data-url') || getOfficialShareUrl(copyBtn.getAttribute('data-token'));
          await copyToClipboard(url, '공문 전용 비공개 열람 링크가 클립보드에 복사되었습니다.');
          return;
        }

        const editBtn = e.target.closest('.btn-edit-official');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          await editOfficialLetter(id);
          return;
        }

        const deleteBtn = e.target.closest('.btn-delete-official');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          if (!confirm(`공문(ID: ${id})을 정말로 삭제하시겠습니까? 삭제 후에는 보안 링크를 통한 열람이 불가능합니다.`)) {
            return;
          }
          try {
            await window.AdminApi.api.delete(`/api/official?id=${id}`);
            if (window.AdminApi.toast) {
              window.AdminApi.toast.show('공문이 삭제되었습니다.', 'success');
            }
            await loadOfficialList();
          } catch (err) {
            console.error('Failed to delete official letter:', err);
            if (window.AdminApi.toast) {
              window.AdminApi.toast.show(`삭제 실패: ${err.message || '오류 발생'}`, 'error');
            }
          }
          return;
        }

        const titleBtn = e.target.closest('.btn-view-letter');
        if (titleBtn) {
          const row = titleBtn.closest('tr');
          const token = row?.getAttribute('data-token');
          if (token) {
            window.open(getOfficialShareUrl(token), '_blank');
          }
        }
      });
    }

    // 5. 공문 등록/수정 폼 전송
    const officialForm = document.getElementById('officialForm');
    if (officialForm) {
      officialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('officialSubmitBtn');
        const statusMsg = document.getElementById('officialStatusMsg');
        const editId = document.getElementById('officialEditId')?.value?.trim();

        const docNo = document.getElementById('officialDocNo')?.value.trim();
        const receiver = document.getElementById('officialReceiver')?.value.trim();
        const sender = document.getElementById('officialSender')?.value.trim() || '케이웨이브 미션 대표선교사';
        const title = document.getElementById('officialTitle')?.value.trim();
        let content = document.getElementById('officialContent')?.value.trim();

        // Check if tiptap or textarea has content
        if (officialTiptapInstance) {
          const tiptapHtml = officialTiptapInstance.getHTML();
          if (tiptapHtml && tiptapHtml !== '<p></p>') {
            content = tiptapHtml;
          }
        }
        const sourceTextarea = document.querySelector('#officialEditorView .blogger-html-source');
        if (sourceTextarea && !sourceTextarea.classList.contains('hidden') && sourceTextarea.value.trim()) {
          content = sourceTextarea.value.trim();
        }

        if (!docNo || !receiver || !title || !content) {
          if (window.AdminApi?.toast) {
            window.AdminApi.toast.show('문서번호, 수신처, 공문 제목, 본문 내용을 모두 입력해 주세요.', 'warning');
          }
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = editId ? '공문 수정 내용 저장 중...' : '공문 생성 및 토큰 발급 중...';
        }

        try {
          const formData = new FormData();
          formData.append('doc_no', docNo);
          formData.append('receiver', receiver);
          formData.append('sender', sender);
          formData.append('title', title);
          formData.append('content', content);

          const attachmentFile = document.getElementById('officialAttachment')?.files[0];
          if (attachmentFile) {
            formData.append('attachment', attachmentFile);
          }
          const keepAttachment = document.getElementById('officialKeepAttachment')?.value;
          formData.append('keep_attachment', keepAttachment || 'false');

          if (editId) {
            formData.append('id', editId);
            // Update Existing Official Letter (PUT)
            await window.AdminApi.api.request({
              method: 'PUT',
              path: '/api/official',
              body: formData,
              isFormData: true
            });

            if (window.AdminApi?.toast) {
              window.AdminApi.toast.show('공문 내용이 성공적으로 수정되었습니다.', 'success');
            }

            hideOfficialEditor();
            await loadOfficialList();

          } else {
            // Create New Official Letter (POST)
            const response = await window.AdminApi.api.upload('/api/official', formData);

            const secretToken = response?.token || response?.data?.secret_token;
            const shareUrl = getOfficialShareUrl(secretToken);

            if (window.AdminApi?.toast) {
              window.AdminApi.toast.show('공문이 안전하게 발급되었습니다. 전용 보안 링크가 생성되었습니다.', 'success');
            }

            // Show Success Modal with Token Link
            showCreatedOfficialModal({
              docNo,
              receiver,
              title,
              secretToken,
              shareUrl
            });

            hideOfficialEditor();
            await loadOfficialList();
          }

        } catch (err) {
          console.error('Failed to save official letter:', err);
          if (statusMsg) {
            statusMsg.innerHTML = `<span class="text-rose-600 font-semibold">오류: ${err.message || '공문 저장에 실패했습니다.'}</span>`;
          }
          if (window.AdminApi?.toast) {
            window.AdminApi.toast.show(err.message || '공문 저장 실패', 'error');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = editId ? '<span>💾</span> 공문 수정 저장' : '<span>📄</span> 공문 생성 및 보안 링크 발급';
          }
        }
      });
    }

    // 6. 실시간 미리보기 버튼
    const previewBtn = document.getElementById('officialPreviewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const docNo = document.getElementById('officialDocNo')?.value.trim() || 'KWM-2026-PREVIEW';
        const receiver = document.getElementById('officialReceiver')?.value.trim() || '동역교회 귀하';
        const sender = document.getElementById('officialSender')?.value.trim() || '케이웨이브 미션 대표선교사';
        const title = document.getElementById('officialTitle')?.value.trim() || '공문 제목 미리보기';
        let content = document.getElementById('officialContent')?.value || '';

        if (officialTiptapInstance) {
          content = officialTiptapInstance.getHTML();
        }

        // Use standard preview modal with official letterhead & watermark
        const modal = document.getElementById('previewModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        const modalTypeChip = document.getElementById('modalTypeChip');
        const modalDate = document.getElementById('modalDate');

        if (modal && modalTitle && modalContent) {
          if (modalTypeChip) modalTypeChip.textContent = '보안 공문';
          if (modalDate) modalDate.textContent = `문서번호: ${docNo} | 수신: ${receiver} | 발신: ${sender}`;
          modalTitle.textContent = title;
          modalContent.innerHTML = `
            <div class="relative overflow-hidden p-4 sm:p-6 rounded-xl border border-slate-200 bg-white">
              <!-- Watermark -->
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden select-none" aria-hidden="true">
                <img src="/assets/images/logo.webp" alt="" class="w-64 opacity-[0.05] pointer-events-none select-none -rotate-6">
              </div>
              <!-- Mini Letterhead -->
              <div class="relative z-10 text-center pb-3 mb-4 border-b-2 border-slate-900 space-y-1">
                <div class="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white p-0.5 mx-auto mb-1 shadow-xs">
                  <img src="/assets/images/logo.webp" alt="Logo" class="w-full h-full object-cover rounded-full">
                </div>
                <div class="text-base sm:text-lg font-black text-slate-900">케이웨이브 미션</div>
                <div class="text-[10px] tracking-widest text-slate-600 font-semibold uppercase">K-WAVE MISSION (HIGHER EDUCATION MISSION PLATFORM)</div>
                <div class="text-[9px] text-slate-500">Bali Indonesia &amp; Republic of Korea • TEL 070-7781-2585 • admin@kwavemission.org</div>
              </div>
              <!-- Body -->
              <div class="relative z-10 prose prose-slate max-w-none text-xs sm:text-sm">
                ${content || '<p class="text-slate-400">본문 내용이 없습니다.</p>'}
              </div>
            </div>
          `;
          modal.style.display = 'flex';
        }
      });
    }
  }

  function showCreatedOfficialModal({ docNo, receiver, title, secretToken, shareUrl }) {
    let modal = document.getElementById('officialCreatedModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'officialCreatedModal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-lg mx-auto p-6 space-y-5 border border-slate-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">✓</span>
            <h3 class="text-lg font-bold text-slate-900">공문 등록 & 비공개 보안 링크 발급</h3>
          </div>
          <button type="button" class="modal-close text-slate-400 hover:text-slate-600 text-xl font-bold" onclick="document.getElementById('officialCreatedModal').style.display='none'">&times;</button>
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
          <div class="flex justify-between"><span class="text-slate-500 font-medium">문서번호:</span> <strong class="text-slate-800 font-mono">${docNo}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500 font-medium">수신:</span> <span class="text-slate-800 font-semibold">${receiver}</span></div>
          <div class="flex justify-between"><span class="text-slate-500 font-medium">제목:</span> <span class="text-slate-800 font-semibold truncate max-w-[280px]">${title}</span></div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700">🔒 비공개 고유 열람 링크 (수신처 전달용)</label>
          <div class="flex items-center gap-2">
            <input type="text" readonly value="${shareUrl}" class="w-full h-10 px-3 bg-slate-100 text-xs font-mono text-slate-800 border border-slate-300 rounded-lg outline-none select-all" id="createdOfficialLinkInput">
            <button type="button" id="btnCopyCreatedOfficialLink" class="px-3.5 h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer">
              <span>📋</span> 복사
            </button>
          </div>
          <p class="text-[11px] text-slate-400">💡 이 링크를 복사하여 수신자에게 카카오톡, 이메일 등으로 전달하면 수신자가 바로 열람 및 A4 인쇄/PDF 저장을 할 수 있습니다.</p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <a href="${shareUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors">
            새 창에서 공문 열람
          </a>
          <button type="button" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors" onclick="document.getElementById('officialCreatedModal').style.display='none'">
            확인 및 닫기
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    const copyBtn = modal.querySelector('#btnCopyCreatedOfficialLink');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(shareUrl, '비공개 공문 열람 링크가 복사되었습니다!');
      });
    }
  }

  let isInitialized = false;
  function init() {
    if (isInitialized) return;
    isInitialized = true;
    const editorEl = document.getElementById('officialTiptapEditor');
    if (editorEl) {
      officialTiptapInstance = setupBloggerEditor('officialTiptapEditor', 'officialTiptapToolbar', 'officialContent');
    }
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.TiptapEditor) {
        init();
      } else {
        document.addEventListener('tiptap:ready', init, { once: true });
        setTimeout(init, 500); // Fallback
      }
    });
  } else {
    if (window.TiptapEditor) {
      init();
    } else {
      document.addEventListener('tiptap:ready', init, { once: true });
      setTimeout(init, 500); // Fallback
    }
  }

  window.OfficialManager = {
    init,
    loadOfficialList,
    showOfficialEditor,
    hideOfficialEditor,
    applyOfficialTemplate,
    getOfficialShareUrl
  };

  window.loadOfficialList = loadOfficialList;

})();
