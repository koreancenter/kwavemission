import { getAdminAuthContext } from './_admin-auth.js';

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

    if (!id) {
      return new Response(JSON.stringify({ error: "수정할 글 ID가 없습니다." }), { status: 400 });
    }

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

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "제목과 본문은 필수 입력 항목입니다." }), { status: 400 });
    }

    let imageUrl = null;
    // 새 이미지가 첨부된 경우만 R2에 신규 업로드
    const hasUpload = imageFile
      && typeof imageFile.arrayBuffer === "function"
      && Number(imageFile.size || 0) > 0;

    if (hasUpload) {
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