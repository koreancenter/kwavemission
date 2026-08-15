var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/image/[[path]].js
async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
    if (!key) {
      return textResponse("\uC774\uBBF8\uC9C0 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", 400);
    }
    if (!env.BUCKET) {
      return textResponse("R2 \uBC14\uC778\uB529 'BUCKET'\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.", 503);
    }
    const object = await env.BUCKET.get(key);
    if (!object) {
      return textResponse("\uC774\uBBF8\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000");
    return new Response(object.body, { headers });
  } catch (err) {
    return textResponse("\uC774\uBBF8\uC9C0 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD: " + err.message, 500);
  }
}
__name(onRequestGet, "onRequestGet");
function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
__name(textResponse, "textResponse");

// api/_admin-auth.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function safeBase64UrlEncode(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(safeBase64UrlEncode, "safeBase64UrlEncode");
function safeBase64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(safeBase64UrlDecode, "safeBase64UrlDecode");
function getAdminSecret(env) {
  return env.JWT_SECRET || "";
}
__name(getAdminSecret, "getAdminSecret");
async function signToken(secret, payload, expiresInSeconds = 900) {
  const now = Math.floor(Date.now() / 1e3);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const header = safeBase64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = safeBase64UrlEncode(JSON.stringify(tokenPayload));
  const signingInput = `${header}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const encodedSignature = safeBase64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}
__name(signToken, "signToken");
async function verifyToken(secret, token) {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureBytes = safeBase64UrlDecode(signaturePart);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(signingInput)
    );
    if (!isValid) {
      return null;
    }
    const payload = JSON.parse(decoder.decode(safeBase64UrlDecode(payloadPart)));
    if (!payload || typeof payload.exp !== "number") {
      return null;
    }
    if (Math.floor(Date.now() / 1e3) >= payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed || trimmed.indexOf("=") === -1) return acc;
    const [key, ...rest] = trimmed.split("=");
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}
__name(parseCookies, "parseCookies");
async function getAdminAuthContext(context) {
  const secret = getAdminSecret(context.env);
  if (!secret) {
    return { ok: false, status: 503, error: "JWT_SECRET \uD658\uACBD \uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." };
  }
  const authHeader = context.request.headers.get("authorization") || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const cookieHeader = context.request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = tokenFromHeader || cookies.admin_access_token || "";
  if (!token) {
    return { ok: false, status: 401, error: "\uC778\uC99D \uD1A0\uD070\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." };
  }
  const payload = await verifyToken(secret, token);
  if (!payload || payload.type !== "admin") {
    return { ok: false, status: 401, error: "\uC778\uC99D\uC774 \uB9CC\uB8CC\uB418\uC5C8\uAC70\uB098 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  return { ok: true, user: payload };
}
__name(getAdminAuthContext, "getAdminAuthContext");
async function requireAdminAuth(context, formData) {
  const authContext = await getAdminAuthContext(context);
  if (authContext.ok) {
    return authContext;
  }
  const configuredPassword = String(context.env.ADMIN_PASSWORD || "");
  const legacyPassword = String(formData?.get("password") || "");
  if (configuredPassword && legacyPassword === configuredPassword) {
    return { ok: true, legacy: true };
  }
  return authContext;
}
__name(requireAdminAuth, "requireAdminAuth");

// api/_api-utils.js
function jsonResponse(payload, status = 200, additionalHeaders = {}) {
  const headers = new Headers(additionalHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}
__name(jsonResponse, "jsonResponse");
function jsonSuccess(payload = {}, status = 200) {
  return jsonResponse({ success: true, ...payload }, status);
}
__name(jsonSuccess, "jsonSuccess");
function jsonError(message, status = 500, details) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return jsonResponse(payload, status);
}
__name(jsonError, "jsonError");
function missingBinding(name, resource) {
  return jsonError(
    `${resource} \uBC14\uC778\uB529 '${name}'\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.`,
    503,
    `Cloudflare \uD658\uACBD\uC5D0\uC11C ${name} \uBC14\uC778\uB529\uC744 \uAD6C\uC131\uD574 \uC8FC\uC138\uC694.`
  );
}
__name(missingBinding, "missingBinding");
function errorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}
__name(errorMessage, "errorMessage");

// api/delete-post.js
async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    const idInput = formData.getAll("ids").concat(formData.getAll("id"));
    let idList = [];
    for (const item of idInput) {
      if (typeof item === "string") {
        if (item.startsWith("[")) {
          try {
            idList.push(...JSON.parse(item));
          } catch (e) {
            idList.push(item);
          }
        } else if (item.includes(",")) {
          idList.push(...item.split(","));
        } else {
          idList.push(item);
        }
      }
    }
    idList = idList.map((i) => String(i).trim()).filter(Boolean);
    if (idList.length === 0) {
      return jsonError("\uC0AD\uC81C\uD560 \uAC8C\uC2DC\uAE00 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", 400);
    }
    const statements = idList.map(
      (id) => env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id)
    );
    await env.DB.batch(statements);
    return jsonSuccess({ count: idList.length });
  } catch (err) {
    return jsonError(errorMessage(err, "\uAC8C\uC2DC\uAE00 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost, "onRequestPost");

// api/delete-program.js
async function onRequestPost2(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    const idInput = formData.getAll("ids").concat(formData.getAll("id"));
    let idList = [];
    for (const item of idInput) {
      if (typeof item === "string") {
        if (item.startsWith("[")) {
          try {
            idList.push(...JSON.parse(item));
          } catch (e) {
            idList.push(item);
          }
        } else if (item.includes(",")) {
          idList.push(...item.split(","));
        } else {
          idList.push(item);
        }
      }
    }
    idList = idList.map((i) => String(i).trim()).filter(Boolean);
    if (idList.length === 0) {
      return jsonError("\uC0AD\uC81C\uD560 \uD504\uB85C\uADF8\uB7A8 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", 400);
    }
    const statements = idList.map(
      (id) => env.DB.prepare("DELETE FROM programs WHERE id = ?").bind(id)
    );
    await env.DB.batch(statements);
    return jsonSuccess({ count: idList.length });
  } catch (err) {
    return jsonError(errorMessage(err, "\uD504\uB85C\uADF8\uB7A8 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost2, "onRequestPost");

// api/generate-ai.js
var MAX_TEXT_LENGTH = 5e4;
var MAX_PROMPT_LENGTH = 5e4;
async function generateWithGemini(env, payload) {
  const apiKey = env.GEMINI_API_KEY || payload.apiKey;
  if (!apiKey) throw new Error("Gemini API Key\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: payload.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: payload.text }] }]
      })
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.message || "Gemini \uD638\uCD9C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
  }
  const generatedText = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!generatedText) throw new Error("Gemini\uAC00 \uC0DD\uC131\uB41C \uD14D\uC2A4\uD2B8\uB97C \uBC18\uD658\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  return generatedText;
}
__name(generateWithGemini, "generateWithGemini");
async function generateWithOllama(env, payload) {
  const baseUrl = String(env.OLLAMA_URL || payload.ollamaUrl || "").replace(/\/$/, "");
  const model = String(payload.model || env.OLLAMA_MODEL || "").trim();
  if (!baseUrl) throw new Error("Ollama \uC11C\uBC84 \uC8FC\uC18C\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  if (!model) throw new Error("Ollama \uBAA8\uB378\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
  const parsedUrl = new URL(baseUrl);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Ollama \uC11C\uBC84 \uC8FC\uC18C \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  }
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      system: payload.systemPrompt,
      prompt: payload.text,
      stream: false
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Ollama \uD638\uCD9C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
  const generatedText = String(result.response || "").trim();
  if (!generatedText) throw new Error("Ollama\uAC00 \uC0DD\uC131\uB41C \uD14D\uC2A4\uD2B8\uB97C \uBC18\uD658\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  return generatedText;
}
__name(generateWithOllama, "generateWithOllama");
async function onRequestPost3(context) {
  try {
    const authContext = await getAdminAuthContext(context);
    if (!authContext.ok) {
      return jsonError(authContext.error, authContext.status);
    }
    const payload = await context.request.json().catch(() => null);
    if (!payload || typeof payload.text !== "string" || typeof payload.systemPrompt !== "string") {
      return jsonError("text\uC640 systemPrompt\uB294 \uD544\uC218 \uBB38\uC790\uC5F4\uC785\uB2C8\uB2E4.", 400);
    }
    const text = payload.text.trim();
    const systemPrompt = payload.systemPrompt.trim();
    if (!text || !systemPrompt) {
      return jsonError("\uC6D0\uBB38\uACFC \uD398\uB974\uC18C\uB098 \uD504\uB86C\uD504\uD2B8\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.", 400);
    }
    if (text.length > MAX_TEXT_LENGTH || systemPrompt.length > MAX_PROMPT_LENGTH) {
      return jsonError("AI \uC694\uCCAD \uD14D\uC2A4\uD2B8\uAC00 \uD5C8\uC6A9\uB41C \uAE38\uC774\uB97C \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.", 413);
    }
    const requestPayload = { ...payload, text, systemPrompt };
    const provider = payload.provider === "ollama" ? "ollama" : "gemini";
    const generatedText = provider === "ollama" ? await generateWithOllama(context.env, requestPayload) : await generateWithGemini(context.env, requestPayload);
    return jsonResponse({ success: true, data: { text: generatedText } });
  } catch (error) {
    return jsonError(errorMessage(error, "AI \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost3, "onRequestPost");

// api/get-md.js
async function onRequestGet2(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = String(url.searchParams.get("slug") || "").trim();
    if (!slug) {
      return textResponse2("slug \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", 400);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return textResponse2("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 slug \uD615\uC2DD\uC785\uB2C8\uB2E4.", 400);
    }
    if (!env.DB) {
      return textResponse2("D1 \uBC14\uC778\uB529 'DB'\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.", 503);
    }
    const program = await env.DB.prepare(
      `SELECT slug, title, category, description
       FROM programs
       WHERE slug = ? AND status != 'deleted'
       LIMIT 1`
    ).bind(slug).first();
    if (!program) {
      return textResponse2("\uD574\uB2F9 \uD504\uB85C\uADF8\uB7A8\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 404);
    }
    const markdown = [
      `# ${program.title}`,
      program.category ? `**${program.category}**` : "",
      program.description || ""
    ].filter(Boolean).join("\n\n");
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return textResponse2(`D1 \uD504\uB85C\uADF8\uB7A8 \uBB38\uC11C \uC870\uD68C \uC2E4\uD328: ${err.message}`, 500);
  }
}
__name(onRequestGet2, "onRequestGet");
function textResponse2(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
__name(textResponse2, "textResponse");

// api/get-posts.js
async function onRequestGet3(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type");
    if (id) {
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();
      return jsonResponse({ success: true, data: post || null });
    }
    let stmt;
    if (type && type !== "all") {
      stmt = env.DB.prepare(
        "SELECT id, type, title, thumbnail_url, created_at FROM posts WHERE type = ? ORDER BY created_at DESC"
      ).bind(type);
    } else {
      stmt = env.DB.prepare(
        "SELECT id, type, title, thumbnail_url, created_at FROM posts ORDER BY created_at DESC"
      );
    }
    const { results } = await stmt.all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (error) {
    return jsonError(errorMessage(error, "\uAC8C\uC2DC\uAE00 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestGet3, "onRequestGet");

// api/get-programs.js
async function onRequestGet4(context) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");
    if (id) {
      const program = await env.DB.prepare(
        "SELECT * FROM programs WHERE id = ? AND status != 'deleted'"
      ).bind(id).first();
      return jsonResponse({ success: true, data: program || null });
    }
    let stmt;
    if (status && status !== "all") {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status = ? AND status != 'deleted' ORDER BY display_order ASC, id DESC"
      ).bind(status);
    } else {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status != 'deleted' ORDER BY display_order ASC, id DESC"
      );
    }
    const { results } = await stmt.all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (error) {
    return jsonError(errorMessage(error, "\uD504\uB85C\uADF8\uB7A8 \uC870\uD68C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestGet4, "onRequestGet");

// api/login.js
async function onRequest(context) {
  try {
    const { env, request } = context;
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.JWT_SECRET) {
      return jsonError("\uAD00\uB9AC\uC790 \uC778\uC99D \uD658\uACBD \uBCC0\uC218\uAC00 \uC644\uC804\uD788 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.", 503);
    }
    const contentType = request.headers.get("content-type") || "";
    const adminEmail = env.ADMIN_EMAIL.toLowerCase();
    let body = {};
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    } else {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        body = {
          email: formData.get("email") || "",
          password: formData.get("password") || ""
        };
      }
    }
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    if (!email || !password) {
      return jsonError("\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694.", 400);
    }
    if (email !== adminEmail) {
      return jsonError("Unauthorized", 401);
    }
    if (password !== env.ADMIN_PASSWORD) {
      return jsonError("Invalid password", 401);
    }
    const secret = getAdminSecret(env);
    const accessToken = await signToken(secret, { type: "admin", email }, 60 * 15);
    const refreshToken = await signToken(secret, { type: "admin", email, refresh: true }, 60 * 60 * 24 * 7);
    const cookieOptions = "Path=/; SameSite=Lax; HttpOnly; Max-Age=900";
    const refreshCookieOptions = "Path=/; SameSite=Lax; HttpOnly; Max-Age=604800";
    const sessionCookieOptions = "Path=/; SameSite=Lax; Max-Age=900";
    return jsonResponse({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 60 * 15,
        tokenType: "Bearer"
      }
    }, 200, {
      "Set-Cookie": [
        `admin_access_token=${encodeURIComponent(accessToken)};${cookieOptions}`,
        `admin_refresh_token=${encodeURIComponent(refreshToken)};${refreshCookieOptions}`,
        `admin_session=active;${sessionCookieOptions}`
      ].join(", ")
    });
  } catch (err) {
    return jsonError(errorMessage(err, "\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequest, "onRequest");
async function onRequestPost4(context) {
  return onRequest(context);
}
__name(onRequestPost4, "onRequestPost");

// api/logout.js
async function onRequest2(context) {
  return jsonResponse({ success: true, message: "Logged out" }, 200, {
    "Set-Cookie": [
      "admin_access_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0",
      "admin_refresh_token=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0",
      "admin_session=; Path=/; SameSite=Lax; Max-Age=0"
    ].join(", ")
  });
}
__name(onRequest2, "onRequest");
async function onRequestPost5(context) {
  return onRequest2(context);
}
__name(onRequestPost5, "onRequestPost");

// api/refresh.js
async function onRequest3(context) {
  try {
    const { env, request } = context;
    if (!env.JWT_SECRET) {
      return jsonError("JWT_SECRET \uD658\uACBD \uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.", 503);
    }
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").filter(Boolean).map((pair) => {
        const [key, ...rest] = pair.split("=");
        return [key.trim(), decodeURIComponent(rest.join("="))];
      })
    );
    const refreshToken = String(body.refreshToken || cookies.admin_refresh_token || "").trim();
    if (!refreshToken) {
      return jsonError("Refresh token is required.", 400);
    }
    const payload = await verifyToken(getAdminSecret(env), refreshToken);
    if (!payload || payload.refresh !== true || payload.type !== "admin") {
      return jsonError("Session expired", 401);
    }
    const accessToken = await signToken(getAdminSecret(env), { type: "admin", email: payload.email }, 60 * 15);
    return jsonResponse({
      success: true,
      data: {
        accessToken,
        expiresIn: 60 * 15,
        tokenType: "Bearer"
      }
    }, 200, {
      "Set-Cookie": [
        `admin_access_token=${encodeURIComponent(accessToken)};Path=/;SameSite=Lax;HttpOnly;Max-Age=900`,
        `admin_session=active;Path=/;SameSite=Lax;Max-Age=900`
      ].join(", ")
    });
  } catch (err) {
    return jsonError(errorMessage(err, "\uD1A0\uD070 \uAC31\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequest3, "onRequest");
async function onRequestPost6(context) {
  return onRequest3(context);
}
__name(onRequestPost6, "onRequestPost");

// api/update-post.js
async function onRequestPost7(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const thumbnailUrl = formData.get("thumbnail_url");
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    if (!id) {
      return jsonError("\uC218\uC815\uD560 \uAE00 ID\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", 400);
    }
    if (!title || !content) {
      return jsonError("\uC81C\uBAA9\uACFC \uBCF8\uBB38\uC740 \uD544\uC218 \uC785\uB825 \uD56D\uBAA9\uC785\uB2C8\uB2E4.", 400);
    }
    let imageUrl = null;
    const hasUpload = imageFile && typeof imageFile.arrayBuffer === "function" && Number(imageFile.size || 0) > 0;
    if (hasUpload) {
      if (!env.BUCKET) {
        return missingBinding("BUCKET", "R2");
      }
      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "image/avif": "avif"
      };
      const fallbackExt = mimeToExt[imageFile.type] || "bin";
      const nameExt = typeof imageFile.name === "string" && imageFile.name.includes(".") ? imageFile.name.split(".").pop().toLowerCase() : "";
      const fileExtension = nameExt || fallbackExt;
      const fileName = `images/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const fileBody = await imageFile.arrayBuffer();
      await env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: imageFile.type || "application/octet-stream" }
      });
      imageUrl = `/api/image/${fileName}`;
    } else if (typeof thumbnailUrl === "string" && thumbnailUrl.trim()) {
      imageUrl = thumbnailUrl.trim();
    }
    if (imageUrl) {
      await env.DB.prepare(
        "UPDATE posts SET type = ?, title = ?, content = ?, thumbnail_url = ? WHERE id = ?"
      ).bind(type, title, content, imageUrl, id).run();
    } else {
      await env.DB.prepare(
        "UPDATE posts SET type = ?, title = ?, content = ? WHERE id = ?"
      ).bind(type, title, content, id).run();
    }
    return jsonSuccess();
  } catch (err) {
    return jsonError(errorMessage(err, "\uAC8C\uC2DC\uAE00 \uC218\uC815 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost7, "onRequestPost");

// api/write-post.js
async function onRequestPost8(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const thumbnailUrl = formData.get("thumbnail_url");
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    if (!title || !content) {
      return jsonError("\uC81C\uBAA9\uACFC \uBCF8\uBB38\uC740 \uD544\uC218 \uC785\uB825 \uD56D\uBAA9\uC785\uB2C8\uB2E4.", 400);
    }
    let imageUrl = null;
    const hasUpload = imageFile && typeof imageFile.arrayBuffer === "function" && Number(imageFile.size || 0) > 0;
    if (hasUpload) {
      if (!env.BUCKET) {
        return missingBinding("BUCKET", "R2");
      }
      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "image/avif": "avif"
      };
      const fallbackExt = mimeToExt[imageFile.type] || "bin";
      const nameExt = typeof imageFile.name === "string" && imageFile.name.includes(".") ? imageFile.name.split(".").pop().toLowerCase() : "";
      const fileExtension = nameExt || fallbackExt;
      const fileName = `images/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const fileBody = await imageFile.arrayBuffer();
      await env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: imageFile.type || "application/octet-stream" }
      });
      imageUrl = `/api/image/${fileName}`;
    } else if (typeof thumbnailUrl === "string" && thumbnailUrl.trim()) {
      imageUrl = thumbnailUrl.trim();
    }
    const info = await env.DB.prepare(
      "INSERT INTO posts (type, title, content, thumbnail_url) VALUES (?, ?, ?, ?)"
    ).bind(type, title, content, imageUrl).run();
    return jsonSuccess({ url: imageUrl, info });
  } catch (err) {
    return jsonError(errorMessage(err, "\uAC8C\uC2DC\uAE00 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost8, "onRequestPost");

// api/write-program.js
async function onRequestPost9(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const slug = formData.get("slug");
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status") || "recruiting";
    const icon = formData.get("icon") || "\u{1F393}";
    const is_recommended = formData.get("is_recommended") === "1" ? 1 : 0;
    const display_order = parseInt(formData.get("display_order") || "0", 10);
    const authContext = await requireAdminAuth(context, formData);
    if (!authContext.ok) {
      return jsonError(authContext.error || "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", authContext.status || 401);
    }
    if (!env.DB) {
      return missingBinding("DB", "D1");
    }
    if (!slug || !category || !title || !description) {
      return jsonError("\uC2AC\uB7EC\uADF8, \uCE74\uD14C\uACE0\uB9AC, \uC81C\uBAA9, \uC124\uBA85\uC740 \uD544\uC218 \uD56D\uBAA9\uC785\uB2C8\uB2E4.", 400);
    }
    if (id) {
      await env.DB.prepare(
        `UPDATE programs 
         SET slug = ?, category = ?, title = ?, description = ?, status = ?, icon = ?, is_recommended = ?, display_order = ?
         WHERE id = ?`
      ).bind(slug, category, title, description, status, icon, is_recommended, display_order, id).run();
      return jsonSuccess({ message: "\uD504\uB85C\uADF8\uB7A8\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    }
    const info = await env.DB.prepare(
      `INSERT INTO programs (slug, category, title, description, status, icon, is_recommended, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, category, title, description, status, icon, is_recommended, display_order).run();
    return jsonSuccess({ info });
  } catch (err) {
    return jsonError(errorMessage(err, "\uD504\uB85C\uADF8\uB7A8 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), 500);
  }
}
__name(onRequestPost9, "onRequestPost");

// ../.wrangler/tmp/pages-EnPiiY/functionsRoutes-0.10248330955603857.mjs
var routes = [
  {
    routePath: "/api/image/:path*",
    mountPath: "/api/image",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/delete-post",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/delete-program",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/generate-ai",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/get-md",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/get-posts",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/get-programs",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/logout",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/refresh",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/update-post",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/write-post",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/write-program",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/login",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/logout",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/refresh",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  }
];

// ../../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError2;

// ../.wrangler/tmp/bundle-EYQuTn/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-EYQuTn/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.9100671374973474.mjs.map
