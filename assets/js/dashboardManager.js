(function () {
  'use strict';

  async function fetchDashboardStats() {
    const statsContainer = document.getElementById('dashboardStats');
    if (!statsContainer) return;

    // 관리자 세션이 활성화되지 않은 상태면 대시보드를 숨김
    if (typeof window.AdminApp !== 'undefined' && !window.AdminApp.getAccessToken()) {
      statsContainer.style.display = 'none';
      return;
    }

    try {
      if (!window.AdminApi || !window.AdminApi.api) {
        console.warn('AdminApi is not ready yet');
        return;
      }

      const response = await window.AdminApi.api.get('/api/get-dashboard-stats');
      const payload = response && response.data ? response.data : response;

      if (payload && payload.success === false) {
        throw new Error(payload.error || '통계 로드 실패');
      }

      const stats = payload.data || payload;

      // 엘리먼트에 값 할당
      const elTotalPosts = document.getElementById('stat-total-posts');
      const elTotalPrograms = document.getElementById('stat-total-programs');
      const elRecruitingPrograms = document.getElementById('stat-recruiting-programs');
      const elRecentPosts = document.getElementById('stat-recent-posts');

      if (elTotalPosts) elTotalPosts.textContent = stats.total_posts ?? 0;
      if (elTotalPrograms) elTotalPrograms.textContent = stats.total_programs ?? 0;
      if (elRecruitingPrograms) elRecruitingPrograms.textContent = stats.recruiting_programs ?? 0;
      if (elRecentPosts) elRecentPosts.textContent = stats.recent_posts_count ?? 0;

      // 대시보드 그리드 컨테이너 활성화
      statsContainer.style.display = 'grid';
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // 부드러운 에러 처리: UI를 망가뜨리지 않고 콘솔에만 알림을 남기며, stats를 단순 숨김 처리하거나 대시홀더로 놔둠
      statsContainer.style.display = 'none';
    }
  }

  // 외부에 함수 바인딩하여 게시글/프로그램 변경 시 리프레시 가능하도록 설정
  window.DashboardManager = {
    refresh: fetchDashboardStats
  };
})();
