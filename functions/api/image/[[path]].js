export async function onRequestGet(context) {
  try {
    const { env, params } = context;

    // 1. [[path]] 배열을 'images/파일명.jpg' 형태의 문자열로 변환
    const key = Array.isArray(params.path) ? params.path.join('/') : params.path;

    if (!key) {
      return textResponse("이미지 경로가 올바르지 않습니다.", 400);
    }

    if (!env.BUCKET) {
      return textResponse("R2 바인딩 'BUCKET'이 설정되지 않았습니다.", 503);
    }

    // 2. R2 버킷에서 이미지 파일 가져오기
    const object = await env.BUCKET.get(key);

    if (!object) {
      return textResponse("이미지를 찾을 수 없습니다.", 404);
    }

    // 3. 이미지 헤더 세팅 및 응답 반환
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // 브라우저 캐싱

    return new Response(object.body, { headers });

  } catch (err) {
    return textResponse("이미지 로드 중 오류 발생: " + err.message, 500);
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