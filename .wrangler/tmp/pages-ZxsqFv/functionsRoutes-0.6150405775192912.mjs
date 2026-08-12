import { onRequestGet as __api_image___path___js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/image/[[path]].js"
import { onRequestPost as __api_delete_post_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/delete-post.js"
import { onRequestPost as __api_delete_program_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/delete-program.js"
import { onRequestGet as __api_get_md_js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/get-md.js"
import { onRequestGet as __api_get_posts_js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/get-posts.js"
import { onRequestGet as __api_get_programs_js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/get-programs.js"
import { onRequestPost as __api_update_post_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/update-post.js"
import { onRequestPost as __api_write_post_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/write-post.js"
import { onRequestPost as __api_write_program_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/write-program.js"

export const routes = [
    {
      routePath: "/api/image/:path*",
      mountPath: "/api/image",
      method: "GET",
      middlewares: [],
      modules: [__api_image___path___js_onRequestGet],
    },
  {
      routePath: "/api/delete-post",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_post_js_onRequestPost],
    },
  {
      routePath: "/api/delete-program",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_program_js_onRequestPost],
    },
  {
      routePath: "/api/get-md",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_md_js_onRequestGet],
    },
  {
      routePath: "/api/get-posts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_posts_js_onRequestGet],
    },
  {
      routePath: "/api/get-programs",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_programs_js_onRequestGet],
    },
  {
      routePath: "/api/update-post",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_update_post_js_onRequestPost],
    },
  {
      routePath: "/api/write-post",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_write_post_js_onRequestPost],
    },
  {
      routePath: "/api/write-program",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_write_program_js_onRequestPost],
    },
  ]