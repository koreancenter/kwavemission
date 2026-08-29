import { requireAdminAuth } from './_admin-auth.js';
import { errorMessage, jsonError, jsonSuccess, missingBinding } from './_api-utils.js';

function generateSecretToken() {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now().toString(36);
  return `kwm_${uuid.slice(0, 16)}${timestamp}`;
}

async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData();
      const obj = {};
      for (const [key, value] of formData.entries()) {
        obj[key] = value;
      }
      return obj;
    } catch {
      return {};
    }
  }
  return {};
}

// 1. GET /api/official : 관리자용 발송 공문 전체 목록 조회
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const authContext = await requireAdminAuth(context);
    if (!authContext.ok) {
      return jsonError(authContext.error || '관리자 인증이 필요합니다.', authContext.status || 401);
    }

    const stmt = env.DB.prepare(
      `SELECT id, doc_no, receiver, sender, title, attachment_url, attachment_name, secret_token, created_at 
       FROM official_letters 
       ORDER BY id DESC`
    );
    const { results } = await stmt.all();

    return jsonSuccess({ data: results || [] });
  } catch (err) {
    return jsonError(errorMessage(err, '공문 목록 조회 중 오류가 발생했습니다.'), 500);
  }
}

// 2. POST /api/official : 관리자용 공문 작성 및 난수 보안 토큰 자동 생성
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const formData = await request.formData();
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || '관리자 인증이 필요합니다.', authContext.status || 401);
    }

    const docNo = String(formData.get('doc_no') || '').trim();
    const receiver = String(formData.get('receiver') || '').trim();
    const sender = String(formData.get('sender') || '케이웨이브 미션 대표선교사').trim() || '케이웨이브 미션 대표선교사';
    const title = String(formData.get('title') || '').trim();
    const content = String(formData.get('content') || '').trim();
    const attachmentFile = formData.get('attachment');

    if (!docNo) {
      return jsonError('문서번호를 입력해 주세요. (예: KWM-2026-0801호)', 400);
    }
    if (!receiver) {
      return jsonError('수신처를 입력해 주세요. (예: OO교회 담임목사 및 선교담당자 귀하)', 400);
    }
    if (!title) {
      return jsonError('공문 제목을 입력해 주세요.', 400);
    }
    if (!content) {
      return jsonError('공문 본문 내용을 입력해 주세요.', 400);
    }

    // 파일 첨부 처리
    let attachmentUrl = null;
    let attachmentName = null;

    const hasUpload = attachmentFile 
      && typeof attachmentFile.arrayBuffer === "function" 
      && Number(attachmentFile.size || 0) > 0;

    if (hasUpload) {
      if (!env.BUCKET) {
        return missingBinding('BUCKET', 'R2');
      }

      const fileExtension = typeof attachmentFile.name === "string" && attachmentFile.name.includes(".")
        ? attachmentFile.name.split('.').pop().toLowerCase()
        : "bin";

      const fileName = `attachments/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const fileBody = await attachmentFile.arrayBuffer();

      await env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: attachmentFile.type || "application/octet-stream" }
      });

      attachmentUrl = `/api/image/${fileName}`;
      attachmentName = attachmentFile.name || fileName;
    }

    // 중복 문서번호 검사
    const existing = await env.DB.prepare(
      'SELECT id FROM official_letters WHERE doc_no = ?'
    ).bind(docNo).first();

    if (existing) {
      return jsonError(`이미 존재하는 문서번호입니다: ${docNo}`, 400);
    }

    // 무작위 난수 보안 토큰 발급
    const secretToken = generateSecretToken();

    const insertResult = await env.DB.prepare(
      `INSERT INTO official_letters (doc_no, receiver, sender, title, content, attachment_url, attachment_name, secret_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(docNo, receiver, sender, title, content, attachmentUrl, attachmentName, secretToken).run();

    const newLetter = await env.DB.prepare(
      'SELECT id, doc_no, receiver, sender, title, attachment_url, attachment_name, secret_token, created_at FROM official_letters WHERE secret_token = ?'
    ).bind(secretToken).first();

    return jsonSuccess({
      message: '공문이 성공적으로 등록되었습니다.',
      data: newLetter,
      token: secretToken,
      meta: insertResult
    }, 201);

  } catch (err) {
    return jsonError(errorMessage(err, '공문 등록 처리 중 오류가 발생했습니다.'), 500);
  }
}

