export async function onRequestGet(context) {
  try {
    const { env, params } = context;

    // 1. [[path]] 배열을 'images/파일명.jpg' 형태의 문자열로 변환
    const key = Array.isArray(params.path) ? params.path.join('/') : params.path;

    if (!key) {
      return new Response("이미지 경로가 올바르지 않습니다.", { status: 400 });
    }

    // 2. R2 버킷에서 이미지 파일 가져오기
    const object = await env.BUCKET.get(key);

    if (!object) {
      return new Response("이미지를 찾을 수 없습니다.", { status: 404 });
    }

    // 3. 이미지 헤더 세팅 및 응답 반환
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // 브라우저 캐싱

    return new Response(object.body, { headers });

  } catch (err) {
    return new Response("이미지 로드 중 오류 발생: " + err.message, { status: 500 });
  }
}