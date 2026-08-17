import { errorMessage, jsonError, jsonResponse, missingBinding } from './_api-utils.js';
import { getAdminAuthContext } from './_admin-auth.js';

export async function onRequestGet(context) {
  try {
    const { env } = context;
    if (!env.DB) {
      return missingBinding('DB', 'D1');
    }

    // 관리자 세션 또는 토큰 유효성 검증
    const authContext = await getAdminAuthContext(context);
    if (!authContext.ok) {
      return jsonResponse({ success: false, error: authContext.error || '접근 권한이 없습니다.' }, 401);
    }

    // 1. total_posts (전체 뉴스 & 공지사항 개수 - deleted 제외)
    const postsCountResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE status != 'deleted'"
    ).first();
    const total_posts = postsCountResult ? postsCountResult.count : 0;

    // 2. total_programs (전체 프로그램 개수 - deleted 제외)
    const programsCountResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM programs WHERE status != 'deleted'"
    ).first();
    const total_programs = programsCountResult ? programsCountResult.count : 0;

    // 3. recruiting_programs (모집 중인 프로그램 개수)
    const recruitingCountResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM programs WHERE status = 'recruiting'"
    ).first();
    const recruiting_programs = recruitingCountResult ? recruitingCountResult.count : 0;

    // 4. recent_posts_count (최근 7일 내 작성된 게시글 수 - SQLite의 datetime 또는 date 처리 호환되도록 기준시간 계산)
    // posts 테이블의 created_at 컬럼 포맷이 'YYYY-MM-DD HH:MM:SS' 또는 datetime 일 것을 감안하여 sqlite의 strftime/date 연산 사용
    const recentPostsResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE status != 'deleted' AND created_at >= datetime('now', '-7 days')"
    ).first();
    const recent_posts_count = recentPostsResult ? recentPostsResult.count : 0;

    return jsonResponse({
      success: true,
      data: {
        total_posts,
        total_programs,
        recruiting_programs,
        recent_posts_count
      }
    });

  } catch (error) {
    return jsonError(errorMessage(error, '대시보드 통계 조회 중 오류가 발생했습니다.'), 500);
  }
}
