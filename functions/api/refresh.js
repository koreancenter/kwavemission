import { getAdminSecret, signToken, verifyToken } from './_admin-auth.js';

export async function onRequest(context) {
  try {
    const { env, request } = context;
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').filter(Boolean).map((pair) => {
        const [key, ...rest] = pair.split('=');
        return [key.trim(), decodeURIComponent(rest.join('='))];
      })
    );
    const refreshToken = String(body.refreshToken || cookies.admin_refresh_token || '').trim();

    if (!refreshToken) {
      return new Response(JSON.stringify({ success: false, message: 'Refresh token is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const payload = await verifyToken(getAdminSecret(env), refreshToken);
    if (!payload || payload.refresh !== true || payload.type !== 'admin') {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const accessToken = await signToken(getAdminSecret(env), { type: 'admin', email: payload.email }, 60 * 15);

    return new Response(JSON.stringify({
      success: true,
      data: {
        accessToken,
        expiresIn: 60 * 15,
        tokenType: 'Bearer'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': [
          `admin_access_token=${encodeURIComponent(accessToken)};Path=/;SameSite=Lax;HttpOnly;Max-Age=900`,
          `admin_session=active;Path=/;SameSite=Lax;Max-Age=900`
        ].join(', ')
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || '토큰 갱신 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPost(context) {
  return onRequest(context);
}
