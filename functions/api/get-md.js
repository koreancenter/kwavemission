export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("slug 파라미터가 필요합니다.", { status: 400 });
    }

    // 파일 이름 검증 (알파벳, 숫자, 하이픈, 언더바만 허용 - 경로 탐색 보안 방지)
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return new Response("유효하지 않은 slug 형식입니다.", { status: 400 });
    }

    // 배포된 웹 사이트의 정적 문서 경로(/docs/slug.md)에서 마크다운 파일 가져오기
    const docUrl = new URL(`/docs/${slug}.md`, url.origin);
    const res = await fetch(docUrl.toString());

    if (!res.ok) {
      return new Response("해당 문서를 찾을 수 없습니다.", { status: 404 });
    }

    const markdownText = await res.text();

    return new Response(markdownText, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`오류 발생: ${err.message}`, { status: 500 });
  }
}