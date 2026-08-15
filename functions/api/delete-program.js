import { getAdminAuthContext } from './_admin-auth.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();

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

    // 단일 id 또는 다중 ids 수신
    const idInput = formData.getAll("ids").concat(formData.getAll("id"));

    // 전달받은 값들을 분할하여 ID 배열 생성
    let idList = [];
    for (const item of idInput) {
      if (typeof item === "string") {
        if (item.startsWith("[")) {
          try {
            idList.push(...JSON.parse(item));
          } catch (e) {
            idList.push(item);
          }
        } else if (item.includes(",")) {
          idList.push(...item.split(","));
        } else {
          idList.push(item);
        }
      }
    }

    // 공백 제거 및 유효한 ID 필터링
    idList = idList.map((i) => String(i).trim()).filter(Boolean);

    if (idList.length === 0) {
      return new Response(
        JSON.stringify({ error: "삭제할 프로그램 ID가 필요합니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    // 관리자 비밀번호 검증
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "비밀번호가 일치하지 않습니다." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    // D1 DB 일괄 삭제 (batch 사용)
    const statements = idList.map((id) =>
      env.DB.prepare("DELETE FROM programs WHERE id = ?").bind(id)
    );
    await env.DB.batch(statements);

    return new Response(
      JSON.stringify({ success: true, count: idList.length }),
      {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}