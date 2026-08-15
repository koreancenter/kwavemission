import { getAdminSecret, signToken, verifyToken } from './_admin-auth.js';
import { errorMessage, jsonError, jsonResponse } from './_api-utils.js';

export async function onRequest(context) {
  try {
    const { env, request } = context;
    if (!env.JWT_SECRET) {
      return jsonError('JWT_SECRET 환경 변수가 설정되지 않았습니다.', 503);
    }

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
      return jsonError('Refresh token is required.', 400);
    }

    const payload = await verifyToken(getAdminSecret(env), refreshToken);
    if (!payload || payload.refresh !== true || payload.type !== 'admin') {
      return jsonError('Session expired', 401);
    }

    const accessToken = await signToken(getAdminSecret(env), { type: 'admin', email: payload.email }, 60 * 15);

    return jsonResponse({
      success: true,
      data: {
        accessToken,
        expiresIn: 60 * 15,
        tokenType: 'Bearer'
      }
    }, 200, {
      'Set-Cookie': [
        `admin_access_token=${encodeURIComponent(accessToken)};Path=/;SameSite=Lax;HttpOnly;Max-Age=900`,
        `admin_session=active;Path=/;SameSite=Lax;Max-Age=900`
      ].join(', ')
    });
  } catch (err) {
    return jsonError(errorMessage(err, '토큰 갱신 중 오류가 발생했습니다.'), 500);
  }
}

export async function onRequestPost(context) {
  return onRequest(context);
}
