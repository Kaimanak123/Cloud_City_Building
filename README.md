# Cloud City Building — Website

A complete website for Cloud City Building: five pages (Home, About, Services,
Portfolio, Contact), a working contact form, and a small backend that stores
enquiries plus your services/projects lists — all editable without touching
code once it's live.

## What's inside

```
cloudcity/
├── frontend/          The website itself (HTML/CSS/JS)
│   ├── index.html      Home
│   ├── about.html       About
│   ├── services.html    Services (loads trade list from the backend)
│   ├── portfolio.html   Portfolio (loads project list from the backend)
│   ├── contact.html     Contact form
│   ├── css/style.css
│   ├── js/
│   └── images/logo.png
├── backend/
│   ├── server.js       The whole backend — plain Node.js, no install needed
│   └── data/            Auto-created on first run: your "database" (JSON files)
└── README.md           This file
```

There is no database server to install (no MySQL/Postgres) and no `npm
install` step — `server.js` only uses Node's built-in modules, so it runs
anywhere Node runs. The "database" is three JSON files in `backend/data/`
that the server reads and writes automatically:

- `enquiries.json` — every contact form submission, with timestamp
- `services.json` — the trades shown on the Services page
- `projects.json` — the projects shown on the Portfolio page

You (or anyone with file access) can open `services.json` or `projects.json`
in a text editor and change the wording, add a trade, or add a project — the
website picks it up automatically, no code changes needed.

## Running it yourself, right now

You need [Node.js](https://nodejs.org) installed (any recent version).

```
cd backend
node server.js
```

Then open **http://localhost:3000** in a browser. That's the whole site,
contact form and all, running locally on your computer.

To see saved enquiries: open `backend/data/enquiries.json`, or visit
**http://localhost:3000/api/enquiries** in a browser (see the security note
below before doing this on a live site).

## Putting it live and connecting cloudcitybuilding.com

This needs two things: **hosting** (a server somewhere on the internet to
run the site) and **DNS** (telling your domain where to find that server).
I can't log into your Google Domains or hosting accounts for you, but here's
exactly what to do.

### Step 1 — Choose hosting

The backend is a plain Node.js app, so it runs on any Node-friendly host.
Reasonable options, roughly easiest first:

- **Render** (render.com) — free/cheap tier, deploys straight from a zip or
  GitHub repo, give it the `backend` folder, set the start command to
  `node server.js`.
- **Railway** (railway.app) — similar to Render, very quick setup.
- **A VPS** (DigitalOcean, Linode, etc.) — more control, more setup; run
  `node server.js` behind a process manager like `pm2` and a reverse proxy
  like nginx.

Whichever you choose, the steps are the same shape: create an account,
create a new "web service" / "app", upload or connect this `backend` folder,
tell it to run `node server.js`, and it will give you a live URL like
`https://cloudcity-building.onrender.com`.

### Step 2 — Point the frontend at your live backend

Open `frontend/js/config.js` and change one line:

```js
const API_BASE = 'https://cloudcity-building.onrender.com';
```

(using whatever URL your host gave you in Step 1).

### Step 3 — Connect your domain

In your domain provider (Google Domains, or wherever `cloudcitybuilding.com`
now lives — note Google Domains itself was sold to Squarespace in 2023, so
double-check where your domain is actually managed):

1. Go to the DNS settings for `cloudcitybuilding.com`.
2. Your hosting provider (Render, Railway, etc.) will give you either:
   - An **A record** (an IP address) to add, or
   - A **CNAME record** (a hostname) to add, usually for `www`.
3. Add the record(s) exactly as your host's dashboard instructs — every host
   shows this slightly differently, but it's always copy a value from their
   dashboard into your domain's DNS settings.
4. Most hosts also offer free **HTTPS/SSL** automatically once the DNS
   record is in place — usually no extra step needed.
5. DNS changes can take anywhere from a few minutes to 24 hours to take
   effect.

If you tell me which specific host you've picked, I can give you the exact
field names and values for that provider.

### Step 4 — Re-check everything once live

- Submit a test enquiry through the live Contact page and confirm it shows
  up in your backend's `enquiries.json` (or wherever you choose to view it).
- Check the Services and Portfolio pages load correctly (they fetch from
  your live backend now, not your local one).

## Viewing enquiries safely

`GET /api/enquiries` lists every contact form submission, so it's protected
by a token rather than left open to the public internet. To use it:

1. On your host, set an environment variable `ADMIN_TOKEN` to any long,
   random password you choose (your host's dashboard will have a place to
   set environment variables — e.g. Render and Railway both have an
   "Environment" tab).
2. To view enquiries, send that token in a header, e.g. from a terminal:
   ```
   curl -H "x-admin-token: your-chosen-password" https://your-site.com/api/enquiries
   ```
   Until `ADMIN_TOKEN` is set on the host, this route is disabled outright —
   so customer names, phone numbers and emails are never exposed by
   accident, even if you forget this step.

For day-to-day use, it's simplest to just open `backend/data/enquiries.json`
directly on the server (e.g. via your host's file browser, or `cat
backend/data/enquiries.json` over SSH) rather than calling the API.

## Editing the content yourself later

- **Contact details, address, services blurb on Home/About**: edit the
  relevant `.html` file directly — it's plain text inside standard tags.
- **The trades list on the Services page**: edit `backend/data/services.json`.
- **The projects on the Portfolio page**: edit `backend/data/projects.json`.
- **Colours/fonts**: all defined at the top of `frontend/css/style.css` under
  `:root` — change one value there and it updates everywhere.

## If you'd rather not manage hosting yourself

A lot of small businesses hand this off entirely — a local web developer or
a platform like Squarespace/Wix can take this design and content and host it
for a monthly fee with no server management on your end. Worth weighing the
DIY route above against that, depending on how hands-on you want to be.
