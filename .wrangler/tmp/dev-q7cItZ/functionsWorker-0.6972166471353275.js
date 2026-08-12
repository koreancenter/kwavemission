var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-ZxsqFv/functionsWorker-0.6972166471353275.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
    if (!key) {
      return new Response("\uC774\uBBF8\uC9C0 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", { status: 400 });
    }
    const object = await env.BUCKET.get(key);
    if (!object) {
      return new Response("\uC774\uBBF8\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { status: 404 });
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000");
    return new Response(object.body, { headers });
  } catch (err) {
    return new Response("\uC774\uBBF8\uC9C0 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD: " + err.message, { status: 500 });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    if (!id) {
      return new Response(JSON.stringify({ error: "\uC0AD\uC81C\uD560 \uAE00 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestPost2(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    if (!id) {
      return new Response(JSON.stringify({ error: "\uC0AD\uC81C\uD560 \uD504\uB85C\uADF8\uB7A8 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    await env.DB.prepare("DELETE FROM programs WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequestGet2(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response("slug \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return new Response("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 slug \uD615\uC2DD\uC785\uB2C8\uB2E4.", { status: 400 });
    }
    const docUrl = new URL(`/docs/${slug}.md`, url.origin);
    const res = await fetch(docUrl.toString());
    if (!res.ok) {
      return new Response("\uD574\uB2F9 \uBB38\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { status: 404 });
    }
    const markdownText = await res.text();
    return new Response(markdownText, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    return new Response(`\uC624\uB958 \uBC1C\uC0DD: ${err.message}`, { status: 500 });
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestGet3(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type");
    if (id) {
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();
      return new Response(JSON.stringify(post || {}), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
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
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestGet4(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");
    if (id) {
      const program = await env.DB.prepare(
        "SELECT * FROM programs WHERE id = ?"
      ).bind(id).first();
      return new Response(JSON.stringify(program || {}), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    let stmt;
    if (status && status !== "all") {
      stmt = env.DB.prepare(
        "SELECT * FROM programs WHERE status = ? ORDER BY display_order ASC, id DESC"
      ).bind(status);
    } else {
      stmt = env.DB.prepare(
        "SELECT * FROM programs ORDER BY display_order ASC, id DESC"
      );
    }
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequestPost3(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const thumbnailUrl = formData.get("thumbnail_url");
    if (!id) {
      return new Response(JSON.stringify({ error: "\uC218\uC815\uD560 \uAE00 ID\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }), { status: 400 });
    }
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }), { status: 401 });
    }
    if (!title || !content) {
      return new Response(JSON.stringify({ error: "\uC81C\uBAA9\uACFC \uBCF8\uBB38\uC740 \uD544\uC218 \uC785\uB825 \uD56D\uBAA9\uC785\uB2C8\uB2E4." }), { status: 400 });
    }
    let imageUrl = null;
    const hasUpload = imageFile && typeof imageFile.arrayBuffer === "function" && Number(imageFile.size || 0) > 0;
    if (hasUpload) {
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
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function onRequestPost4(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const password = formData.get("password");
    const type = formData.get("type") || "news";
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const thumbnailUrl = formData.get("thumbnail_url");
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (!title || !content) {
      return new Response(JSON.stringify({ error: "\uC81C\uBAA9\uACFC \uBCF8\uBB38\uC740 \uD544\uC218 \uC785\uB825 \uD56D\uBAA9\uC785\uB2C8\uB2E4." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    let imageUrl = null;
    const hasUpload = imageFile && typeof imageFile.arrayBuffer === "function" && Number(imageFile.size || 0) > 0;
    if (hasUpload) {
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
      await context.env.BUCKET.put(fileName, fileBody, {
        httpMetadata: { contentType: imageFile.type || "application/octet-stream" }
      });
      imageUrl = `/api/image/${fileName}`;
    } else if (typeof thumbnailUrl === "string" && thumbnailUrl.trim()) {
      imageUrl = thumbnailUrl.trim();
    }
    const info = await context.env.DB.prepare(
      "INSERT INTO posts (type, title, content, thumbnail_url) VALUES (?, ?, ?, ?)"
    ).bind(type, title, content, imageUrl).run();
    return new Response(JSON.stringify({ success: true, url: imageUrl, info }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
async function onRequestPost5(context) {
  try {
    const { env, request } = context;
    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    const slug = formData.get("slug");
    const category = formData.get("category");
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status") || "recruiting";
    const icon = formData.get("icon") || "\u{1F393}";
    const is_recommended = formData.get("is_recommended") === "1" ? 1 : 0;
    const display_order = parseInt(formData.get("display_order") || "0", 10);
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (!slug || !category || !title || !description) {
      return new Response(JSON.stringify({ error: "\uC2AC\uB7EC\uADF8, \uCE74\uD14C\uACE0\uB9AC, \uC81C\uBAA9, \uC124\uBA85\uC740 \uD544\uC218 \uD56D\uBAA9\uC785\uB2C8\uB2E4." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (id) {
      await env.DB.prepare(
        `UPDATE programs 
         SET slug = ?, category = ?, title = ?, description = ?, status = ?, icon = ?, is_recommended = ?, display_order = ?
         WHERE id = ?`
      ).bind(slug, category, title, description, status, icon, is_recommended, display_order, id).run();
      return new Response(JSON.stringify({ success: true, message: "\uD504\uB85C\uADF8\uB7A8\uC774 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const info = await env.DB.prepare(
      `INSERT INTO programs (slug, category, title, description, status, icon, is_recommended, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, category, title, description, status, icon, is_recommended, display_order).run();
    return new Response(JSON.stringify({ success: true, info }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
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
    routePath: "/api/update-post",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/write-post",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/write-program",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  }
];
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
__name2(lexer, "lexer");
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
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
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
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
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
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
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
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
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
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
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
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
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
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
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
          passThroughOnException: /* @__PURE__ */ __name2(() => {
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
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
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
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
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
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
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
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
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
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
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
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-jMEqei/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-jMEqei/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
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
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.6972166471353275.js.map
