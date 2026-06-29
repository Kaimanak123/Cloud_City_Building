const FALLBACK_SERVICES = [
  { name: 'Joinery', description: 'Bespoke carpentry, fitted units, doors, staircases and general timber work for new builds and renovations alike.' },
  { name: 'Plumbing', description: 'Bathroom and kitchen installs, leak repairs, full repipes and general plumbing maintenance.' },
  { name: 'Gas Engineering', description: 'Boiler installation, servicing, repairs and gas safety checks, all carried out by Gas Safe registered engineers.' },
  { name: 'Electrical', description: 'Full and partial rewires, consumer unit upgrades, lighting and certified electrical installation work.' },
  { name: 'Plastering', description: 'Wall and ceiling skimming, rendering, dry lining and patch repairs to a smooth, paint-ready finish.' },
  { name: 'Brick Laying', description: 'Extension walls, garden walls, repointing and structural brickwork built to current building standards.' },
  { name: 'Tiling', description: 'Kitchen and bathroom tiling, floor tiling, and waterproofing for wet areas.' },
  { name: 'All Other Trades', description: 'Roofing, flooring, painting and decorating, and general building work — ask us what you need.' },
];

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('services-list');
  if (!list) return;

  let services = FALLBACK_SERVICES;

  try {
    const res = await fetch(`${API_BASE}/api/services`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) services = data;
    }
  } catch (err) {
    // Backend not running — use fallback list defined above.
  }

  list.innerHTML = services
    .map(
      (s) => `
      <div class="card">
        <h3>${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.description)}</p>
      </div>`
    )
    .join('');
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
