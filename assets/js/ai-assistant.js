/**
 * K-Wave Mission - AI Assistant Module (ai-assistant.js)
 * Post & Program 지원 버전 (다중 에디터 지원)
 */

const AIAssistant = {
  config: {
    provider: localStorage.getItem('ai_provider') || 'gemini',
    geminiKey: localStorage.getItem('ai_gemini_key') || '',
    ollamaUrl: localStorage.getItem('ai_ollama_url') || 'http://100.81.172.90:11434',
    selectedModel: localStorage.getItem('ai_selected_model') || '',
    cachedOllamaModels: []
  },

  init() {
    const boxes = document.querySelectorAll('.ai-assistant-box');
    if (!boxes.length) return;

    boxes.forEach((box, idx) => {
      this.renderUI(box, idx);
      this.bindEvents(box, idx);
    });

    // 기존 설정 자동 동기화 및 접속 시도
    if (this.config.geminiKey) this.verifyGemini(true);
    if (this.config.ollamaUrl) this.fetchOllamaModels(true);
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

        <!-- AI 작업 버튼 -->
        <div style="margin-top: 12px; display: flex; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <button type="button" class="btnAIRefine sm outline">✨ AI Refine (문장 다듬기)</button>
          <button type="button" class="btnAIHtmlEditor sm outline">🎨 AI HTML Editor (카드/스타일 변환)</button>
          <span class="aiStatusText" style="font-size: 12px; color: #64748b; align-self: center; margin-left: auto;"></span>
        </div>
      </div>
    `;
  },

  bindEvents(container, idx) {
    const providerRadios = container.querySelectorAll(`input[name="aiProvider_${idx}"]`);
    const btnGemini = container.querySelector('.btnVerifyGemini');
    const btnOllama = container.querySelector('.btnFetchOllama');
    const btnRefine = container.querySelector('.btnAIRefine');
    const btnHtml = container.querySelector('.btnAIHtmlEditor');
    const modelSelect = container.querySelector('.ollamaModelSelect');
    const targetId = container.dataset.target;

    // Radio 선택 전환 이벤트
    providerRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.provider = e.target.value;
        localStorage.setItem('ai_provider', e.target.value);
        this.syncAllProviders();
      });
    });

    // Gemini 검증
    btnGemini?.addEventListener('click', () => {
      const key = container.querySelector('.geminiApiKey').value.trim();
      this.verifyGemini(false, key);
    });

    // Ollama 모델 불러오기
    btnOllama?.addEventListener('click', () => {
      const url = container.querySelector('.ollamaBaseUrl').value.trim();
      this.fetchOllamaModels(false, url);
    });

    // 모델 선택 시 전역 적용
    modelSelect?.addEventListener('change', (e) => {
      this.config.selectedModel = e.target.value;
      localStorage.setItem('ai_selected_model', e.target.value);
      this.syncModelSelects();
    });

    // AI 실행 버튼
    btnRefine?.addEventListener('click', () => this.processAI('refine', targetId, container));
    btnHtml?.addEventListener('click', () => this.processAI('html_editor', targetId, container));
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
      if (!quiet) alert('❌ Gemini 연동 실패: ' + err.message);
    }
  },

  async fetchOllamaModels(quiet = false, urlOverride = null) {
    const baseUrl = (urlOverride || this.config.ollamaUrl).replace(/\/$/, '');
    if (!baseUrl) return;

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
      if (!quiet) alert('❌ Ollama 연결 실패 (Tailscale/CORS 확인): ' + err.message);
    }
  },

  async processAI(taskType, targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return alert(`대상이 되는 입력창(#${targetId})을 찾을 수 없습니다.`);

    const sourceText = targetArea.value.trim();
    if (!sourceText) return alert('본문 내용을 먼저 입력해 주세요.');

    let prompt = '';
    if (taskType === 'refine') {
      prompt = `다음 텍스트의 오탈자를 교정하고, 매끄럽고 전문적인 톤앤매너로 다듬어줘. 설명 없이 완성된 본문 내용만 출력해줘:\n\n${sourceText}`;
    } else if (taskType === 'html_editor') {
      prompt = `다음 텍스트 내용을 바탕으로, 인라인 CSS 스타일이 적용된 예쁜 HTML 웹 카드로 변환해줘. 모던한 디자인(둥근 모서리, 여백, 현대적인 색상)을 적용해주고, 마크다운 코드블록 표기(\`\`\`html) 없이 HTML 코드 본문만 출력해줘:\n\n${sourceText}`;
    }

    this.setStatus(container, '🤖 AI가 답변을 생성하는 중입니다...');

    try {
      let resultText = '';
      if (this.config.provider === 'gemini') {
        resultText = await this.callGemini(prompt);
      } else {
        resultText = await this.callOllama(prompt);
      }

      targetArea.value = resultText;
      this.setStatus(container, '✨ AI 작업이 성공적으로 적용되었습니다!');
    } catch (err) {
      this.setStatus(container, '❌ AI 오류: ' + err.message, true);
    }
  },

  async callGemini(prompt) {
    if (!this.config.geminiKey) throw new Error('Gemini API Key를 먼저 검증해 주세요.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.geminiKey}`;
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