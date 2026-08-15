import { requireAdminAuth } from './_admin-auth.js';
import { errorMessage, jsonError, jsonSuccess, missingBinding } from './_api-utils.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();

    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "관리자 인증이 필요합니다.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding('DB', 'D1');
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
      return jsonError("삭제할 프로그램 ID가 필요합니다.", 400);
    }

    // D1 DB 일괄 삭제 (batch 사용)
    const statements = idList.map((id) =>
      env.DB.prepare("DELETE FROM programs WHERE id = ?").bind(id)
    );
    await env.DB.batch(statements);

    return jsonSuccess({ count: idList.length });
  } catch (err) {
    return jsonError(errorMessage(err, '프로그램 삭제 중 오류가 발생했습니다.'), 500);
  }
}