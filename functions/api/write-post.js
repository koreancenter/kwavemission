import { requireAdminAuth } from './_admin-auth.js';
import { errorMessage, jsonError, jsonSuccess, missingBinding } from './_api-utils.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    // 1. 이미지 파일 첨부를 위해 request.formData()로 수신
    const formData = await request.formData();
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const thumbnailUrl = formData.get("thumbnail_url");

    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "관리자 인증이 필요합니다.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    // 3. 필수 입력값 검증
    if (!title || !content) {
      return jsonError("제목과 본문은 필수 입력 항목입니다.", 400);
    }

    // 4. R2 이미지 업로드 처리
    let imageUrl = null;
    const hasUpload = imageFile
      && typeof imageFile.arrayBuffer === "function"
      && Number(imageFile.size || 0) > 0;

    if (hasUpload) {
      if (!env.BUCKET) {
        return missingBinding('BUCKET', 'R2');
      }

      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "image/avif": "avif"
      };

      const fallbackExt = mimeToExt[imageFile.type] || "bin";
      const nameExt = typeof imageFile.name === "string" && imageFile.name.includes(".")
        ? imageFile.name.split('.').pop().toLowerCase()
        : "";
      const fileExtension = nameExt || fallbackExt;
      const fileName = `images/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const fileBody = await imageFile.arrayBuffer();

      await env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: imageFile.type || "application/octet-stream" }
      });

      imageUrl = `/api/image/${fileName}`;
    } else if (typeof thumbnailUrl === "string" && thumbnailUrl.trim()) {
      imageUrl = thumbnailUrl.trim();
    }

    // 5. D1 데이터베이스 저장 (posts 테이블 기준)
    const info = await env.DB.prepare(
      "INSERT INTO posts (type, title, content, thumbnail_url) VALUES (?, ?, ?, ?)"
    ).bind(type, title, content, imageUrl).run();

    return jsonSuccess({ url: imageUrl, info });

  } catch (err) {
    return jsonError(errorMessage(err, '게시글 저장 중 오류가 발생했습니다.'), 500);
  }
}
