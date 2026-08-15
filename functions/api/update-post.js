import { requireAdminAuth } from './_admin-auth.js';
import { errorMessage, jsonError, jsonSuccess, missingBinding } from './_api-utils.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();
    const id = formData.get("id");
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
    if (!id) {
      return jsonError("수정할 글 ID가 없습니다.", 400);
    }

    if (!title || !content) {
      return jsonError("제목과 본문은 필수 입력 항목입니다.", 400);
    }

    let imageUrl = null;
    // 새 이미지가 첨부된 경우만 R2에 신규 업로드
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

    // 새 이미지가 올려진 경우 thumbnail_url 변경, 없으면 기존 이미지 유지
    if (imageUrl) {
      await env.DB.prepare(
        "UPDATE posts SET type = ?, title = ?, content = ?, thumbnail_url = ? WHERE id = ?"
      ).bind(type, title, content, imageUrl, id).run();
    } else {
      await env.DB.prepare(
        "UPDATE posts SET type = ?, title = ?, content = ? WHERE id = ?"
      ).bind(type, title, content, id).run();
    }

    return jsonSuccess();

  } catch (err) {
    return jsonError(errorMessage(err, '게시글 수정 중 오류가 발생했습니다.'), 500);
  }
}