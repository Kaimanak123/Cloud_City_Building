// ===========================================================
// Cloud City Building — Backend Server
// Pure Node.js (no npm install required). Serves:
//   - The static frontend (/frontend)
//   - A JSON-file "database" (/backend/data)
//   - REST API: /api/enquiries, /api/services, /api/projects
// Run with:  node server.js
// ===========================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// ---------- tiny JSON-file "database" helpers ----------

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ENQUIRIES_FILE)) {
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(DEFAULT_SERVICES, null, 2));
  }

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2));
  }
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const DEFAULT_SERVICES = [
  { id: 1, name: 'Joinery', description: 'Bespoke carpentry, fitted units, doors, staircases and general timber work for new builds and renovations alike.' },
  { id: 2, name: 'Plumbing', description: 'Bathroom and kitchen installs, leak repairs, full repipes and general plumbing maintenance.' },
  { id: 3, name: 'Gas Engineering', description: 'Boiler installation, servicing, repairs and gas safety checks, all carried out by Gas Safe registered engineers.' },
  { id: 4, name: 'Electrical', description: 'Full and partial rewires, consumer unit upgrades, lighting and certified electrical installation work.' },
  { id: 5, name: 'Plastering', description: 'Wall and ceiling skimming, rendering, dry lining and patch repairs to a smooth, paint-ready finish.' },
  { id: 6, name: 'Brick Laying', description: 'Extension walls, garden walls, repointing and structural brickwork built to current building standards.' },
  { id: 7, name: 'Tiling', description: 'Kitchen and bathroom tiling, floor tiling, and waterproofing for wet areas.' },
  { id: 8, name: 'All Other Trades', description: 'Roofing, flooring, painting and decorating, and general building work — ask us what you need.' },
];

const DEFAULT_PROJECTS = [
  { id: 1, title: 'Kitchen Extension — Dennistoun', category: 'Residential', description: 'Single-storey rear extension with full kitchen fit-out: brick laying, joinery, electrical and tiling.' },
  { id: 2, title: 'Bathroom Refurbishment — Shawlands', category: 'Residential', description: 'Full bathroom strip-out and refit including new plumbing, tiling and plastering.' },
  { id: 3, title: 'Office Fit-Out — Glasgow City Centre', category: 'Commercial', description: 'Commercial refurbishment covering electrical, plastering and joinery for a small office space.' },
];

// ---------- helpers ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req, maxBytes = 1e6) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeForLog(str) {
  return String(str).replace(/[\r\n]/g, ' ').slice(0, 500);
}

// ---------- route handlers ----------

async function handleCreateEnquiry(req, res) {
  let parsed;
  try {
    const body = await readBody(req);
    parsed = JSON.parse(body);
  } catch (err) {
    return sendJSON(res, 400, { error: 'Invalid request body.' });
  }

  const { name, phone, email, service, message } = parsed || {};

  if (!name || !phone || !email || !message) {
    return sendJSON(res, 400, { error: 'Name, phone, email and message are required.' });
  }
  if (!isValidEmail(email)) {
    return sendJSON(res, 400, { error: 'Please provide a valid email address.' });
  }

  const enquiries = readJSON(ENQUIRIES_FILE);
  const enquiry = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 200),
    phone: String(phone).slice(0, 50),
    email: String(email).slice(0, 200),
    service: service ? String(service).slice(0, 100) : '',
    message: String(message).slice(0, 5000),
    receivedAt: new Date().toISOString(),
  };
  enquiries.push(enquiry);
  writeJSON(ENQUIRIES_FILE, enquiries);

  console.log(`[enquiry] ${escapeForLog(enquiry.name)} <${escapeForLog(enquiry.email)}> — ${escapeForLog(enquiry.service || 'general')}`);

  return sendJSON(res, 201, { ok: true, id: enquiry.id });
}

function handleListEnquiries(req, res) {
  // Protected: requires a matching admin token, set via the ADMIN_TOKEN
  // environment variable on your host. Without it set, this route is
  // disabled entirely so customer data is never accidentally exposed.
  const configuredToken = process.env.ADMIN_TOKEN;
  const providedToken = req.headers['x-admin-token'];

  if (!configuredToken) {
    return sendJSON(res, 503, {
      error: 'Enquiry listing is disabled. Set the ADMIN_TOKEN environment variable on your server to enable it.',
    });
  }
  if (providedToken !== configuredToken) {
    return sendJSON(res, 401, { error: 'Invalid or missing admin token.' });
  }

  const enquiries = readJSON(ENQUIRIES_FILE).sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  return sendJSON(res, 200, enquiries);
}

function handleListServices(req, res) {
  return sendJSON(res, 200, readJSON(SERVICES_FILE));
}

function handleListProjects(req, res) {
  return sendJSON(res, 200, readJSON(PROJECTS_FILE));
}

// ---------- static file serving ----------

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(FRONTEND_DIR, urlPath));

  // Prevent path traversal outside the frontend directory.
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<h1>404 — Page not found</h1><p><a href="/">Back home</a></p>');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- server ----------

ensureDataFiles();

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    if (url === '/api/enquiries' && req.method === 'POST') {
      return await handleCreateEnquiry(req, res);
    }
    if (url === '/api/enquiries' && req.method === 'GET') {
      return handleListEnquiries(req, res);
    }
    if (url === '/api/services' && req.method === 'GET') {
      return handleListServices(req, res);
    }
    if (url === '/api/projects' && req.method === 'GET') {
      return handleListProjects(req, res);
    }
    if (url.startsWith('/api/')) {
      return sendJSON(res, 404, { error: 'Not found.' });
    }

    // Everything else: serve the static frontend.
    return serveStatic(req, res);
  } catch (err) {
    console.error(err);
    return sendJSON(res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`Cloud City Building server running at http://localhost:${PORT}`);
  console.log(`Frontend served from: ${FRONTEND_DIR}`);
  console.log(`Data stored in:       ${DATA_DIR}`);
});
