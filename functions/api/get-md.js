export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = String(url.searchParams.get("slug") || "").trim();

    if (!slug) {
      return textResponse("slug 파라미터가 필요합니다.", 400);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return textResponse("유효하지 않은 slug 형식입니다.", 400);
    }

    if (!env.DB) {
      return textResponse("D1 바인딩 'DB'가 설정되지 않았습니다.", 503);
    }

    const program = await env.DB.prepare(
      `SELECT slug, title, category, description
       FROM programs
       WHERE slug = ? AND status != 'deleted'
       LIMIT 1`
    ).bind(slug).first();

    if (!program) {
      return textResponse("해당 프로그램을 찾을 수 없습니다.", 404);
    }

    const desc = (program.description || "").trim();
    const hasHtml = /<(?:div|span|table|tbody|thead|tr|th|td|p|h[1-6]|ul|ol|li|section|article|header|footer|style|iframe|svg|!--)/i.test(desc);

    if (hasHtml) {
      return new Response(desc, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        },
      });
    }

    return new Response(desc, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store"
      },
    });
  } catch (err) {
    return textResponse(`D1 프로그램 문서 조회 실패: ${err.message}`, 500);
  }
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}