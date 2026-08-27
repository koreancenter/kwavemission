import { requireAdminAuth } from './_admin-auth.js';
import { errorMessage, jsonError, jsonSuccess, missingBinding } from './_api-utils.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();
    const id = formData.get("id"); // ID가 있으면 UPDATE, 없으면 INSERT

    const slug = formData.get("slug");
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const status = formData.get("status") || "active";
    const icon = formData.get("icon") || "🎓";
    const display_order = parseInt(formData.get("display_order") || "0", 10);

    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "관리자 인증이 필요합니다.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    // 필수 입력값 검증 (D1 스키마 기준: slug, category, title NOT NULL)
    if (!slug || !category || !title) {
      return jsonError("슬러그, 카테고리, 제목은 필수 항목입니다.", 400);
    }

    // 수정 (UPDATE)
    if (id) {
      await env.DB.prepare(
        `UPDATE programs 
         SET slug = ?, category = ?, title = ?, description = ?, status = ?, icon = ?, display_order = ?
         WHERE id = ?`
      ).bind(slug, category, title, description, status, icon, display_order, id).run();

      return jsonSuccess({ message: "프로그램이 수정되었습니다." });
    }

    // 신규 등록 (INSERT)
    const info = await env.DB.prepare(
      `INSERT INTO programs (slug, category, title, description, status, icon, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, category, title, description, status, icon, display_order).run();

    return jsonSuccess({ info });

  } catch (err) {
    return jsonError(errorMessage(err, '프로그램 저장 중 오류가 발생했습니다.'), 500);
  }
}

