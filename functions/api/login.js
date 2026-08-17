import { getAdminConfig, signToken } from './_admin-auth.js';
import { errorMessage, jsonError, jsonResponse } from './_api-utils.js';

export async function onRequest(context) {
  try {
    const { env, request } = context;
    const adminConfig = getAdminConfig(context);

    if (!adminConfig.email || !adminConfig.password || !adminConfig.secret) {
      return jsonError('관리자 인증 환경 변수가 완전히 설정되지 않았습니다.', 503);
    }

    const contentType = request.headers.get('content-type') || '';

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
      return jsonError('이메일과 비밀번호를 입력하세요.', 400);
    }

    if (email !== adminConfig.email) {
      return jsonError('Unauthorized', 401);
    }

    if (password !== adminConfig.password) {
      return jsonError('Invalid password', 401);
    }

    const secret = adminConfig.secret;
    const accessToken = await signToken(secret, { type: 'admin', email }, 60 * 15);
    const refreshToken = await signToken(secret, { type: 'admin', email, refresh: true }, 60 * 60 * 24 * 7);

    const cookieOptions = 'Path=/; SameSite=Lax; HttpOnly; Max-Age=900';
    const refreshCookieOptions = 'Path=/; SameSite=Lax; HttpOnly; Max-Age=604800';
    const sessionCookieOptions = 'Path=/; SameSite=Lax; Max-Age=900';

    return jsonResponse({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 60 * 15,
        tokenType: 'Bearer'
      }
    }, 200, {
      'Set-Cookie': [
        `admin_access_token=${encodeURIComponent(accessToken)};${cookieOptions}`,
        `admin_refresh_token=${encodeURIComponent(refreshToken)};${refreshCookieOptions}`,
        `admin_session=active;${sessionCookieOptions}`
      ].join(', ')
    });
  } catch (err) {
    return jsonError(errorMessage(err, '로그인 처리 중 오류가 발생했습니다.'), 500);
  }
}

export async function onRequestPost(context) {
  return onRequest(context);
}
