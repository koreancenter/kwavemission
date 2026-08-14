/**
 * K-Wave Mission - AI Assistant Module (ai-assistant.js)
 * Post & Program 지원 버전 (다중 에디터 및 되돌리기 기능 지원)
 */

const AIAssistant = {
  config: {
    provider: localStorage.getItem('ai_provider') || 'gemini',
    geminiKey: localStorage.getItem('ai_gemini_key') || '',
    ollamaUrl: localStorage.getItem('ai_ollama_url') || 'http://100.81.172.90:11434',
    selectedModel: localStorage.getItem('ai_selected_model') || '',
    cachedOllamaModels: [],
    // 💡 불러올 외부 페르소나 md 파일 경로 (필요에 따라 경로 수정 가능)
    personaUrl: '/docs/persona.md' 
  },

  // 💡 페르소나 캐싱용 변수 및 원본 백업 히스토리
  cachedPersona: null,
  undoHistory: {},

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
        <div style="margin-top: 12px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 10px; flex-wrap: wrap;">
          <button type="button" class="btnAIRefine sm outline">✨ AI Refine (문장 다듬기)</button>
          <button type="button" class="btnAIHtmlEditor sm outline">🎨 AI HTML Editor (카드/스타일 변환)</button>
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
    const btnRefine = container.querySelector('.btnAIRefine');
    const btnHtml = container.querySelector('.btnAIHtmlEditor');
    const btnUndo = container.querySelector('.btnAIUndo');
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

    // 💡 원본 되돌리기 버튼
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

  // 💡 [2번 기능 구현] 외부 .md 파일 읽어오는 비동기 함수
  async loadPersona() {
    if (this.cachedPersona) return this.cachedPersona;

    try {
      const res = await fetch(this.config.personaUrl);
      if (!res.ok) throw new Error('페르소나 파일(.md)을 찾을 수 없습니다.');
      
      const text = await res.text();
      this.cachedPersona = text.trim();
      return this.cachedPersona;
    } catch (err) {
      console.warn('⚠️ 외부 페르소나 로드 실패, 기본 Fallback 페르소나를 사용합니다:', err);
      return `
[AI 페르소나 설정]
- 당신은 기독교 선교 미디어 및 언론 저널리즘 분야의 수석 편집장이다.
- 정중한 편지체는 배제하고 객관적이고 신뢰감 있는 저널리즘 보도체(~했다, ~밝혔다)로 서술할 것.
- 완성된 본문 알맹이만 출력한다.
      `.trim();
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

    // 💡 [백업] AI 작업 전 현재 작성 중인 텍스트 원본 백업
    this.undoHistory[targetId] = targetArea.value;

    this.setStatus(container, '🤖 외부 페르소나 및 지침 불러오는 중...');

    // 💡 [3번 기능 적용] 외부 .md 파일에서 동적으로 페르소나 불러오기 (209~218번 대치)
    const SYSTEM_PERSONA = await this.loadPersona();

    let prompt = '';
    if (taskType === 'refine') {
      prompt = `
${SYSTEM_PERSONA}

[작업 지시: 문장 교정 및 리파인]
다음 전달받은 초안 텍스트의 오탈자를 바로잡고, 독자들에게 매끄럽고 인상 깊게 읽히도록 문장을 전문적으로 다듬어주세요.

[원본 텍스트]
${sourceText}
      `.trim();
    } else if (taskType === 'html_editor') {
      prompt = `
${SYSTEM_PERSONA}

[작업 지시: 모던 다크 스타일 HTML 카드 생성]
입력받은 텍스트를 바탕으로 웹페이지에 삽입할 HTML 코드를 생성하세요.

[🚨 절대 금지 사항 - 위반 시 감점]
1. 상단에 큰 영문 제목 배너(예: INDONESIA MISSION UPDATE, NEWSLETTER 등)나 그래디언트 박스를 절대 만들지 마세요.
2. 카드 본문 배경에 흰색(#ffffff)이나 밝은색을 절대 사용하지 마세요. 전체 배경은 무조건 차분한 다크 톤이어야 합니다.
3. 마크다운 코드블록(\`\`\`html) 표기 없이 순수 <div> HTML만 출력하세요.

[🎨 13번 글 스탠다드 디자인 가이드]
- **전체 감싸는 컨테이너**: 
  \`<div style="background-color: #0b1329; color: #e2e8f0; padding: 25px; border-radius: 12px; border: 1px solid #1e293b;">\`
- **본문 일반 텍스트**:
  \`<p style="line-height: 1.7; color: #cbd5e1; font-size: 15px; margin-bottom: 16px;">\`
- **소제목 (섹션 구분)**:
  세로 포인트 바를 넣은 텍스트
  \`<h3 style="border-left: 4px solid #f59e0b; padding-left: 10px; color: #f8fafc; font-size: 18px; margin-top: 24px; margin-bottom: 12px;">제목</h3>\`
- **강조/인용구 상자 (Quote Box)**:
  \`<div style="background-color: #111827; border-left: 3px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; font-style: italic; color: #f1f5f9;">인용문 내용</div>\`
- **기도제목/요약 상자 (Callout Box)**:
  \`<div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-top: 20px;">\` 내부에 노란색 포인트 타이틀과 <ul>/<li> 사용

[원본 텍스트]
${sourceText}
      `.trim();
    }

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

      // 💡 AI 변환 완료 시 [↩️ 원본 되돌리기] 버튼 노출
      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'inline-block';

    } catch (err) {
      this.setStatus(container, '❌ AI 오류: ' + err.message, true);
    }
  },

  // 💡 원본으로 되돌리기 동작 함수
  restoreOriginalText(targetId, container) {
    const targetArea = document.getElementById(targetId);
    if (!targetArea) return;

    if (this.undoHistory[targetId] !== undefined) {
      targetArea.value = this.undoHistory[targetId];
      this.setStatus(container, '↩️ 이전 원본 내용으로 복원되었습니다.');

      // 복원 완료 후 되돌리기 버튼 다시 숨김
      const btnUndo = container.querySelector('.btnAIUndo');
      if (btnUndo) btnUndo.style.display = 'none';
    } else {
      alert('복원할 이전 작업 내역이 없습니다.');
    }
  },

  async callGemini(prompt) {
    if (!this.config.geminiKey) throw new Error('Gemini API Key를 먼저 검증해 주세요.');
    
    // 💡 최신 Gemini API 표준 모델 및 v1beta 호환 엔드포인트 적용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.config.geminiKey}`;
    
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