export function jsonResponse(payload, status = 200, additionalHeaders = {}) {
  const headers = new Headers(additionalHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');

  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}

export function jsonSuccess(payload = {}, status = 200) {
  return jsonResponse({ success: true, ...payload }, status);
}

export function jsonError(message, status = 500, details) {
  const payload = { success: false, error: message, message };
  if (details) payload.details = details;
  return jsonResponse(payload, status);
}

export function missingBinding(name, resource) {
  return jsonError(
    `${resource} 바인딩 '${name}'가 설정되지 않았습니다.`,
    503,
    `Cloudflare 환경에서 ${name} 바인딩을 구성해 주세요.`
  );
}

export function errorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}
