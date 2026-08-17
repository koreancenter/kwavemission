const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LOCAL_AUTH_DEFAULTS = Object.freeze({
  email: 'admin@kwavemission.org',
  password: 'admin',
  secret: 'kwave-mission-local-development-secret'
});

function isLocalRequest(request) {
  if (!request?.url) return false;

  try {
    const hostname = new URL(request.url).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function getAdminConfig(context) {
  const env = context?.env || {};
  const localDefaults = isLocalRequest(context?.request) ? LOCAL_AUTH_DEFAULTS : {};

  return {
    email: String(env.ADMIN_EMAIL || localDefaults.email || '').trim().toLowerCase(),
    password: String(env.ADMIN_PASSWORD || localDefaults.password || ''),
    secret: String(env.JWT_SECRET || localDefaults.secret || '')
  };
}

function safeBase64UrlEncode(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function safeBase64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getAdminSecret(env, request) {
  return getAdminConfig({ env, request }).secret;
}

export async function signToken(secret, payload, expiresInSeconds = 900) {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const header = safeBase64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = safeBase64UrlEncode(JSON.stringify(tokenPayload));
  const signingInput = `${header}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  const encodedSignature = safeBase64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

export async function verifyToken(secret, token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = safeBase64UrlDecode(signaturePart);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(signingInput)
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(decoder.decode(safeBase64UrlDecode(payloadPart)));
    if (!payload || typeof payload.exp !== 'number') {
      return null;
    }

    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed || trimmed.indexOf('=') === -1) return acc;
    const [key, ...rest] = trimmed.split('=');
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export async function getAdminAuthContext(context) {
  const secret = getAdminConfig(context).secret;
  if (!secret) {
    return { ok: false, status: 503, error: 'JWT_SECRET 환경 변수가 설정되지 않았습니다.' };
  }

  const authHeader = context.request.headers.get('authorization') || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookieHeader = context.request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = tokenFromHeader || cookies.admin_access_token || '';

  if (!token) {
    return { ok: false, status: 401, error: '인증 토큰이 필요합니다.' };
  }

  const payload = await verifyToken(secret, token);
  if (!payload || payload.type !== 'admin') {
    return { ok: false, status: 401, error: '인증이 만료되었거나 유효하지 않습니다.' };
  }

  return { ok: true, user: payload };
}

export async function requireAdminAuth(context, formData) {
  const authContext = await getAdminAuthContext(context);
  if (authContext.ok) {
    return authContext;
  }

  const configuredPassword = getAdminConfig(context).password;
  const legacyPassword = String(formData?.get('password') || '');
  if (configuredPassword && legacyPassword === configuredPassword) {
    return { ok: true, legacy: true };
  }

  return authContext;
}
