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
      const containsTitle = desc.includes(program.title);
      const htmlOutput = containsTitle
        ? desc
        : `<div class="program-header mb-6 pb-4 border-b border-slate-200">
             ${program.category ? `<span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 mb-2">${program.category}</span>` : ''}
             <h1 class="text-2xl font-bold text-slate-900">${program.title}</h1>
           </div>\n${desc}`;

      return new Response(htmlOutput, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        },
      });
    }

    const markdown = [
      `# ${program.title}`,
      program.category ? `**${program.category}**` : "",
      desc
    ].filter(Boolean).join("\n\n");

    return new Response(markdown, {
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