export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');

    // 1. 특정 글 1개 가져오기
    if (id) {
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      return new Response(JSON.stringify(post || {}), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
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