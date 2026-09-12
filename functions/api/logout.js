import { jsonResponse } from './_api-utils.js';

export async function onRequest(context) {
  return jsonResponse({ success: true, message: 'Logged out' }, 200, {
    'Set-Cookie': [
      'admin_access_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0',
      'admin_refresh_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0',
      'admin_session=; Path=/; SameSite=Lax; Max-Age=0'
    ].join(', ')
  });
}

export async function onRequestPost(context) {
  return onRequest(context);
}
