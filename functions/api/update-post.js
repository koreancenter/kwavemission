export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");

    if (!id) {
      return new Response(JSON.stringify({ error: "수정할 글 ID가 없습니다." }), { status: 400 });
    }

    // 관리자 비밀번호 검증
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "비밀번호가 일치하지 않습니다." }), { status: 401 });
    }

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "제목과 본문은 필수 입력 항목입니다." }), { status: 400 });
    }

    let imageUrl = null;
    // 새 이미지가 첨부된 경우만 R2에 신규 업로드
    if (imageFile && imageFile.name) {
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `images/${Date.now()}.${fileExtension}`;
      
      await env.BUCKET.put(fileName, imageFile.stream(), {
        httpMetadata: { contentType: imageFile.type }
      });

      imageUrl = `/api/image/${fileName}`;
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