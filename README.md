# dashboardfactory4.0

[![Deploy Readiness](https://github.com/fieldcs9-lab/dashboardfactory4.0/actions/workflows/ci.yml/badge.svg)](https://github.com/fieldcs9-lab/dashboardfactory4.0/actions/workflows/ci.yml)

Smart Factory 4.0 dashboard for machine monitoring, KPI tracking, hourly trends, and shift-based operations view.

## Local Structure

- `index.html`: dashboard shell
- `assets/css/style.css`: UI styles
- `assets/js/config.js`: frontend runtime config
- `assets/js/app.js`: dashboard logic
- `api/status.php`: simulated API payload
- `api/config/thresholds.json`: editable KPI thresholds

## Deploy Overview

This project is prepared for Docker-based deploys on Render or Railway.

- Render reads `render.yaml`
- Railway reads `railway.toml`
- Both platforms can build from `Dockerfile`

## Step-by-Step Deploy

### Render

1. Push the latest `main` branch to GitHub.
2. In Render, create a new Web Service from this repository.
3. Render should detect `render.yaml` automatically.
4. Confirm:
   - Runtime: `Docker`
   - Branch: `main`
5. Start the deploy.
6. After deploy completes, test:
   - `/`
   - `/api/status.php`

### Railway

1. Push the latest `main` branch to GitHub.
2. In Railway, create a new project from this repository.
3. Railway should use `railway.toml` and build from `Dockerfile`.
4. Wait for the public URL to be created.
5. Test:
   - `/`
   - `/api/status.php`

## Runtime Config

Frontend API calls use `window.APP_CONFIG.apiBaseUrl` from `assets/js/config.js`.

- Keep it as `''` when frontend and API are served from the same host.
- Change it only if the API moves to another domain later.

## Custom Domain Later

When you buy a real domain:

1. Add the custom domain in Render or Railway.
2. Copy the DNS records they provide.
3. Add those DNS records at your domain provider.
4. Wait for DNS propagation and SSL provisioning.
5. Re-test `/` and `/api/status.php`.

## CI Checks

GitHub Actions runs deploy-readiness checks on pushes and pull requests to `main`.

Current checks:

- JavaScript syntax check
- PHP syntax check
- Docker image build test
