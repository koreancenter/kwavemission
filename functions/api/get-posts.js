import { errorMessage, jsonError, jsonResponse, missingBinding } from './_api-utils.js';

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const url = new URL(request.url);

    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');

    // 1. 특정 글 1개 가져오기
    if (id) {
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      return jsonResponse({ success: true, data: post || null });
    }

    // 2. 글 목록 가져오기 (전체 또는 news/notice 구분)
    let stmt;
    if (type && type !== 'all') {
      stmt = env.DB.prepare(
        "SELECT id, type, title, thumbnail_url, created_at FROM posts WHERE type = ? ORDER BY created_at DESC"
      ).bind(type);
    } else {
      stmt = env.DB.prepare(
        "SELECT id, type, title, thumbnail_url, created_at FROM posts ORDER BY created_at DESC"
      );
    }

    const { results } = await stmt.all();

    return jsonResponse({ success: true, data: results || [] });

  } catch (error) {
    return jsonError(errorMessage(error, '게시글 조회 중 오류가 발생했습니다.'), 500);
  }
}