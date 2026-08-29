/**
 * render.js
 * ---------
 * Fetches content.json and renders every section of the page.
 * index.html contains no resume content directly — it only defines
 * mount points (ids) and <template> blocks for repeating structures.
 *
 * To update the resume, edit content.json. You should not need to
 * touch this file or index.html for ordinary content changes.
 * See README.md for the full content.json schema.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function loadContent() {
  const res = await fetch('content.json', { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load content.json: ${res.status}`);
  }
  return res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '';
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value ?? '';
}

/* ===== Section renderers ===== */

function renderMeta(meta) {
  document.title = meta.pageTitle;
  setText('page-title', meta.pageTitle);
  document.getElementById('page-description').setAttribute('content', meta.pageDescription || '');

  setText('hero-eyebrow', `${meta.role} — ${meta.location}`);
  setText('hero-name', meta.name);
  setText('hero-sub', meta.heroSub);

  const emailBtn = document.getElementById('hero-email-btn');
  emailBtn.href = `mailto:${meta.email}`;

  setText('footer-name', meta.name);
  const footerEmail = document.getElementById('footer-email');
  footerEmail.href = `mailto:${meta.email}`;
  footerEmail.textContent = meta.email;
  // Profile links (LinkedIn, etc.) from meta.links — appended after the
  // email link, which is static in index.html.
  const linksContainer = document.getElementById('footer-links');
  (meta.links || []).forEach((link) => {
    const a = document.createElement('a');
    a.className = 'footer-link';
    a.href = link.url;
    a.textContent = link.label;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    linksContainer.appendChild(a);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
}

function renderMetrics(metrics) {
  const container = document.getElementById('metrics');
  const tpl = document.getElementById('tpl-metric');

  metrics.forEach((m) => {
    const node = tpl.content.cloneNode(true);
    const metricEl = node.querySelector('.metric');
    const numEl = node.querySelector('.metric-num');
    const labelEl = node.querySelector('.metric-label');

    metricEl.dataset.value = m.value;
    metricEl.dataset.suffix = m.suffix || '';
    labelEl.textContent = m.label;
    numEl.textContent = '0';

    container.appendChild(node);
  });

  animateMetricsOnScroll();
}

function animateMetricsOnScroll() {
  const metricEls = document.querySelectorAll('.metric');

  function animateCount(el) {
    const target = parseFloat(el.dataset.value);
    const suffix = el.dataset.suffix || '';
    const numEl = el.querySelector('.metric-num');

    if (prefersReducedMotion || isNaN(target)) {
      numEl.textContent = (isNaN(target) ? el.dataset.value : target) + suffix;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numEl.textContent = Math.round(target * eased) + suffix;
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
    metricEls.forEach((m) => observer.observe(m));
  } else {
    metricEls.forEach(animateCount);
  }
}

function renderAbout(about) {
  setText('about-kicker', about.kicker);
  setText('about-title', about.title);
  setText('about-body', about.body);
}

function renderInitiative(initiative) {
  setText('initiative-kicker', initiative.kicker);
  setText('initiative-title', initiative.title);
  setText('initiative-badge', initiative.badge);
  setText('initiative-role-title', initiative.roleTitle);

  const paraContainer = document.getElementById('initiative-paragraphs');
  paraContainer.innerHTML = '';
  (initiative.paragraphs || []).forEach((p) => {
    const el = document.createElement('p');
    el.className = 'body-text';
    el.innerHTML = p;
    paraContainer.appendChild(el);
  });

  const metricsContainer = document.getElementById('initiative-metrics');
  const tpl = document.getElementById('tpl-initiative-metric');
  metricsContainer.innerHTML = '';
  (initiative.metrics || []).forEach((m) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.mini-metric-num').textContent = m.value;
    node.querySelector('.mini-metric-label').textContent = m.label;
    metricsContainer.appendChild(node);
  });

  setHTML('initiative-footnote', initiative.footnote);
}

function renderExperience(experience) {
  setText('experience-kicker', experience.kicker);
  setText('experience-title', experience.title);

  const timeline = document.getElementById('timeline');
  const entryTpl = document.getElementById('tpl-timeline-entry');
  const roleBlockTpl = document.getElementById('tpl-role-block');
  timeline.innerHTML = '';

  const entries = experience.entries || [];
  entries.forEach((entry, i) => {
    const node = entryTpl.content.cloneNode(true);
    const dot = node.querySelector('.timeline-dot');
    const line = node.querySelector('.timeline-line');

    if (entry.current) dot.classList.add('timeline-dot-active');
    // Last entry gets no connecting line below it
    if (i === entries.length - 1) line.remove();

    node.querySelector('.timeline-date').textContent = entry.date;
    node.querySelector('h3').textContent = entry.org;
    node.querySelector('.timeline-role').textContent = entry.location;

    const roleBlocksContainer = node.querySelector('.role-blocks');

    if (entry.type === 'role' && entry.positions) {
      entry.positions.forEach((position) => {
        const roleNode = roleBlockTpl.content.cloneNode(true);
        const titleEl = roleNode.querySelector('.role-title');
        const listEl = roleNode.querySelector('.body-list');

        if (position.title) {
          titleEl.innerHTML = position.title;
        } else {
          titleEl.remove();
        }

        (position.bullets || []).forEach((bullet) => {
          const li = document.createElement('li');
          li.innerHTML = bullet;
          listEl.appendChild(li);
        });

        roleBlocksContainer.appendChild(roleNode);
      });
    } else {
      // education or other simple entries: no role blocks needed
      roleBlocksContainer.remove();
    }

    timeline.appendChild(node);
  });
}

function renderSkills(skills) {
  setText('skills-kicker', skills.kicker);
  setText('skills-title', skills.title);

  const grid = document.getElementById('skills-grid');
  const groupTpl = document.getElementById('tpl-skill-group');
  const chipTpl = document.getElementById('tpl-chip');
  grid.innerHTML = '';

  (skills.groups || []).forEach((group) => {
    const groupNode = groupTpl.content.cloneNode(true);
    groupNode.querySelector('.skill-group-label').textContent = group.label;
    const chipRow = groupNode.querySelector('.chip-row');

    (group.items || []).forEach((item) => {
      const chipNode = chipTpl.content.cloneNode(true);
      chipNode.querySelector('.chip').textContent = item;
      chipRow.appendChild(chipNode);
    });

    grid.appendChild(groupNode);
  });
}

function renderFooter(footer) {
  setText('footer-kicker', footer.kicker);
  setText('footer-title', footer.title);
  setText('footer-body', footer.body);
}

/* ===== Boot ===== */

async function init() {
  try {
    const content = await loadContent();
    renderMeta(content.meta);
    renderMetrics(content.metrics);
    renderAbout(content.about);
    renderInitiative(content.initiative);
    renderExperience(content.experience);
    renderSkills(content.skills);
    renderFooter(content.footer);
  } catch (err) {
    console.error('Failed to render page from content.json:', err);
    document.body.innerHTML = `
      <div style="padding: 60px; font-family: monospace; color: #ECEDEF; background: #14171A; min-height: 100vh;">
        <h1>Content failed to load</h1>
        <p>Could not fetch or parse content.json. Check the browser console for details.</p>
        <p>If you're previewing this locally by opening index.html directly, browsers block
        local file fetches for security — run a local server instead, e.g.:</p>
        <pre>python3 -m http.server 8080</pre>
        <p>then visit http://localhost:8080</p>
      </div>
    `;
  }
}

init();
