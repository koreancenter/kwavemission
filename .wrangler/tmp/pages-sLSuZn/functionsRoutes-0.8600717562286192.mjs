import { onRequestGet as __api_image___path___js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/image/[[path]].js"
import { onRequestGet as __api_get_posts_js_onRequestGet } from "/home/mrpark/Developer/dev/kwavemission/functions/api/get-posts.js"
import { onRequestPost as __api_write_post_js_onRequestPost } from "/home/mrpark/Developer/dev/kwavemission/functions/api/write-post.js"

export const routes = [
    {
      routePath: "/api/image/:path*",
      mountPath: "/api/image",
      method: "GET",
      middlewares: [],
      modules: [__api_image___path___js_onRequestGet],
    },
  {
      routePath: "/api/get-posts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_posts_js_onRequestGet],
    },
  {
      routePath: "/api/write-post",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_write_post_js_onRequestPost],
    },
  ]