// 3. PUT /api/official or /api/official/:id : 관리자용 기존 공문 수정
export async function onRequestPut(context) {
  try {
    const { env, request, params } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const formData = await request.formData();
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || '관리자 인증이 필요합니다.', authContext.status || 401);
    }

    const url = new URL(request.url);
    const id = params?.id || url.searchParams.get('id') || formData.get('id');

    if (!id) {
      return jsonError('수정할 공문 ID가 지정되지 않았습니다.', 400);
    }

    const docNo = String(formData.get('doc_no') || '').trim();
    const receiver = String(formData.get('receiver') || '').trim();
    const sender = String(formData.get('sender') || '케이웨이브 미션 대표선교사').trim() || '케이웨이브 미션 대표선교사';
    const title = String(formData.get('title') || '').trim();
    const content = String(formData.get('content') || '').trim();
    const attachmentFile = formData.get('attachment');
    const keepAttachment = formData.get('keep_attachment') === 'true';

    if (!docNo) {
      return jsonError('문서번호를 입력해 주세요.', 400);
    }
    if (!receiver) {
      return jsonError('수신처를 입력해 주세요.', 400);
    }
    if (!title) {
      return jsonError('공문 제목을 입력해 주세요.', 400);
    }
    if (!content) {
      return jsonError('공문 본문 내용을 입력해 주세요.', 400);
    }

    // 파일 첨부 처리
    let attachmentUrlQuery = '';
    let attachmentParams = [];

    const hasUpload = attachmentFile 
      && typeof attachmentFile.arrayBuffer === "function" 
      && Number(attachmentFile.size || 0) > 0;

    if (hasUpload) {
      if (!env.BUCKET) {
        return missingBinding('BUCKET', 'R2');
      }

      const fileExtension = typeof attachmentFile.name === "string" && attachmentFile.name.includes(".")
        ? attachmentFile.name.split('.').pop().toLowerCase()
        : "bin";

      const fileName = `attachments/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const fileBody = await attachmentFile.arrayBuffer();

      await env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: attachmentFile.type || "application/octet-stream" }
      });

      const attachmentUrl = `/api/image/${fileName}`;
      const attachmentName = attachmentFile.name || fileName;
      
      attachmentUrlQuery = `, attachment_url = ?, attachment_name = ?`;
      attachmentParams = [attachmentUrl, attachmentName];
    } else if (!keepAttachment) {
      // 기존 파일 삭제 요청
      attachmentUrlQuery = `, attachment_url = NULL, attachment_name = NULL`;
    }

    // 중복 문서번호 검사 (본인 제외)
    const existing = await env.DB.prepare(
      'SELECT id FROM official_letters WHERE doc_no = ? AND id != ?'
    ).bind(docNo, id).first();

    if (existing) {
      return jsonError(`이미 존재하는 다른 공문의 문서번호입니다: ${docNo}`, 400);
    }

    const updateResult = await env.DB.prepare(
      `UPDATE official_letters 
        SET doc_no = ?, receiver = ?, sender = ?, title = ?, content = ? ${attachmentUrlQuery}
       WHERE id = ?`
    ).bind(docNo, receiver, sender, title, content, ...attachmentParams, id).run();

    const updatedLetter = await env.DB.prepare(
      'SELECT id, doc_no, receiver, sender, title, content, attachment_url, attachment_name, secret_token, created_at FROM official_letters WHERE id = ?'
    ).bind(id).first();

    if (!updatedLetter) {
      return jsonError('수정할 공문을 찾을 수 없습니다.', 404);
    }

    return jsonSuccess({
      message: '공문이 성공적으로 수정되었습니다.',
      data: updatedLetter,
      token: updatedLetter.secret_token,
      meta: updateResult
    });

  } catch (err) {
    return jsonError(errorMessage(err, '공문 수정 처리 중 오류가 발생했습니다.'), 500);
  }
}

// 4. DELETE /api/official or /api/official/:id : 관리자용 공문 삭제
export async function onRequestDelete(context) {
  try {
    const { env, request, params } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    const authContext = await requireAdminAuth(context);
    if (!authContext.ok) {
      return jsonError(authContext.error || '관리자 인증이 필요합니다.', authContext.status || 401);
    }

    const url = new URL(request.url);
    let targetId = params?.id || url.searchParams.get('id');

    if (!targetId) {
      const body = await parseRequestBody(request);
      targetId = body.id || body.ids;
    }

    if (!targetId) {
      return jsonError('삭제할 공문 ID가 지정되지 않았습니다.', 400);
    }

    const ids = Array.isArray(targetId) ? targetId : [targetId];
    const statements = ids.map(id => 
      env.DB.prepare('DELETE FROM official_letters WHERE id = ?').bind(id)
    );
    await env.DB.batch(statements);

    return jsonSuccess({ message: '공문이 성공적으로 삭제되었습니다.', count: ids.length });
  } catch (err) {
    return jsonError(errorMessage(err, '공문 삭제 중 오류가 발생했습니다.'), 500);
  }
}
