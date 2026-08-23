// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Count-up animation for metrics strip, triggered once when scrolled into view
const metrics = document.querySelectorAll('.metric');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el) {
  const target = parseFloat(el.dataset.value);
  const suffix = el.dataset.suffix || '';
  const numEl = el.querySelector('.metric-num');
  if (prefersReducedMotion) {
    numEl.textContent = target + suffix;
    return;
  }
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    numEl.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      numEl.textContent = target + suffix;
    }
  }
  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  metrics.forEach((m) => observer.observe(m));
} else {
  metrics.forEach((m) => {
    const target = parseFloat(m.dataset.value);
    const suffix = m.dataset.suffix || '';
    m.querySelector('.metric-num').textContent = target + suffix;
  });
}
