/**
 * K-Wave Mission - AI Assistant Module (ai-assistant.js)
 * [Cloud AI tab] [Local AI tab] 지원
 * 1) Cloud API Key
 * 2) Local AI PC (http://localhost:11434)
 * 3) Local AI Server (SSH / 원격)
 */

const AIAssistant = {
  config: {
    activeTab: localStorage.getItem('ai_active_tab') || 'cloud', // 'cloud' | 'local'
    localMode: localStorage.getItem('ai_local_mode') || 'pc',    // 'pc' | 'server'
    geminiKey: localStorage.getItem('ai_gemini_key') || '',
    ollamaPcUrl: localStorage.getItem('ai_ollama_pc_url') || 'http://localhost:11434',
    ollamaServerUrl: localStorage.getItem('ai_ollama_server_url') || 'https://mrpark-bali.taile6b19b.ts.net',
    selectedModel: localStorage.getItem('ai_selected_model') || '',
    cachedOllamaModels: []
  },

  cachedPersonas: {},
  undoHistory: {},

  init() {
    const boxes = document.querySelectorAll('.ai-assistant-box');
    if (!boxes.length) return;

    boxes.forEach((box, idx) => {
      this.renderUI(box, idx);
      this.bindEvents(box, idx);
    });

    this.syncStateUI();

    if (this.config.geminiKey) {
      this.verifyGemini(true).catch(err => console.warn('Gemini 자동 검증 건너뜀:', err));
    }

    const initialOllamaUrl = this.config.localMode === 'pc' ? this.config.ollamaPcUrl : this.config.ollamaServerUrl;
    if (initialOllamaUrl) {
      this.fetchOllamaModels(true, initialOllamaUrl).catch(err => console.warn('Ollama 자동연결 건너뜀:', err));
    }
  },

  renderUI(container, idx) {
    container.innerHTML = `
      <div class="ai-assistant-card bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2">
        <!-- 상단 리본: AI 도우미 타이틀 + 메인 탭 [Cloud] [Local] + 스타일 변환 버튼 -->
        <div class="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-200/80">
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div class="flex items-center gap-1 pr-1.5 sm:pr-2 sm:border-r sm:border-slate-200">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-900 text-amber-400 text-[10px] shadow-2xs">✨</span>
              <strong class="text-xs font-bold text-slate-800">AI 작성</strong>
            </div>

            <div class="ai-tab-group flex items-center gap-1">
              <button type="button" class="btnTabCloud px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer" data-tab="cloud">
                ☁️ Cloud
              </button>
              <button type="button" class="btnTabLocal px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer" data-tab="local">
                💻 Local
              </button>
            </div>
          </div>

          <!-- 페르소나 스타일 변환 버튼 & 상태 표시 -->
          <div class="flex flex-wrap items-center gap-1">
            <button type="button" class="btnAINews px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer">📰 기사</button>
            <button type="button" class="btnAIReporter px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer">🎙️ 방송</button>
            <button type="button" class="btnAILetter px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer">✉️ 편지</button>
            <button type="button" class="btnAINotice px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer">📢 공고</button>
            <button type="button" class="btnAIUndo hidden px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer">↩️ 되돌리기</button>
            <span class="aiStatusText text-[11px] font-medium text-slate-500 pl-1"></span>
          </div>
        </div>

        <!-- TAB 1: Cloud AI 섹션 (컴팩트 1줄) -->
        <div class="ai-panel-cloud">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-600 shrink-0">🔑 Gemini API:</span>
            <input type="password" class="geminiApiKey flex-1 h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all placeholder:text-slate-400" placeholder="Gemini API Key를 입력하세요" value="${this.config.geminiKey}">
            <button type="button" class="btnVerifyGemini shrink-0 h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer">Key 검증</button>
          </div>
        </div>

        <!-- TAB 2: Local AI 섹션 (컴팩트 인라인 배치) -->
        <div class="ai-panel-local">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Sub-mode 버튼 -->
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" class="btnLocalModePc px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer" data-mode="pc">
                🖥️ PC
              </button>
              <button type="button" class="btnLocalModeServer px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer" data-mode="server">
                🌐 서버
              </button>
            </div>

            <!-- Mode 2: Local AI PC (localhost:11434) -->
            <div class="local-sec-pc flex-1 min-w-[200px]">
              <div class="flex items-center gap-1.5">
                <input type="text" class="ollamaPcUrl flex-1 h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all" placeholder="http://localhost:11434" value="${this.config.ollamaPcUrl}">
                <button type="button" class="btnFetchOllamaPc shrink-0 h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer">연결</button>
              </div>
            </div>

            <!-- Mode 3: Local AI Server (SSH / 원격) -->
            <div class="local-sec-server flex-1 min-w-[200px]">
              <div class="flex items-center gap-1.5">
                <input type="text" class="ollamaServerUrl flex-1 h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all" placeholder="https://mrpark-bali.taile6b19b.ts.net" value="${this.config.ollamaServerUrl}">
                <button type="button" class="btnFetchOllamaServer shrink-0 h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer">연결</button>
              </div>
            </div>

            <!-- Shared Local AI Model Dropdown -->
            <div class="flex items-center gap-1.5 shrink-0 w-full sm:w-auto sm:min-w-[170px]">
              <select class="ollamaModelSelect w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all">
                <option value="">-- 모델 선택 --</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    const btnTabCloud = container.querySelector('.btnTabCloud');
    const btnTabLocal = container.querySelector('.btnTabLocal');
    const btnLocalModePc = container.querySelector('.btnLocalModePc');
    const btnLocalModeServer = container.querySelector('.btnLocalModeServer');

    const btnGemini = container.querySelector('.btnVerifyGemini');
    const btnFetchPc = container.querySelector('.btnFetchOllamaPc');
    const btnFetchServer = container.querySelector('.btnFetchOllamaServer');

    const btnNews = container.querySelector('.btnAINews');
    const btnReporter = container.querySelector('.btnAIReporter');
    const btnLetter = container.querySelector('.btnAILetter');
    const btnNotice = container.querySelector('.btnAINotice');
    const btnUndo = container.querySelector('.btnAIUndo');

    const modelSelect = container.querySelector('.ollamaModelSelect');
    const targetId = container.dataset.target;

    btnTabCloud?.addEventListener('click', () => {
      this.config.activeTab = 'cloud';
      localStorage.setItem('ai_active_tab', 'cloud');
      this.syncStateUI();
    });

    btnTabLocal?.addEventListener('click', () => {
      this.config.activeTab = 'local';
      localStorage.setItem('ai_active_tab', 'local');
      this.syncStateUI();
    });

    btnLocalModePc?.addEventListener('click', () => {
      this.config.localMode = 'pc';
      localStorage.setItem('ai_local_mode', 'pc');
      this.syncStateUI();
    });

    btnLocalModeServer?.addEventListener('click', () => {
      this.config.localMode = 'server';
      localStorage.setItem('ai_local_mode', 'server');
      this.syncStateUI();
    });

    btnGemini?.addEventListener('click', () => {
      const key = container.querySelector('.geminiApiKey').value.trim();
      this.verifyGemini(false, key);
    });

    btnFetchPc?.addEventListener('click', () => {
      const url = container.querySelector('.ollamaPcUrl').value.trim() || 'http://localhost:11434';
      this.config.ollamaPcUrl = url;
      localStorage.setItem('ai_ollama_pc_url', url);
      this.fetchOllamaModels(false, url);
    });

    btnFetchServer?.addEventListener('click', () => {
      const url = container.querySelector('.ollamaServerUrl').value.trim();
      this.config.ollamaServerUrl = url;
      localStorage.setItem('ai_ollama_server_url', url);
      this.fetchOllamaModels(false, url);
    });

    modelSelect?.addEventListener('change', (e) => {
      this.config.selectedModel = e.target.value;
      localStorage.setItem('ai_selected_model', e.target.value);
      this.syncModelSelects();
    });

    btnNews?.addEventListener('click', () => this.processAI('news', targetId, container));
    btnReporter?.addEventListener('click', () => this.processAI('reporter', targetId, container));
    btnLetter?.addEventListener('click', () => this.processAI('letter', targetId, container));
    btnNotice?.addEventListener('click', () => this.processAI('notice', targetId, container));

    btnUndo?.addEventListener('click', () => this.restoreOriginalText(targetId, container));
  },

  setStatus(container, msg, isError = false) {
    const el = container.querySelector('.aiStatusText');
    if (el) {
      el.textContent = msg;
      el.style.color = isError ? '#dc2626' : '#2563eb';
    }
  },

  syncStateUI() {
    document.querySelectorAll('.ai-assistant-box').forEach((box) => {
      const isCloud = this.config.activeTab === 'cloud';
      const isLocalPc = this.config.localMode === 'pc';

      const activeBtnClass = 'px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer';
      const inactiveBtnClass = 'px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer';

      // Tab Buttons Highlight
      const btnCloud = box.querySelector('.btnTabCloud');
      const btnLocal = box.querySelector('.btnTabLocal');

      if (btnCloud) {
        btnCloud.className = `btnTabCloud ${isCloud ? activeBtnClass : inactiveBtnClass}`;
      }
      if (btnLocal) {
        btnLocal.className = `btnTabLocal ${!isCloud ? activeBtnClass : inactiveBtnClass}`;
      }

      // Panels Toggle
      const panelCloud = box.querySelector('.ai-panel-cloud');
      const panelLocal = box.querySelector('.ai-panel-local');
      if (panelCloud) panelCloud.style.display = isCloud ? 'block' : 'none';
      if (panelLocal) panelLocal.style.display = !isCloud ? 'block' : 'none';

      // Local Sub-Modes Highlight & Panel Toggle
      const btnPc = box.querySelector('.btnLocalModePc');
      const btnServer = box.querySelector('.btnLocalModeServer');
      if (btnPc) {
        btnPc.className = `btnLocalModePc ${isLocalPc ? activeBtnClass : inactiveBtnClass}`;
      }
      if (btnServer) {
        btnServer.className = `btnLocalModeServer ${!isLocalPc ? activeBtnClass : inactiveBtnClass}`;
      }

      const secPc = box.querySelector('.local-sec-pc');
      const secServer = box.querySelector('.local-sec-server');
      if (secPc) secPc.style.display = isLocalPc ? 'block' : 'none';
      if (secServer) secServer.style.display = !isLocalPc ? 'block' : 'none';
    });

    this.syncModelSelects();
  },

  syncModelSelects() {
    document.querySelectorAll('.ollamaModelSelect').forEach(select => {
      select.innerHTML = '<option value="">-- 사용할 모델 선택 --</option>';
      this.config.cachedOllamaModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB)`;
        if (m.name === this.config.selectedModel) opt.selected = true;
        select.appendChild(opt);
      });
    });
  },

  async loadPersona(type) {
    if (this.cachedPersonas[type]) return this.cachedPersonas[type];

    const targetUrl = `./docs/persona_${type}.md`;
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`persona_${type}.md 파일을 찾을 수 없습니다.`);
      
      const text = await res.text();
      this.cachedPersonas[type] = text.trim();
      return this.cachedPersonas[type];
    } catch (err) {
      console.warn(`⚠️ persona_${type}.md 로드 실패:`, err);
      return `[AI 페르소나 기본 설정]\n입력된 텍스트를 정돈된 어조로 다듬어 주세요.`.trim();
    }
  },

  async verifyGemini(quiet = false, keyOverride = null) {
    const key = keyOverride || this.config.geminiKey;
    if (!key) return;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        this.config.geminiKey = key;
        localStorage.setItem('ai_gemini_key', key);
        document.querySelectorAll('.geminiApiKey').forEach(input => input.value = key);
        if (!quiet) alert('✅ Gemini API Key가 성공적으로 검증되었습니다.');
      } else {
        throw new Error('API Key가 유효하지 않습니다.');
      }
    } catch (err) {
      console.warn('Gemini API 검증 오류:', err.message);
      if (!quiet) alert('❌ Gemini 연동 실패: ' + err.message);
    }
  },

  // 💡 Mixed Content 및 Ollama 연결 에러 방어 처리된 메서드
  async fetchOllamaModels(quiet = false, urlOverride = null) {
    const activeUrl = urlOverride || (this.config.localMode === 'pc' ? this.config.ollamaPcUrl : this.config.ollamaServerUrl);
    const baseUrl = (activeUrl || 'http://localhost:11434').replace(/\/$/, '');

    // HTTPS 페이지에서 HTTP Ollama URL 호출 시 브라우저 경고 안내
    if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) {
      console.warn('[AI Assistant] HTTPS 환경에서 HTTP 주소(' + baseUrl + ') 호출 시 Mixed Content 차단이 일어날 수 있습니다.');
    }

    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error('서버 응답 없음');

      const data = await res.json();
      this.config.cachedOllamaModels = data.models || [];

      if (this.config.localMode === 'pc') {
        this.config.ollamaPcUrl = baseUrl;
        localStorage.setItem('ai_ollama_pc_url', baseUrl);
        document.querySelectorAll('.ollamaPcUrl').forEach(input => input.value = baseUrl);
      } else {
        this.config.ollamaServerUrl = baseUrl;
        localStorage.setItem('ai_ollama_server_url', baseUrl);
        document.querySelectorAll('.ollamaServerUrl').forEach(input => input.value = baseUrl);
      }

      this.syncModelSelects();

      if (!quiet) alert('✅ Local Ollama 모델 불러오기 성공!');
    } catch (err) {
      console.warn('Ollama 서버 연결 제한 (Mixed Content 또는 네트워크 차단):', err.message);
      if (!quiet) alert('❌ Ollama 연결 실패 (브라우저 주소창 자물쇠 버튼 -> "안전하지 않은 콘텐츠 허용" 확인 필요):\n' + err.message);
    }
  },

  async processAI(personaType, targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return alert(`대상이 되는 입력창(#${targetId})을 찾을 수 없습니다.`);

    // Check if target is postContent or programDescription with Tiptap Editor
    let isTiptap = false;
    let getEditorContent = null;
    let setEditorContent = null;

    if (targetId === 'postContent' && window.PostManager?.getTiptapContent) {
      isTiptap = true;
      getEditorContent = () => window.PostManager.getTiptapContent();
      setEditorContent = (val) => window.PostManager.setTiptapContent(val);
    } else if (targetId === 'programDescription' && (window.ProgramManager?.getProgramTiptapContent || window.getProgramTiptapContent)) {
      isTiptap = true;
      getEditorContent = () => (window.ProgramManager?.getProgramTiptapContent ? window.ProgramManager.getProgramTiptapContent() : window.getProgramTiptapContent());
      setEditorContent = (val) => (window.ProgramManager?.setProgramTiptapContent ? window.ProgramManager.setProgramTiptapContent(val) : window.setProgramTiptapContent(val));
    }

    let sourceText = isTiptap ? getEditorContent() : targetArea.value.trim();

    // Strip HTML tags for clean text prompt if using Tiptap
    if (isTiptap && sourceText) {
      const doc = new DOMParser().parseFromString(sourceText, 'text/html');
      sourceText = doc.body.textContent.trim();
    }

    if (!sourceText) return alert('본문 내용을 먼저 입력해 주세요.');

    // 최초 변환 전 원본 텍스트/HTML 기록
    if (this.undoHistory[targetId] === undefined) {
      this.undoHistory[targetId] = isTiptap ? getEditorContent() : targetArea.value;
    }

    const personaNames = {
      news: '기사문',
      reporter: '방송문',
      letter: '편지문',
      notice: '공고문'
    };
    const personaLabel = personaNames[personaType] || personaType.toUpperCase();

    this.setStatus(container, `🤖 ${personaLabel} 지침 불러오는 중...`);

    const SYSTEM_PERSONA = await this.loadPersona(personaType);

    this.setStatus(container, '🤖 AI가 작성하는 중입니다...');

    try {
      const resultText = await this.requestGeneration(sourceText, SYSTEM_PERSONA);

      // Convert generated markdown to HTML if marked is available, or use paragraphs
      let formattedHtml = resultText;
      if (window.marked) {
        formattedHtml = window.marked.parse(resultText);
      }

      if (isTiptap && setEditorContent) {
        setEditorContent(formattedHtml);
      } else {
        targetArea.value = resultText;
      }

      this.setStatus(container, `✨ [${personaLabel}] 변환이 완료되었습니다!`);

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) {
        btnUndo.style.display = 'inline-flex';
        btnUndo.classList.remove('hidden');
      }

    } catch (err) {
      this.setStatus(container, '❌ AI 오류: ' + err.message, true);
    }
  },

  restoreOriginalText(targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return;

    let isTiptap = false;
    let setEditorContent = null;

    if (targetId === 'postContent' && window.PostManager?.setTiptapContent) {
      isTiptap = true;
      setEditorContent = (val) => window.PostManager.setTiptapContent(val);
    } else if (targetId === 'programDescription' && (window.ProgramManager?.setProgramTiptapContent || window.setProgramTiptapContent)) {
      isTiptap = true;
      setEditorContent = (val) => (window.ProgramManager?.setProgramTiptapContent ? window.ProgramManager.setProgramTiptapContent(val) : window.setProgramTiptapContent(val));
    }

    if (this.undoHistory[targetId] !== undefined) {
      const originalValue = this.undoHistory[targetId];
      if (isTiptap && setEditorContent) {
        setEditorContent(originalValue);
      } else {
        targetArea.value = originalValue;
      }

      delete this.undoHistory[targetId]; // 원본 복원 후 히스토리 초기화
      this.setStatus(container, '↩️ 이전 원본 내용으로 복원되었습니다.');

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) {
        btnUndo.style.display = 'none';
        btnUndo.classList.add('hidden');
      }
    } else {
      alert('복원할 이전 작업 내역이 없습니다.');
    }
  },

  async requestGeneration(text, systemPrompt) {
    if (!window.AdminApi?.api) throw new Error('관리자 API를 사용할 수 없습니다.');

    const isCloud = this.config.activeTab === 'cloud';
    const provider = isCloud ? 'gemini' : 'ollama';

    if (isCloud && !this.config.geminiKey) {
      throw new Error('Gemini API Key를 먼저 검증해 주세요.');
    }

    const activeOllamaUrl = this.config.localMode === 'pc' ? this.config.ollamaPcUrl : this.config.ollamaServerUrl;

    if (!isCloud && !this.config.selectedModel) {
      throw new Error('Local AI 모델을 먼저 선택해 주세요.');
    }

    const result = await window.AdminApi.api.post('/api/generate-ai', {
      provider,
      text,
      systemPrompt,
      apiKey: isCloud ? this.config.geminiKey : undefined,
      ollamaUrl: !isCloud ? activeOllamaUrl : undefined,
      model: !isCloud ? this.config.selectedModel : undefined
    });

    const generatedText = typeof result === 'string' ? result : result?.text;
    if (!generatedText) throw new Error('AI가 생성된 텍스트를 반환하지 않았습니다.');
    return generatedText;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AIAssistant.init();
});