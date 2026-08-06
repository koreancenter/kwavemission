export async function onRequestGet(context) {
  const key = context.params.path.join('/');
  const object = await context.env.BUCKET.get(key);

  if (!object) {
    return new Response('Image Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
}
