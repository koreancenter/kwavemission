export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Slug parameter is required", { status: 400 });
  }

  // context.env.BUCKET을 통해 R2에 접근
  const object = await env.BUCKET.get(`${slug}.md`);

  if (!object) {
    return new Response("File not found", { status: 404 });
  }

  const body = await object.text();
  return new Response(body, {
    headers: { "Content-Type": "text/markdown;charset=UTF-8" },
  });
}