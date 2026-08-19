import { getAdminAuthContext } from './_admin-auth.js';
import { errorMessage, jsonError, jsonResponse } from './_api-utils.js';

const MAX_TEXT_LENGTH = 50000;
const MAX_PROMPT_LENGTH = 50000;

async function generateWithGemini(env, payload) {
  const apiKey = env.GEMINI_API_KEY || payload.apiKey;
  if (!apiKey) throw new Error('Gemini API Key가 설정되지 않았습니다.');

  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(
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

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.message || 'Gemini 호출에 실패했습니다.');
  }

  const generatedText = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!generatedText) throw new Error('Gemini가 생성된 텍스트를 반환하지 않았습니다.');
  return generatedText;
}

async function generateWithOllama(env, payload) {
  const baseUrl = String(env.OLLAMA_URL || payload.ollamaUrl || '').replace(/\/$/, '');
  const model = String(payload.model || env.OLLAMA_MODEL || '').trim();
  if (!baseUrl) throw new Error('Ollama 서버 주소가 설정되지 않았습니다.');
  if (!model) throw new Error('Ollama 모델을 선택해 주세요.');

  const parsedUrl = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Ollama 서버 주소 형식이 올바르지 않습니다.');
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: payload.systemPrompt,
      prompt: payload.text,
      stream: false
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Ollama 호출에 실패했습니다.');

  const generatedText = String(result.response || '').trim();
  if (!generatedText) throw new Error('Ollama가 생성된 텍스트를 반환하지 않았습니다.');
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
    return jsonError(errorMessage(error, 'AI 생성 중 오류가 발생했습니다.'), 500);
  }
}