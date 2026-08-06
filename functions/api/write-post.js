export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { password, type, title, content, thumbnail_url } = body;

    // 대시보드 Environment Variables에 설정할 ADMIN_PASSWORD와 비교
    if (password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "비밀번호가 일치하지 않습니다." }), { status: 401 });
    }

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "제목과 본문을 입력해 주세요." }), { status: 400 });
    }

    // D1 데이터베이스에 저장
    const info = await env.DB.prepare(
      "INSERT INTO newsletter_posts (type, title, content, thumbnail_url) VALUES (?, ?, ?, ?)"
    ).bind(type || 'news', title, content, thumbnail_url || null).run();

    return new Response(JSON.stringify({ success: true, info }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}