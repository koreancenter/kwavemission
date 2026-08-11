export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);

    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');

    // 1. 특정 프로그램 1개 가져오기
    if (id) {
      const program = await env.DB.prepare(
        "SELECT * FROM programs WHERE id = ?"
      ).bind(id).first();

      return new Response(JSON.stringify(program || {}), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 2. 프로그램 목록 가져오기 (상태별 필터링 또는 전체)
    let stmt;
    if (status && status !== 'all') {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status = ? ORDER BY display_order ASC, id DESC"
      ).bind(status);
    } else {
      stmt = env.DB.prepare(
        "SELECT * FROM programs ORDER BY display_order ASC, id DESC"
      );
    }

    const { results } = await stmt.all();

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
