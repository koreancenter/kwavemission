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

    // 🎭 AI 페르소나 설정 (필요에 따라 문구를 정교하게 수정해 보세요!)
    const SYSTEM_PERSONA = `
  [AI 페르소나 설정]
  - 당신은 'K-Wave Mission'의 대표 수석 카피라이터이자 웹 에디터입니다.
  - 주요 대상: 청년, 다음 세대, 선교 및 문화 사역에 관심 있는 구독자
  - 톤앤매너: 친근하면서도 격식 있고, 담백하고 산뜻하면서도 진정성과 울림이 느껴지는 신뢰감 있는 문체
  - 주의사항: 인사말이나 "네, 수정해 드렸습니다" 같은 답변 서두는 절대 출력하지 말고, 오직 완성된 본문 알맹이만 출력하세요.
    `.trim();

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

[작업 지시: 스탠다드 디자인 템플릿(13번 스타일) 기반 HTML 생성]
다음 입력받은 텍스트를 반드시 아래 [디자인 규격 및 가이드라인]에 맞추어 인라인 CSS가 적용된 HTML로 변환해 주세요.
내용에 따라 약간의 유연성은 가지되, 전체적인 컬러 톤과 구조적 틀은 스탠다드 스타일을 엄격히 유지해야 합니다.

[디자인 규격 및 가이드라인 (STANDARD)]
1. **전체 배경 & 컨테이너**:
   - 바탕색: 차분하고 깊은 다크 톤 배경 (\`background-color: #0f172a;\` 또는 \`#0b1329;\`)
   - 테두리 & 여백: 곡률 \`border-radius: 12px;\`, 테두리 \`border: 1px solid #1e293b;\`, 여백 \`padding: 30px;\`, 글자색 \`color: #e2e8f0;\`

2. **소제목 (H3 / H4 스타일)**:
   - 제목 앞에 **골드/오렌지 포인트 세로선** 필수 삽입 (\`border-left: 4px solid #f59e0b;\` 또는 \`#d97706;\`)
   - 왼쪽 여백(\`padding-left: 10px;\`), 볼드체(\`font-weight: bold;\`), 글자색 밝은 톤 (\`color: #f8fafc;\`)

3. **강조 키워드 및 태그**:
   - 강조 텍스트/뱃지: 딥블루/테일 배경에 노란색 또는 금색 글자 (\`background: #1e293b; color: #f59e0b; padding: 2px 8px; border-radius: 4px;\`)

4. **인용구 / 메시지 상자 (Quote Box)**:
   - 왼쪽 골드 포인트 바가 들어간 박스 (\`border-left: 3px solid #f59e0b;\` \`background: #1e293b;\` \`border-radius: 8px;\`)
   - 텍스트는 이탤릭체(\`font-style: italic;\`), 강조색 표현

5. **기도제목 / 요약 체크리스트 상자 (Callout Box)**:
   - 박스 형태: \`background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 20px;\`
   - 상단 타이틀: 노란색/금색 점 또는 이모지와 함께 영문 대문자 타이틀 (\`color: #f59e0b; font-weight: bold;\`)
   - 목록: \`<ul>\` / \`<li>\` 구조를 활용해 정돈된 리스트로 표현

6. **출력 규칙**:
   - 마크다운 코드블록(\`\`\`html) 표기 없이, 바로 웹에 삽입 가능한 순수 HTML 태그만 출력하세요.

[원본 텍스트]
${sourceText}
      `.trim();
    }

    this.setStatus(container, '🤖 AI가 페르소나에 맞춰 작성하는 중입니다...');

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