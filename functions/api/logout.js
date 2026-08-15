export async function onRequest(context) {
  return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': [
        'admin_access_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0',
        'admin_refresh_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0',
        'admin_session=; Path=/; SameSite=Lax; Max-Age=0'
      ].join(', ')
    }
  });
}

export async function onRequestPost(context) {
  return onRequest(context);
}
