import { errorMessage, jsonError, jsonResponse, missingBinding } from './_api-utils.js';

export async function onRequestGet(context) {
  try {
    const { env, request, params } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const url = new URL(request.url);
    
    // Extract token from params.token, params.path, or query string
    let token = params?.token || '';
    if (!token && params?.path) {
      token = Array.isArray(params.path) ? params.path[0] : params.path;
    }
    if (!token) {
      token = url.searchParams.get('token') || '';
    }

    // Also check if url path ends with the token
    if (!token) {
      const match = url.pathname.match(/\/api\/official\/view\/([^/?#]+)/i);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    token = String(token).trim();

    if (!token) {
      return jsonError('공문 열람을 위한 보안 토큰이 필요합니다.', 400);
    }

    // Query single official letter strictly by secret_token
    const letter = await env.DB.prepare(
      `SELECT id, doc_no, receiver, sender, title, content, attachment_url, attachment_name, secret_token, created_at 
       FROM official_letters 
       WHERE secret_token = ?`
    ).bind(token).first();

    if (!letter) {
      return jsonError('유효하지 않거나 만료된 비공개 공문 링크입니다.', 404);
    }

    return jsonResponse({
      success: true,
      data: letter
    }, 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    });

  } catch (err) {
    return jsonError(errorMessage(err, '공문 열람 처리 중 오류가 발생했습니다.'), 500);
  }
}
