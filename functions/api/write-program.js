import { getAdminAuthContext } from './_admin-auth.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();
    const id = formData.get("id"); // ID가 있으면 UPDATE, 없으면 INSERT

    const slug = formData.get("slug");
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status") || "recruiting";
    const icon = formData.get("icon") || "🎓";
    const is_recommended = formData.get("is_recommended") === "1" ? 1 : 0;
    const display_order = parseInt(formData.get("display_order") || "0", 10);

    const authContext = await getAdminAuthContext(context);
    if (!authContext.ok) {
      const legacyPassword = formData.get("password");
      if (env.ADMIN_PASSWORD && legacyPassword !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: false, message: authContext.error || "비밀번호가 일치하지 않습니다." }), {
          status: authContext.status,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
    }

    // 필수 입력값 검증
    if (!slug || !category || !title || !description) {
      return new Response(JSON.stringify({ error: "슬러그, 카테고리, 제목, 설명은 필수 항목입니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 수정 (UPDATE)
    if (id) {
      await env.DB.prepare(
        `UPDATE programs 
         SET slug = ?, category = ?, title = ?, description = ?, status = ?, icon = ?, is_recommended = ?, display_order = ?
         WHERE id = ?`
      ).bind(slug, category, title, description, status, icon, is_recommended, display_order, id).run();

      return new Response(JSON.stringify({ success: true, message: "프로그램이 수정되었습니다." }), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 신규 등록 (INSERT)
    const info = await env.DB.prepare(
      `INSERT INTO programs (slug, category, title, description, status, icon, is_recommended, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, category, title, description, status, icon, is_recommended, display_order).run();

    return new Response(JSON.stringify({ success: true, info }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
