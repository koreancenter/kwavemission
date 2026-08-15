/**
 * K-Wave Mission - AI Assistant Module (ai-assistant.js)
 * 다중 페르소나 지원 (News, Reporter, Letter)
 * Mixed Content 및 네트워크 예외 처리 강화 버전
 */

const AIAssistant = {
  config: {
    provider: localStorage.getItem('ai_provider') || 'gemini',
    geminiKey: localStorage.getItem('ai_gemini_key') || '',
    ollamaUrl: localStorage.getItem('ai_ollama_url') || 'http://100.81.172.90:11434',
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
            <input type="text" class="ollamaBaseUrl" placeholder="http://100.81.172.90:11434" value="${this.config.ollamaUrl}" style="flex:1;">
            <button type="button" class="btnFetchOllama sm secondary">서버 연결 및 모델 불러오기</button>
          </div>
          <select class="ollamaModelSelect" style="display:none; width: 100%;">
            <option value="">-- 모델 선택 --</option>
          </select>
        </div>

        <!-- 💡 3가지 페르소나 실행 버튼 -->
        <div style="margin-top: 12px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 10px; flex-wrap: wrap;">
          <button type="button" class="btnAINews sm outline">📰 News (기사체)</button>
          <button type="button" class="btnAIReporter sm outline">🎙️ Reporter (현장 리포트)</button>
          <button type="button" class="btnAILetter sm outline">✉️ Letter (서신체)</button>
          <button type="button" class="btnAIUndo sm secondary" style="display: none; background-color: #64748b; color: #ffffff; border: none;">↩️ 원본 되돌리기</button>
          <span class="aiStatusText" style="font-size: 12px; color: #64748b; align-self: center; margin-left: auto;"></span>
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

    const targetUrl = `/docs/persona_${type}.md`;
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

    const sourceText = targetArea.value.trim();
    if (!sourceText) return alert('본문 내용을 먼저 입력해 주세요.');

    this.undoHistory[targetId] = targetArea.value;

    this.setStatus(container, `🤖 ${personaType.toUpperCase()} 페르소나 지침 불러오는 중...`);

    const SYSTEM_PERSONA = await this.loadPersona(personaType);

    const prompt = `
${SYSTEM_PERSONA}

[원본 텍스트]
${sourceText}
    `.trim();

    this.setStatus(container, '🤖 AI가 작성하는 중입니다...');

    try {
      let resultText = '';
      if (this.config.provider === 'gemini') {
        resultText = await this.callGemini(prompt);
      } else {
        resultText = await this.callOllama(prompt);
      }

      targetArea.value = resultText;
      this.setStatus(container, '✨ AI 작업이 성공적으로 적용되었습니다!');

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'inline-block';

    } catch (err) {
      this.setStatus(container, '❌ AI 오류: ' + err.message, true);
    }
  },

  restoreOriginalText(targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return;

    if (this.undoHistory[targetId] !== undefined) {
      targetArea.value = this.undoHistory[targetId];
      this.setStatus(container, '↩️ 이전 원본 내용으로 복원되었습니다.');

      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'none';
    } else {
      alert('복원할 이전 작업 내역이 없습니다.');
    }
  },

  async callGemini(prompt) {
    if (!this.config.geminiKey) throw new Error('Gemini API Key를 먼저 검증해 주세요.');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${this.config.geminiKey}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini 호출 실패');
    
    return data.candidates[0].content.parts[0].text;
  },

  async callOllama(prompt) {
    if (!this.config.selectedModel) throw new Error('Ollama 모델을 먼저 선택해 주세요.');
    const res = await fetch(`${this.config.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.config.selectedModel, prompt: prompt, stream: false })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Ollama 호출 실패');
    return data.response;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AIAssistant.init();
});