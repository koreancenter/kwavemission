import { errorMessage, jsonError, jsonResponse, missingBinding } from './_api-utils.js';

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const url = new URL(request.url);

    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');

    // 1. 특정 프로그램 1개 가져오기
    if (id) {
      const program = await env.DB.prepare(
        "SELECT * FROM programs WHERE id = ? AND status != 'deleted'"
      ).bind(id).first();

      return jsonResponse({ success: true, data: program || null });
    }

    // 2. 프로그램 목록 가져오기 (상태별 필터링 또는 전체)
    let stmt;
    if (status && status !== 'all') {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status = ? AND status != 'deleted' ORDER BY display_order ASC, id DESC"
      ).bind(status);
    } else {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status != 'deleted' ORDER BY display_order ASC, id DESC"
      );
    }

    const { results } = await stmt.all();

    return jsonResponse({ success: true, data: results || [] });

  } catch (error) {
    return jsonError(errorMessage(error, '프로그램 조회 중 오류가 발생했습니다.'), 500);
  }
}
