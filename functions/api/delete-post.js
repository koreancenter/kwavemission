export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");

    if (!id) {
      return new Response(JSON.stringify({ error: "삭제할 글 ID가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 관리자 비밀번호 검증
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "비밀번호가 일치하지 않습니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // D1 DB에서 게시물 삭제
    await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}