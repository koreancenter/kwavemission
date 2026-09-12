import { getAdminAuthContext } from './_admin-auth.js';
import { errorMessage, jsonError, jsonResponse } from './_api-utils.js';

const MAX_TEXT_LENGTH = 50000;
const MAX_PROMPT_LENGTH = 50000;

function parseOllamaHost(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let str = rawUrl.trim();
  if (!str) return '';

  // 프로토콜(http/https) 누락 시 기본값 보정
  if (!/^https?:\/\//i.test(str)) {
    str = (str.includes('localhost') || str.includes('127.0.0.1'))
      ? `http://${str}`
      : `https://${str}`;
  }

  try {
    const parsed = new URL(str);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`지원하지 않는 프로토콜(${parsed.protocol})입니다.`);
    }

    // 경로 정규화: 끝 슬래시 및 중복 /api, /api/generate 등 제거
    let cleanPath = parsed.pathname.replace(/\/+$/, '');
    cleanPath = cleanPath.replace(/\/api\/(?:generate|tags|chat|show|version)\/?$/i, '').replace(/\/api\/?$/i, '');

    const origin = parsed.origin; // 프로토콜 + 호스트 + 포트(명시된 경우)
    return `${origin}${cleanPath}`.replace(/\/+$/, '');
  } catch (err) {
    return str.replace(/\/+$/, '').replace(/\/api\/(?:generate|tags|chat)\/?$/i, '').replace(/\/api\/?$/i, '');
  }
}

async function generateWithGemini(env, payload) {
  const apiKey = env.GEMINI_API_KEY || payload.apiKey;
  if (!apiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');

  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: payload.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: payload.text }] }]
        })
      }
    );
  } catch (fetchErr) {
    const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new Error(`Gemini 서버 통신 실패: ${detail}`);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.message || `Gemini 호출 실패 (HTTP ${response.status})`);
  }

  const generatedText = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!generatedText) throw new Error('Gemini가 생성된 텍스트를 반환하지 않았습니다.');
  return generatedText;
}

async function generateWithOllama(env, payload) {
  const rawUrl = String(env.OLLAMA_URL || payload.ollamaUrl || '').trim();
  const model = String(payload.model || env.OLLAMA_MODEL || '').trim();

  if (!rawUrl) throw new Error('Ollama 서버 주소가 설정되지 않았습니다.');
  if (!model) throw new Error('Ollama 모델을 선택해 주세요.');

  const ollamaHost = parseOllamaHost(rawUrl);
  if (!ollamaHost) {
    throw new Error('Ollama 서버 주소 형식이 올바르지 않습니다.');
  }

  const targetUrl = `${ollamaHost}/api/generate`;

  // Ollama API 규격: POST /api/generate
  // Body: { model, prompt, stream: false, (optional) system }
  const requestBody = {
    model,
    prompt: payload.systemPrompt
      ? `[지침 / 역할 정의]\n${payload.systemPrompt}\n\n[변환할 본문 내용]\n${payload.text}`
      : payload.text,
    stream: false
  };

  if (payload.systemPrompt) {
    requestBody.system = payload.systemPrompt;
  }

  let response;
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  } catch (fetchErr) {
    const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new Error(`Ollama 서버 연결 실패 (${targetUrl}): ${detail}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.message || JSON.stringify(errJson);
    } catch {
      try {
        errorDetail = (await response.text()).slice(0, 300);
      } catch {}
    }
    const reason = errorDetail || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Ollama API 오류 (${response.status}): ${reason}`);
  }

  const result = await response.json().catch(() => ({}));
  const generatedText = String(result.response || '').trim();
  if (!generatedText) {
    throw new Error('Ollama 서버에서 생성된 텍스트 응답이 비어 있습니다.');
  }
  return generatedText;
}

export async function onRequestPost(context) {
  try {
    const authContext = await getAdminAuthContext(context);
    if (!authContext.ok) {
      return jsonError(authContext.error, authContext.status);
    }

    const payload = await context.request.json().catch(() => null);
    if (!payload || typeof payload.text !== 'string' || typeof payload.systemPrompt !== 'string') {
      return jsonError('text와 systemPrompt는 필수 문자열입니다.', 400);
    }

    const text = payload.text.trim();
    const systemPrompt = payload.systemPrompt.trim();
    if (!text || !systemPrompt) {
      return jsonError('원문과 페르소나 프롬프트를 입력해 주세요.', 400);
    }
    if (text.length > MAX_TEXT_LENGTH || systemPrompt.length > MAX_PROMPT_LENGTH) {
      return jsonError('AI 요청 텍스트가 허용된 길이를 초과했습니다.', 413);
    }

    const requestPayload = { ...payload, text, systemPrompt };
    const provider = payload.provider === 'ollama' ? 'ollama' : 'gemini';
    const generatedText = provider === 'ollama'
      ? await generateWithOllama(context.env, requestPayload)
      : await generateWithGemini(context.env, requestPayload);

    return jsonResponse({ success: true, data: { text: generatedText } });
  } catch (error) {
    const errorMsg = errorMessage(error, 'AI 생성 중 오류가 발생했습니다.');
    return jsonError(errorMsg, 500);
  }
}