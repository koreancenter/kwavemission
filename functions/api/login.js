import { getAdminAuthContext, getAdminSecret, signToken } from './_admin-auth.js';

export async function onRequest(context) {
  try {
    const { env, request } = context;
    const contentType = request.headers.get('content-type') || '';
    const adminEmail = (env.ADMIN_EMAIL || 'admin@kwavemission.org').toLowerCase();

    let body = {};
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    } else {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        body = {
          email: formData.get('email') || '',
          password: formData.get('password') || ''
        };
      }
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: '이메일과 비밀번호를 입력하세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (env.ADMIN_EMAIL && email !== adminEmail) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const secret = getAdminSecret(env);
    const accessToken = await signToken(secret, { type: 'admin', email }, 60 * 15);
    const refreshToken = await signToken(secret, { type: 'admin', email, refresh: true }, 60 * 60 * 24 * 7);

    const cookieOptions = 'Path=/; SameSite=Lax; HttpOnly; Max-Age=900';
    const refreshCookieOptions = 'Path=/; SameSite=Lax; HttpOnly; Max-Age=604800';
    const sessionCookieOptions = 'Path=/; SameSite=Lax; Max-Age=900';

    return new Response(JSON.stringify({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 60 * 15,
        tokenType: 'Bearer'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': [
          `admin_access_token=${encodeURIComponent(accessToken)};${cookieOptions}`,
          `admin_refresh_token=${encodeURIComponent(refreshToken)};${refreshCookieOptions}`,
          `admin_session=active;${sessionCookieOptions}`
        ].join(', ')
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || '로그인 처리 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPost(context) {
  return onRequest(context);
}
