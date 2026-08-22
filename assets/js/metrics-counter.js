(function () {
  'use strict';

  function initMetricsCounter() {
    const metricValues = document.querySelectorAll('.metric-value');
    if (!metricValues.length) return;

    const animateCount = (element) => {
      const target = +element.getAttribute('data-target') || 0;
      const duration = 1800; // ms
      let startTime = null;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Cubic ease-out
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOutProgress * target);

        element.textContent = currentCount.toLocaleString();

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          element.textContent = target.toLocaleString();
        }
      };

      window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    metricValues.forEach(value => observer.observe(value));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMetricsCounter);
  } else {
    initMetricsCounter();
  }
})();
