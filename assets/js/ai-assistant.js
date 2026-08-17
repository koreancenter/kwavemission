/**
 * K-Wave Mission - AI Assistant Module (ai-assistant.js)
 * 다중 페르소나 지원 (News, Reporter, Letter, Notice)
 * Mixed Content 및 네트워크 예외 처리 강화 버전
 */

const AIAssistant = {
  config: {
    provider: localStorage.getItem('ai_provider') || 'gemini',
    geminiKey: localStorage.getItem('ai_gemini_key') || '',
    ollamaUrl: localStorage.getItem('ai_ollama_url') || 'https://mrpark-bali.taile6b19b.ts.net',
    selectedModel: localStorage.getItem('ai_selected_model') || '',
    cachedOllamaModels: []
  },

  // 💡 페르소나별 독립 캐싱 객체 및 되돌리기 히스토리
  cachedPersonas: {},
  undoHistory: {},

  init() {
    const boxes = document.querySelectorAll('.ai-assistant-box');
    if (!boxes.length) return;

    boxes.forEach((box, idx) => {
      this.renderUI(box, idx);
      this.bindEvents(box, idx);
    });

    // 💡 초기화 시 API 호출 에러가 발생해도 다른 JS 실행이 멈추지 않도록 catch 감싸기
    if (this.config.geminiKey) {
      this.verifyGemini(true).catch(err => console.warn('Gemini 자동 검증 건너뜀:', err));
    }
    if (this.config.ollamaUrl) {
      this.fetchOllamaModels(true).catch(err => console.warn('Ollama 자동연결 건너뜀:', err));
    }
  },

  renderUI(container, idx) {
    container.innerHTML = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
          <strong style="font-size: 15px; color: #0f172a;">🤖 AI 도우미</strong>
          <div style="display:flex; gap: 10px;">
            <label><input type="radio" name="aiProvider_${idx}" value="gemini" ${this.config.provider === 'gemini' ? 'checked' : ''}> Gemini API</label>
            <label><input type="radio" name="aiProvider_${idx}" value="ollama" ${this.config.provider === 'ollama' ? 'checked' : ''}> Local Ollama</label>
          </div>
        </div>

        <!-- Gemini 설정 -->
        <div class="ai-sec-gemini" style="display: ${this.config.provider === 'gemini' ? 'block' : 'none'};">
          <div style="display: flex; gap: 8px;">
            <input type="password" class="geminiApiKey" placeholder="Gemini API Key 입력" value="${this.config.geminiKey}" style="flex:1;">
            <button type="button" class="btnVerifyGemini sm secondary">API Key 검증</button>
          </div>
        </div>

        <!-- Ollama 설정 -->
        <div class="ai-sec-ollama" style="display: ${this.config.provider === 'ollama' ? 'block' : 'none'};">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="ollamaBaseUrl" placeholder="https://mrpark-bali.taile6b19b.ts.net" value="${this.config.ollamaUrl}" style="flex:1;">
            <button type="button" class="btnFetchOllama sm secondary">서버 연결 및 모델 불러오기</button>
          </div>
          <select class="ollamaModelSelect" style="display:none; width: 100%;">
            <option value="">-- 모델 선택 --</option>
          </select>
        </div>

        <!-- 💡 4가지 페르소나 및 되돌리기 실행 버튼 -->
        <div style="margin-top: 12px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 10px; flex-wrap: wrap;">
          <button type="button" class="btnAINews sm outline">기사문</button>
          <button type="button" class="btnAIReporter sm outline">방송문</button>
          <button type="button" class="btnAILetter sm outline">편지문</button>
          <button type="button" class="btnAINotice sm outline">공고문</button>
          <button type="button" class="btnAIUndo sm secondary" style="display: none; background-color: #64748b; color: #ffffff; border: none; margin-left: auto;">↩️ 원본 되돌리기</button>
          <span class="aiStatusText" style="font-size: 12px; color: #64748b; align-self: center;"></span>
        </div>
      </div>
    `;
  },

  bindEvents(container, idx) {
    const providerRadios = container.querySelectorAll(`input[name="aiProvider_${idx}"]`);
    const btnGemini = container.querySelector('.btnVerifyGemini');
    const btnOllama = container.querySelector('.btnFetchOllama');
    
    const btnNews = container.querySelector('.btnAINews');
    const btnReporter = container.querySelector('.btnAIReporter');
    const btnLetter = container.querySelector('.btnAILetter');
    const btnNotice = container.querySelector('.btnAINotice');
    const btnUndo = container.querySelector('.btnAIUndo');

    const modelSelect = container.querySelector('.ollamaModelSelect');
    const targetId = container.dataset.target;

    providerRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.provider = e.target.value;
        localStorage.setItem('ai_provider', e.target.value);
        this.syncAllProviders();
      });
    });

    btnGemini?.addEventListener('click', () => {
      const key = container.querySelector('.geminiApiKey').value.trim();
      this.verifyGemini(false, key);
    });

    btnOllama?.addEventListener('click', () => {
      const url = container.querySelector('.ollamaBaseUrl').value.trim();
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

  syncAllProviders() {
    document.querySelectorAll('.ai-assistant-box').forEach((box, i) => {
      const radio = box.querySelector(`input[name="aiProvider_${i}"][value="${this.config.provider}"]`);
      if (radio) radio.checked = true;

      box.querySelector('.ai-sec-gemini').style.display = this.config.provider === 'gemini' ? 'block' : 'none';
      box.querySelector('.ai-sec-ollama').style.display = this.config.provider === 'ollama' ? 'block' : 'none';
    });
  },

  syncModelSelects() {
    document.querySelectorAll('.ollamaModelSelect').forEach(select => {
      select.innerHTML = '<option value="">-- 사용할 모델을 선택하세요 --</option>';
      this.config.cachedOllamaModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB)`;
        if (m.name === this.config.selectedModel) opt.selected = true;
        select.appendChild(opt);
      });
      select.style.display = 'block';
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
    const baseUrl = (urlOverride || this.config.ollamaUrl).replace(/\/$/, '');
    if (!baseUrl) return;

    // HTTPS 페이지에서 HTTP Ollama URL 호출 시 브라우저 경고 안내
    if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) {
      console.warn('[AI Assistant] HTTPS 환경에서 HTTP 주소(' + baseUrl + ') 호출 시 Mixed Content 차단이 일어날 수 있습니다.');
    }

    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error('서버 응답 없음');

      const data = await res.json();
      this.config.ollamaUrl = baseUrl;
      this.config.cachedOllamaModels = data.models || [];
      localStorage.setItem('ai_ollama_url', baseUrl);

      document.querySelectorAll('.ollamaBaseUrl').forEach(input => input.value = baseUrl);
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

    // Check if target is postContent with Tiptap Editor
    const isTiptap = targetId === 'postContent' && window.PostManager && window.PostManager.getTiptapContent;
    let sourceText = isTiptap ? window.PostManager.getTiptapContent() : targetArea.value.trim();

    // Strip HTML tags for clean text prompt if using Tiptap
    if (isTiptap && sourceText) {
      const doc = new DOMParser().parseFromString(sourceText, 'text/html');
      sourceText = doc.body.textContent.trim();
    }

    if (!sourceText) return alert('본문 내용을 먼저 입력해 주세요.');

    // 최초 변환 전 원본 텍스트/HTML 기록
    if (this.undoHistory[targetId] === undefined) {
      this.undoHistory[targetId] = isTiptap ? window.PostManager.getTiptapContent() : targetArea.value;
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

      if (isTiptap) {
        window.PostManager.setTiptapContent(formattedHtml);
      } else {
        targetArea.value = resultText;
      }

      this.setStatus(container, `✨ [${personaLabel}] 변환이 완료되었습니다!`);

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'inline-block';

    } catch (err) {
      this.setStatus(container, '❌ AI 오류: ' + err.message, true);
    }
  },

  restoreOriginalText(targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return;

    const isTiptap = targetId === 'postContent' && window.PostManager && window.PostManager.setTiptapContent;

    if (this.undoHistory[targetId] !== undefined) {
      const originalValue = this.undoHistory[targetId];
      if (isTiptap) {
        window.PostManager.setTiptapContent(originalValue);
      } else {
        targetArea.value = originalValue;
      }

      delete this.undoHistory[targetId]; // 원본 복원 후 히스토리 초기화
      this.setStatus(container, '↩️ 이전 원본 내용으로 복원되었습니다.');

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'none';
    } else {
      alert('복원할 이전 작업 내역이 없습니다.');
    }
  },

  async requestGeneration(text, systemPrompt) {
    if (!window.AdminApi?.api) throw new Error('관리자 API를 사용할 수 없습니다.');
    if (this.config.provider === 'gemini' && !this.config.geminiKey) {
      throw new Error('Gemini API Key를 먼저 검증해 주세요.');
    }
    if (this.config.provider === 'ollama' && !this.config.selectedModel) {
      throw new Error('Ollama 모델을 먼저 선택해 주세요.');
    }

    const result = await window.AdminApi.api.post('/api/generate-ai', {
      provider: this.config.provider,
      text,
      systemPrompt,
      apiKey: this.config.provider === 'gemini' ? this.config.geminiKey : undefined,
      ollamaUrl: this.config.provider === 'ollama' ? this.config.ollamaUrl : undefined,
      model: this.config.provider === 'ollama' ? this.config.selectedModel : undefined
    });

    const generatedText = typeof result === 'string' ? result : result?.text;
    if (!generatedText) throw new Error('AI가 생성된 텍스트를 반환하지 않았습니다.');
    return generatedText;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AIAssistant.init();
});