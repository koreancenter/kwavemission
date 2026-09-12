document.addEventListener('DOMContentLoaded', () => {
  const metricValues = document.querySelectorAll('.metric-value');

  const animateCount = (element) => {
    const target = +element.getAttribute('data-target');
    const duration = 2000; // 애니메이션 지속 시간 (2초)
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      // Ease-out 수식 적용 (마지막에 숫자가 천천히 채워지도록)
      const progress = frame / totalFrames;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutProgress * target);

      element.innerText = currentCount.toLocaleString();

      if (frame === totalFrames) {
        element.innerText = target.toLocaleString();
        clearInterval(counter);
      }
    }, frameDuration);
  };

  // 사용자가 해당 섹션 스크롤에 도달했을 때 동작 (Intersection Observer)
  const observerOptions = {
    threshold: 0.3 // 카드 영역이 화면에 30% 보일 때 작동
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target); // 한 번 실행 후 관찰 중단
      }
    });
  }, observerOptions);

  metricValues.forEach(value => observer.observe(value));
});