export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    
    const type = url.searchParams.get('type') || 'news'; // 'news' 또는 'notice'
    const id = url.searchParams.get('id');

    // 특정 글 1개만 가져오기 (상세보기)
    if (id) {
      const post = await env.DB.prepare(
        "SELECT * FROM newsletter_posts WHERE id = ? AND type = ?"
      ).bind(id, type).first();

      return new Response(JSON.stringify(post || {}), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 전체 목록 가져오기
    const { results } = await env.DB.prepare(
      "SELECT id, type, title, thumbnail_url, created_at FROM newsletter_posts WHERE type = ? ORDER BY created_at DESC"
    ).bind(type).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}