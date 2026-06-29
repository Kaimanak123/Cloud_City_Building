const FALLBACK_PROJECTS = [
  { title: 'Kitchen Extension — Dennistoun', category: 'Residential', description: 'Single-storey rear extension with full kitchen fit-out: brick laying, joinery, electrical and tiling.' },
  { title: 'Bathroom Refurbishment — Shawlands', category: 'Residential', description: 'Full bathroom strip-out and refit including new plumbing, tiling and plastering.' },
  { title: 'Office Fit-Out — Glasgow City Centre', category: 'Commercial', description: 'Commercial refurbishment covering electrical, plastering and joinery for a small office space.' },
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
    // Backend not running — use fallback list defined above.
  }

  list.innerHTML = projects
    .map(
      (p) => `
      <div class="card">
        <span class="eyebrow" style="margin-bottom:0.6rem;">${escapeHtml(p.category || 'Project')}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
      </div>`
    )
    .join('');
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
