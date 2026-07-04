const FALLBACK_PROJECTS = [
  {
    title: 'Kitchen Extension — Dennistoun',
    category: 'Residential',
    description: 'Single-storey rear extension with full kitchen fit-out: brick laying, joinery, electrical and tiling.',
    beforeImage: 'images/portfolio/placeholder-before.jpg',
    afterImage: 'images/portfolio/placeholder-after.jpg'
  },
  {
    title: 'Bathroom Refurbishment — Shawlands',
    category: 'Residential',
    description: 'Full bathroom strip-out and refit including new plumbing, tiling and plastering.',
    beforeImage: 'images/portfolio/placeholder-before.jpg',
    afterImage: 'images/portfolio/placeholder-after.jpg'
  },
  {
    title: 'Office Fit-Out — Glasgow City Centre',
    category: 'Commercial',
    description: 'Commercial refurbishment covering electrical, plastering and joinery for a small office space.',
    beforeImage: 'images/portfolio/placeholder-before.jpg',
    afterImage: 'images/portfolio/placeholder-after.jpg'
  },
];

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('projects-list');
  if (!list) return;

  let projects = FALLBACK_PROJECTS;

  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) projects = data;
    }
  } catch (err) {
    // Backend not running — use fallback list.
  }

  list.innerHTML = projects.map((p) => {
    const hasBefore = p.beforeImage;
    const hasAfter = p.afterImage;
    const imagesHTML = (hasBefore || hasAfter) ? `
      <div class="ba-images">
        ${hasBefore ? `
          <div class="ba-panel">
            <img src="${escapeHtml(p.beforeImage)}" alt="Before — ${escapeHtml(p.title)}" loading="lazy">
            <span class="ba-label">Before</span>
          </div>` : ''}
        ${hasAfter ? `
          <div class="ba-panel">
            <img src="${escapeHtml(p.afterImage)}" alt="After — ${escapeHtml(p.title)}" loading="lazy">
            <span class="ba-label ba-label-after">After</span>
          </div>` : ''}
      </div>` : '';

    return `
      <div class="project-card">
        ${imagesHTML}
        <div class="project-card-body">
          <span class="eyebrow">${escapeHtml(p.category || 'Project')}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>
        </div>
      </div>`;
  }).join('');
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
